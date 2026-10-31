import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
// Ensaio opcional de SQL desde vazio, sem tocar no datadir principal.
const container = process.argv[2];
if (!container || !/^[-a-zA-Z0-9_]+-test$/.test(container))
  throw new Error(
    "Informe explicitamente um contêiner local de teste terminado em -test.",
  );
const env = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[key];
const docker = (args, input) => {
  const r = spawnSync(
    "docker",
    ["--host=unix:///var/run/docker.sock", ...args],
    { env, input, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "Docker falhou");
  return r.stdout;
};
const prefix = "/tmp/hibrido-migration-" + randomUUID(),
  socket = prefix + ".sock";
const mysql = (input) =>
  docker(
    [
      "exec",
      "-i",
      "-u",
      "mysql",
      container,
      "mysql",
      "--socket=" + socket,
      "-uroot",
      "--batch",
      "--skip-column-names",
    ],
    input,
  );
let running = false;
try {
  docker(["exec", "-u", "mysql", container, "mkdir", prefix]);
  docker([
    "exec",
    "-u",
    "mysql",
    container,
    "mysqld",
    "--initialize-insecure",
    "--datadir=" + prefix,
  ]);
  docker([
    "exec",
    "-d",
    "-u",
    "mysql",
    container,
    "mysqld",
    "--datadir=" + prefix,
    "--socket=" + socket,
    "--pid-file=" + prefix + ".pid",
    "--log-error=" + prefix + ".log",
    "--skip-networking",
    "--mysqlx=OFF",
  ]);
  running = true;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      mysql("SELECT 1;");
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!ready)
    throw new Error(
      "Instância isolada não iniciou; veja o log de teste no contêiner.",
    );
  const directories = readdirSync("prisma/migrations")
    .filter((n) => /^\d/.test(n))
    .sort();
  const statements = directories.map((n) =>
    readFileSync("prisma/migrations/" + n + "/migration.sql", "utf8"),
  );
  const expected = statements.join("\n").match(/CREATE TABLE /g).length;
  mysql(
    "CREATE DATABASE hibrido_migration_test; USE hibrido_migration_test;\n" +
      statements.join("\n"),
  );
  const tables = Number(
    mysql(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='hibrido_migration_test';",
    ).trim(),
  );
  if (tables !== expected)
    throw new Error(`Esperadas ${expected} tabelas, encontradas ${tables}.`);
  const flags = mysql(
    "USE hibrido_migration_test; SELECT CONCAT(registrationOpen,':',campaignCreationEnabled,':',version) FROM platform_settings WHERE id='global';",
  ).trim();
  if (flags !== "1:1:1")
    throw new Error("Configuração inicial ausente ou inválida.");
  console.log(
    `${directories.length} migrações SQL aprovadas desde vazio; ${tables} tabelas, constraints e configuração inicial. Datadir principal preservado. Este ensaio não executa o ledger Prisma nem substitui staging.`,
  );
} finally {
  if (running) {
    try {
      mysql("SHUTDOWN;");
    } catch {}
  }
  // Só caminhos aleatórios criados acima; nunca /var/lib/mysql ou volume principal.
  try {
    docker([
      "exec",
      "-u",
      "mysql",
      container,
      "rm",
      "-rf",
      "--",
      prefix,
      socket,
      prefix + ".pid",
      prefix + ".log",
    ]);
  } catch {}
}

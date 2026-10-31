import { spawnSync, spawn } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";

// Apenas um contêiner novo, local e descartável. Nunca lê credenciais de produção.
const temp = mkdtempSync(join(tmpdir(), "origem-database-audit-"));
chmodSync(temp, 0o700);
const name = "origem-security-" + randomBytes(5).toString("hex") + "-test";
const port = 3308;
const password = randomBytes(32).toString("hex");
const env = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[key];
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
  if (result.error || result.status !== 0) {
    const safe = ((result.stdout ?? "") + (result.stderr ?? ""))
      .replaceAll(password, "[redacted]")
      .replace(/mysql:\/\/[^\s"']+/g, "[database-url-redacted]");
    throw new Error(
      "Ensaio interrompido: " +
        command +
        " (saída " +
        result.status +
        "). " +
        safe.slice(-2500),
    );
  }
  return result.stdout;
}
const docker = (args, options) =>
  run("docker", ["--host=unix:///var/run/docker.sock", ...args], options);
const ssl = join(temp, "tls");
let created = false;
const started = performance.now();
try {
  run("mkdir", [ssl]);
  chmodSync(ssl, 0o755);
  run("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    join(ssl, "ca.key"),
    "-out",
    join(ssl, "ca.pem"),
    "-days",
    "1",
    "-subj",
    "/CN=Origem Synthetic Test CA",
  ]);
  run("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    join(ssl, "wrong.key"),
    "-out",
    join(ssl, "wrong.pem"),
    "-days",
    "1",
    "-subj",
    "/CN=Untrusted Synthetic CA",
  ]);
  run("openssl", [
    "req",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    join(ssl, "server.key"),
    "-out",
    join(ssl, "server.csr"),
    "-subj",
    "/CN=localhost",
  ]);
  writeFileSync(
    join(ssl, "extensions.cnf"),
    "subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n",
  );
  run("openssl", [
    "x509",
    "-req",
    "-in",
    join(ssl, "server.csr"),
    "-CA",
    join(ssl, "ca.pem"),
    "-CAkey",
    join(ssl, "ca.key"),
    "-CAcreateserial",
    "-out",
    join(ssl, "server.pem"),
    "-days",
    "1",
    "-extfile",
    join(ssl, "extensions.cnf"),
  ]);
  // Apenas chave efêmera de teste dentro do contêiner; diretório host é privado.
  chmodSync(join(ssl, "server.key"), 0o644);
  chmodSync(join(ssl, "ca.pem"), 0o644);
  chmodSync(join(ssl, "server.pem"), 0o644);
  const envFile = join(temp, "mysql.env");
  writeFileSync(
    envFile,
    `MYSQL_ROOT_PASSWORD=${password}\nMYSQL_ROOT_HOST=%\nMYSQL_DATABASE=origem_fresh_test\n`,
    { mode: 0o600 },
  );
  docker(["image", "inspect", "mysql:8.4", "--format", "{{.Id}}"]);
  docker([
    "create",
    "--name",
    name,
    "--env-file",
    envFile,
    "-p",
    `127.0.0.1:${port}:3306`,
    "mysql:8.4",
    "--ssl-ca=/tmp/origem-tls/ca.pem",
    "--ssl-cert=/tmp/origem-tls/server.pem",
    "--ssl-key=/tmp/origem-tls/server.key",
    "--require-secure-transport=ON",
  ]);
  created = true;
  docker(["cp", ssl, name + ":/tmp/origem-tls"]);
  docker(["start", name]);
  const waitReady = async () => {
    for (let i = 0; i < 60; i++) {
      try {
        docker([
          "exec",
          name,
          "mysqladmin",
          "--protocol=tcp",
          "--host=127.0.0.1",
          "ping",
          "--silent",
        ]);
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    throw new Error("MySQL isolado não ficou pronto.");
  };
  await waitReady();
  const c = {
    ...env,
    NODE_ENV: "test",
    APP_ORIGIN: "http://localhost:5173",
    DATABASE_URL: `mysql://root:${password}@127.0.0.1:${port}/origem_fresh_test`,
    DATABASE_SSL: "true",
    DATABASE_CA_PATH: join(ssl, "ca.pem"),
    CSRF_SECRET: randomBytes(32).toString("hex"),
    AUDIT_DATABASE_DETAILS: "1",
  };
  const prisma = ["node_modules/prisma/build/index.js", "migrate"];
  run(process.execPath, ["--import", "tsx", "scripts/check-database.ts"], {
    env: c,
  });
  run(process.execPath, [...prisma, "deploy"], { env: c });
  run(process.execPath, [...prisma, "status"], { env: c });
  // Processo compilado real, em loopback e sem qualquer publicação externa.
  const server = spawn(process.execPath, ["--max-old-space-size=192", "apps/api/dist/apps/api/src/server.js"], {
    env: { ...c, NODE_ENV: "production", APP_ORIGIN: "https://origem.example.invalid", PORT: "3009", TRUST_PROXY: "0" },
    stdio: "ignore",
  });
  const exited = new Promise((resolve) => server.once("exit", resolve));
  try {
    let ok = false;
    for (let i = 0; i < 40; i++) {
      try { const response = await fetch("http://127.0.0.1:3009/api/ready", { signal: AbortSignal.timeout(1000) }); if (response.status === 200) { ok = true; break; } } catch { /* aguardar inicialização local */ }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ok) throw new Error("Servidor compilado não ficou pronto.");
    const page = await fetch("http://127.0.0.1:3009/login");
    if (!page.ok || !(await page.text()).includes("<title>Origem")) throw new Error("Frontend compilado não foi servido.");
    const denied = await fetch("http://127.0.0.1:3009/api/characters");
    if (denied.status !== 401) throw new Error("Rota privada não protegida no servidor compilado.");
    const notFound = await fetch("http://127.0.0.1:3009/api/unknown-audit-route");
    if (notFound.status !== 404 || !notFound.headers.get("content-type")?.includes("application/json")) throw new Error("Fallback web interceptou API desconhecida.");
  } finally {
    server.kill("SIGTERM");
    const code = await Promise.race([exited, new Promise((resolve) => setTimeout(() => resolve("timeout"), 12000))]);
    if (code === "timeout") { server.kill("SIGKILL"); throw new Error("Shutdown compilado excedeu o prazo."); }
    if (code !== 0) throw new Error("Servidor compilado encerrou com erro.");
  }
  run(
    process.execPath,
    ["--import", "tsx", "scripts/audit-persistence.ts", "prepare"],
    { env: c },
  );
  docker(["restart", name]);
  await waitReady();
  run(
    process.execPath,
    ["--import", "tsx", "scripts/audit-persistence.ts", "verify"],
    { env: c },
  );
  // Emissão de configuração privada no contêiner, sem senha em argv ou stdout.
  const client = (binary, args, input) =>
    docker(
      [
        "exec",
        "-i",
        name,
        "sh",
        "-c",
        'umask 077; cfg=$(mktemp); printf "[client]\\nuser=root\\npassword=%s\\n" "$MYSQL_ROOT_PASSWORD" >"$cfg"; "$@" --defaults-extra-file="$cfg" ' +
          args +
          '; result=$?; rm -f "$cfg"; exit "$result"',
        "audit-client",
        binary,
      ],
      input === undefined ? {} : { input },
    );
  const dump = client(
    "mysqldump",
    "--single-transaction --skip-add-drop-table --set-gtid-purged=OFF origem_fresh_test",
  );
  const key = randomBytes(32),
    iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(dump, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const backup = join(temp, "synthetic-backup.enc");
  writeFileSync(backup, encrypted, { mode: 0o600 });
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const restored = Buffer.concat([
    decipher.update(readFileSync(backup)),
    decipher.final(),
  ]);
  if (
    createHash("sha256").update(restored).digest("hex") !==
    createHash("sha256").update(dump).digest("hex")
  )
    throw new Error("Checksum do backup não confere.");
  client(
    "mysql",
    "--batch --skip-column-names",
    "CREATE DATABASE origem_restored_test;\n",
  );
  client("mysql", "origem_restored_test", restored);
  const restoredEnv = {
    ...c,
    DATABASE_URL: c.DATABASE_URL.replace(
      "origem_fresh_test",
      "origem_restored_test",
    ),
  };
  run(process.execPath, [...prisma, "status"], { env: restoredEnv });
  run(
    process.execPath,
    ["--import", "tsx", "scripts/audit-persistence.ts", "verify"],
    { env: restoredEnv },
  );
  // Certificado incompatível é rejeitado pelo engine Prisma (CA do servidor usada como CA errada).
  const bad = spawnSync(process.execPath, [...prisma, "status"], {
    env: { ...c, DATABASE_CA_PATH: join(ssl, "wrong.pem") },
    encoding: "utf8",
    timeout: 30000,
  });
  if (bad.status === null || bad.status === 0)
    throw new Error("Recusa de CA incompatível pelo Prisma não comprovada.");
  const badApi = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/check-database.ts"],
    {
      env: { ...c, DATABASE_CA_PATH: join(ssl, "wrong.pem") },
      encoding: "utf8",
      timeout: 45000,
    },
  );
  if (badApi.status === null || badApi.status === 0)
    throw new Error("Recusa de CA incompatível pela API não comprovada.");
  run(
    process.execPath,
    ["--import", "tsx", "scripts/audit-persistence.ts", "cleanup"],
    { env: restoredEnv },
  );
  console.log(
    JSON.stringify({
      audit: "isolated_mysql_tls_backup_restore",
      status: "passed",
      migrations: 5,
      freshDeploy: true,
      compiledProductionSmoke: true,
      prismaTLS: true,
      restartPersistence: true,
      encryptedBackup: true,
      restoredApiPersistence: true,
      prismaRejectsUntrustedCA: true,
      apiRejectsUntrustedCA: true,
      durationMs: Math.round(performance.now() - started),
    }),
  );
} catch (error) {
  if (created) {
    try {
      const output = spawnSync(
        "docker",
        ["--host=unix:///var/run/docker.sock", "logs", "--tail", "30", name],
        { env, encoding: "utf8" },
      );
      const log = (output.stdout ?? "") + (output.stderr ?? "");
      console.error(
        log
          .split("\n")
          .filter((line) =>
            /TLS|SSL|certificate|ready for connections|ERROR/.test(line),
          )
          .map((line) => line.replaceAll(password, "[redacted]"))
          .join("\n"),
      );
    } catch {
      /* Sem dump de configuração/credenciais. */
    }
  }
  throw error;
} finally {
  if (created) {
    try {
      docker(["rm", "-f", "-v", name]);
    } catch {
      console.error("Remover manualmente o contêiner sintético: " + name);
    }
  }
  rmSync(temp, { recursive: true, force: true });
}

import { spawnSync } from "node:child_process";
// Cada perfil recebe processos novos para isolar os limites por IP entre dispositivos simulados.
// Mantém os limites reais da API; não os desativa ou aumenta para facilitar testes.
const args = process.argv.slice(2);
const explicitProject = args.some(
  (arg) => arg === "--project" || arg.startsWith("--project="),
);
const projects = explicitProject ? [null] : ["desktop", "mobile"];
let failed = false;
for (const project of projects) {
  const child = spawnSync(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      ...args,
      ...(project ? ["--project=" + project] : []),
    ],
    {
      stdio: "inherit",
      env: { ...process.env, PW_OUTPUT_SUBDIR: project ?? "selected" },
    },
  );
  if (child.error) {
    console.error("Não foi possível iniciar Playwright. Execute npm ci.");
    failed = true;
    break;
  }
  if (child.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);

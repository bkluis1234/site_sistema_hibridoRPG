import { config } from "dotenv";
import { spawn } from "node:child_process";
config({ path: ".env.test", quiet: true });
if (process.platform !== "linux" || process.env.NODE_ENV !== "test" || !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith("_test"))
  throw new Error("Ensaio requer Linux e banco de teste dedicado; nunca produção.");
const base = "http://127.0.0.1:3009";
// Recusa usar um servidor que já estava ouvindo: não mede processo de terceiros.
try { await fetch(base + "/api/health", { signal: AbortSignal.timeout(500) }); throw new Error("Porta de teste ocupada."); }
catch (e) { if (e.message === "Porta de teste ocupada.") throw e; }
const server = spawn(process.execPath, ["apps/api/dist/apps/api/src/server.js"], { env: { ...process.env, PORT: "3009", NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=192` }, stdio: "ignore" });
const stopped = new Promise((resolve) => server.once("exit", resolve));
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + "/api/ready", { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Servidor compilado não iniciou.");
  const load = spawn(process.execPath, ["--import", "tsx", "scripts/audit-load.ts", process.argv[2] ?? "300"], { env: { ...process.env, AUDIT_BASE_URL: base, AUDIT_SERVER_PID: String(server.pid) }, stdio: "inherit" });
  const code = await new Promise((resolve) => load.once("exit", resolve));
  if (code !== 0) process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
  const timer = setTimeout(() => server.kill("SIGKILL"), 12000); timer.unref();
  const code = await stopped; clearTimeout(timer);
  if (code !== 0) process.exitCode = 1;
}

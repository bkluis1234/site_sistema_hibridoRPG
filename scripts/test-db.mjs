import { config } from "dotenv";
import { spawnSync } from "node:child_process";
const result = config({ path: ".env.test", override: true, quiet: true });
if (result.error)
  throw new Error(
    "Crie .env.test a partir do exemplo antes de migrar o banco de testes.",
  );
const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
if (
  process.env.NODE_ENV !== "test" ||
  !url.pathname.endsWith("_test") ||
  url.protocol !== "mysql:"
)
  throw new Error(
    "Operação exige NODE_ENV=test e banco MySQL dedicado terminado em _test.",
  );
const child = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: process.env },
);
process.exit(child.status ?? 1);

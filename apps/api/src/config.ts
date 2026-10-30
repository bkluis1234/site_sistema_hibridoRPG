import { config as dotenv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
// O npm executa workspaces em apps/api; o .env principal permanece na raiz.
// Variáveis injetadas pelo provedor/terminal têm precedência.
dotenv({
  path: [
    fileURLToPath(new URL("../../../.env", import.meta.url)),
    resolve(process.cwd(), ".env"),
  ],
  quiet: true,
});
import { z } from "zod";
const envSchema = z.object({
  PORTRAIT_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(102400)
    .max(10485760)
    .default(5242880),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  APP_ORIGIN: z.url().default("http://localhost:5173"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CSRF_SECRET: z.string().min(32),
  TRUST_PROXY: z.enum(["0", "1"]).default("0"),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  DATABASE_CA_PATH: z.string().optional(),
});
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      "Configuração inválida: " +
        parsed.error.issues.map((i) => i.path.join(".")).join(", "),
    );
  const c = parsed.data;
  if (new URL(c.APP_ORIGIN).origin !== c.APP_ORIGIN)
    throw new Error(
      "APP_ORIGIN deve conter somente a origem, sem caminho/barra final.",
    );
  if (
    c.NODE_ENV === "production" &&
    (!c.APP_ORIGIN.startsWith("https://") ||
      c.DATABASE_SSL !== "true" ||
      /substitua|troque|example/i.test(c.CSRF_SECRET))
  )
    throw new Error(
      "Produção exige HTTPS, TLS no MySQL e segredo CSRF próprio.",
    );
  return c;
}
export type Config = ReturnType<typeof loadConfig>;

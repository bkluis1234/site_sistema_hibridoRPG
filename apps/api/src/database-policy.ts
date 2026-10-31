import { resolve } from "node:path";

// Compartilhado pelo adaptador runtime e pelo Prisma CLI. Não incluir a URL em erros.
export function databasePolicy(env: {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  DATABASE_SSL?: string;
  DATABASE_CA_PATH?: string;
}) {
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("DATABASE_URL inválida.");
  }
  if (url.protocol !== "mysql:" || !url.hostname || url.pathname.length < 2)
    throw new Error("DATABASE_URL deve identificar um banco MySQL.");
  if (
    url.searchParams.has("sslaccept") &&
    url.searchParams.get("sslaccept") !== "strict"
  )
    throw new Error("O MySQL exige validação estrita do certificado TLS.");
  if (
    url.searchParams.has("sslmode") ||
    url.searchParams.has("sslidentity") ||
    url.searchParams.has("sslpassword")
  )
    throw new Error(
      "Parâmetros TLS não suportados; utilize DATABASE_SSL e DATABASE_CA_PATH.",
    );
  const tls =
    env.DATABASE_SSL === "true" ||
    url.searchParams.get("sslaccept") === "strict" ||
    url.searchParams.has("sslcert");
  if (env.NODE_ENV === "production" && !tls)
    throw new Error("Produção exige TLS verificado no MySQL.");
  const givenCA = env.DATABASE_CA_PATH || url.searchParams.get("sslcert");
  const caPath = givenCA ? resolve(givenCA) : undefined;
  if (caPath && !tls) throw new Error("A CA exige DATABASE_SSL=true.");
  if (tls) url.searchParams.set("sslaccept", "strict");
  if (caPath) url.searchParams.set("sslcert", caPath);
  if (!url.searchParams.has("connection_limit"))
    url.searchParams.set("connection_limit", "2");
  if (!url.searchParams.has("connect_timeout"))
    url.searchParams.set("connect_timeout", "5");
  return { url, tls, caPath, prismaUrl: url.toString() };
}

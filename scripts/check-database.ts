import { loadConfig } from "../apps/api/src/config.js";
import { createDb } from "../apps/api/src/db.js";
const c = loadConfig(),
  db = createDb(c);
try {
  const rows = await db.$queryRaw<
    { Variable_name: string; Value: string }[]
  >`SHOW SESSION STATUS LIKE 'Ssl_cipher'`;
  const tls = Boolean(rows[0]?.Value);
  if (c.DATABASE_SSL === "true" && !tls) throw new Error("TLS não confirmado.");
  console.log(JSON.stringify({ database: "ready", tls }));
} catch (error) {
  console.error(
    "Banco indisponível ou TLS não confirmado. Confira host, CA e permissões sem desativar a verificação.",
  );
  if (c.NODE_ENV === "test" && process.env.AUDIT_DATABASE_DETAILS === "1") {
    const info = error as {
      message?: string;
      meta?: { driverAdapterError?: { cause?: unknown } };
    };
    const password = new URL(c.DATABASE_URL).password;
    const detail = JSON.stringify({
      message: info.message,
      cause: info.meta?.driverAdapterError?.cause,
    });
    console.error(
      detail
        .replaceAll(c.DATABASE_URL, "[database-url-redacted]")
        .replaceAll(password, "[redacted]"),
    );
  }
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

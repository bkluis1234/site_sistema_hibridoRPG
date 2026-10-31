import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { Config } from "./config.js";
import { databasePolicy } from "./database-policy.js";
export function createDb(c: Config) {
  const { url, tls, caPath } = databasePolicy(c);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 5000,
    allowPublicKeyRetrieval:
      c.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname),
    ssl: tls
      ? {
          rejectUnauthorized: true,
          ...(caPath ? { ca: readFileSync(caPath, "utf8") } : {}),
        }
      : undefined,
  });
  return new PrismaClient({ adapter });
}

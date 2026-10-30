import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { Config } from "./config.js";
export function createDb(c: Config) {
  const url = new URL(c.DATABASE_URL);
  if (url.protocol !== "mysql:")
    throw new Error("DATABASE_URL precisa ser MySQL.");
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
    ssl:
      c.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized: true,
            ...(c.DATABASE_CA_PATH
              ? { ca: readFileSync(c.DATABASE_CA_PATH, "utf8") }
              : {}),
          }
        : undefined,
  });
  return new PrismaClient({ adapter });
}

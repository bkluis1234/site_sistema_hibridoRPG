import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databasePolicy } from "./apps/api/src/database-policy.js";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: databasePolicy({
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        (process.env.NODE_ENV === "production"
          ? undefined
          : "mysql://invalid:invalid@127.0.0.1:3306/not_configured"),
    }).prismaUrl,
  },
});

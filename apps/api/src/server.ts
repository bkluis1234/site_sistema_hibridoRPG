import express from "express";
import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { createApp } from "./app.js";
const config = loadConfig();
const db = createDb(config);
const app = createApp(db, config);
if (config.NODE_ENV === "production") {
  const web = resolve(process.cwd(), "apps/web/dist");
  app.use(express.static(web, { index: false }));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve(web, "index.html")));
}
const server = app.listen(config.PORT, "0.0.0.0", () =>
  console.log(JSON.stringify({ event: "server_started", port: config.PORT })),
);
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    app.locals.closeGameStreams?.();
    server.close(() => void db.$disconnect().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  });

import { SignalMeasurements } from "./signal-measurements.js";
import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import request from "supertest";
import { createApp } from "../apps/api/src/app.js";
import { createDb } from "../apps/api/src/db.js";
import { loadConfig } from "../apps/api/src/config.js";
import { hashPassword } from "../apps/api/src/security.js";
import { cleanupUsers } from "../tests/helpers/cleanup.js";
config({ path: ".env.test", quiet: true });
const c = loadConfig();
assert(
  c.NODE_ENV === "test" && new URL(c.DATABASE_URL).pathname.endsWith("_test"),
);
const seconds = Number(process.argv[2] ?? 300);
assert(Number.isInteger(seconds) && seconds >= 10 && seconds <= 300);
const db = createDb(c),
  app = createApp(db, c),
  server = createServer(app);
const prefix = "load5_" + randomBytes(4).toString("hex"),
  names: string[] = [];
const controllers: AbortController[] = [];
const readers: Promise<void>[] = [];
let interrupted = false;
const interrupt = () => { interrupted = true; controllers.forEach((c) => c.abort()); };
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
const phase = (name: string) => { process.send?.({ kind: "audit_phase", phase: name }); };
const samples: number[] = [];
const measurements = new SignalMeasurements();
let errors = 0, expectedSignals = 0;
const external = process.env.AUDIT_BASE_URL;
if (external) assert(new URL(external).hostname === "127.0.0.1" && new URL(external).protocol === "http:");
const serverPid = process.env.AUDIT_SERVER_PID;
if (serverPid) assert(/^\d+$/.test(serverPid) && process.platform === "linux");
const memory = () => serverPid
  ? Number(/^VmRSS:\s+(\d+)/m.exec(readFileSync(`/proc/${serverPid}/status`, "utf8"))?.[1] ?? 0) * 1024
  : process.memoryUsage().rss;
const startMemory = memory();
let peakMemory = startMemory;
const sampler = setInterval(() => { peakMemory = Math.max(peakMemory, memory()); }, 100);
sampler.unref();
try {
  if (!external) await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base =
    external ?? "http://127.0.0.1:" + (server.address() as { port: number }).port;
  const password = randomBytes(24).toString("base64url"),
    passwordHash = await hashPassword(password);
  const actors = [];
  for (let i = 0; i < 20; i++) {
    assert(!interrupted, "Ensaio interrompido; executar limpeza.");
    const username = prefix + "_" + i;
    names.push(username);
    const user = await db.user.create({
      data: { username, passwordHash, canCreateCampaigns: i === 0 },
    });
    const agent = request.agent(external ?? app),
      csrf = (await agent.get("/api/auth/csrf")).body.csrfToken;
    const send = (path: string, body: object) =>
      agent
        .post("/api" + path)
        .set("Origin", c.APP_ORIGIN)
        .set("X-CSRF-Token", csrf)
        .send({ operationId: randomUUID(), ...body });
    const login = await agent
      .post("/api/auth/login")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", csrf)
      .send({ username, password });
    assert.equal(login.status, 200);
    const cookie = (login.headers["set-cookie"] as unknown as string[])
      .map((v) => v.split(";")[0])
      .join("; ");
    actors.push({ user, agent, send, cookie, csrf });
  }
  const gm = actors[0]!;
  const campaign = await gm.send("/campaigns", {
    name: "Ensaio sintético de carga",
  });
  assert.equal(campaign.status, 201);
  const campaignId = campaign.body.campaign.id as string;
  await db.campaignMember.createMany({
    data: actors
      .slice(1)
      .map((a) => ({
        campaignId,
        userId: a.user.id,
        role: "PLAYER",
        status: "ACTIVE",
      })),
  });
  const created = await gm.send(`/campaigns/${campaignId}/sessions`, {
    title: "Carga local",
  });
  assert.equal(created.status, 201);
  const id = created.body.session.id as string,
    path = `/sessions/${id}`;
  const active = await gm.send(path + "/start", {
    version: 1,
    reason: "Ensaio sintético autorizado",
  });
  assert.equal(active.status, 200);
  for (const a of actors) {
    const character = await a.agent.post("/api/characters")
      .set("Origin", c.APP_ORIGIN).set("X-CSRF-Token", a.csrf)
      .send({ name: "Ficha sintética de carga" });
    assert.equal(character.status, 201);
    const characterId = character.body.character.id;
    const linked = await a.send(`/campaigns/${campaignId}/characters`, { characterId, version: 1 });
    assert.equal(linked.status, 200);
    const joined = await a.send(path + "/join", { characterId });
    assert.equal(joined.status, 200);
    const controller = new AbortController();
    controllers.push(controller);
    const response = await fetch(base + "/api" + path + "/stream", {
      headers: { Cookie: a.cookie },
      signal: controller.signal,
    });
    assert.equal(response.status, 200);
    readers.push((async () => {
      const reader = response.body!.getReader(),
        decoder = new TextDecoder();
      let pending = "";
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) { if (!controller.signal.aborted) errors++; break; }
          pending += decoder.decode(chunk.value, { stream: true });
          let end: number;
          while ((end = pending.indexOf("\n\n")) >= 0) {
            const block = pending.slice(0, end);
            pending = pending.slice(end + 2);
            const eventId = /^id: (.+)$/m.exec(block)?.[1];
            if (eventId) measurements.receive(eventId, a.user.id, performance.now());
          }
        }
      } catch {
        if (!controller.signal.aborted) errors++;
      }
    })());
  }
  phase("connected");
  const started = performance.now();
  for (let round = 0; round < seconds; round++) {
    assert(!interrupted, "Ensaio interrompido; executar limpeza.");
    peakMemory = Math.max(peakMemory, memory());
    const tick = performance.now();
    await Promise.all(
      actors.map(async (a) => {
        const before = performance.now();
        const response = await a.agent.get("/api" + path);
        samples.push(performance.now() - before);
        if (response.status !== 200) errors++;
      }),
    );
    if (round % 15 === 0) {
      const before = performance.now();
      const event = await gm.send(path + "/events", {
        title: "Métrica local",
        body: "Evento sintético de teste",
        visibility: "PUBLIC",
      });
      assert.equal(event.status, 200);
      const stored = await db.sessionEvent.findFirstOrThrow({
        where: { gameSessionId: id, type: "NARRATIVE_RECORDED" },
        orderBy: { sequence: "desc" },
      });
      measurements.publish(stored.id, before, actors.map((a) => a.user.id));
      expectedSignals += actors.length;
    }
    const wait = Math.max(0, 1000 - (performance.now() - tick));
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  await new Promise((resolve) => setTimeout(resolve, 2500));
  assert(!interrupted, "Ensaio interrompido; executar limpeza.");
  const percentile = (values: number[], p: number) =>
    [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1] ?? null;
  const report = {
    audit: "local_load",
    users: 20,
    seconds,
    elapsedMs: Math.round(performance.now() - started),
    requests: samples.length,
    errors,
    restP95Ms: percentile(samples, 0.95),
    sseP95Ms: percentile(measurements.latencies, 0.95),
    delivered: measurements.latencies.length,
    expectedSignals,
    missingDeliveries: measurements.missingDeliveries,
    rssDeltaMiB: Math.round(
      (memory() - startMemory) / 1048576,
    ),
    rssPeakMiB: Math.round(peakMemory / 1048576),
    participantsWithCharacters: actors.length,
    metricSource: serverPid ? "compiled_backend_process" : "combined_server_and_clients",
  };
  console.log(JSON.stringify(report));
  assert.equal(errors, 0);
  assert.equal(measurements.latencies.length, expectedSignals);
  assert.equal(measurements.missingDeliveries.length, 0);
  assert(report.restP95Ms !== null && report.restP95Ms < 500);
  assert(report.sseP95Ms !== null && report.sseP95Ms < 5000);
} finally {
  clearInterval(sampler);
  controllers.forEach((c) => c.abort());
  await Promise.allSettled(readers);
  phase("clients_disconnected");
  app.locals.closeGameStreams?.();
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await cleanupUsers(db, names);
  await db.$disconnect();
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}

import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../apps/api/src/app.js";
import { createDb } from "../apps/api/src/db.js";
import { loadConfig } from "../apps/api/src/config.js";
import { cleanupUsers } from "../tests/helpers/cleanup.js";
config({ path: ".env.test", quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error("Auditoria exige banco de teste dedicado.");
const c = loadConfig(),
  db = createDb(c),
  app = createApp(db, c);
const manifest = "/tmp/hibrido-auditoria-persistencia.json";
const password = "Senha sintetica apenas para auditoria 2026";
async function agent() {
  const a = request.agent(app);
  const csrf = (await a.get("/api/auth/csrf")).body.csrfToken;
  return {
    a,
    send: (path: string, body: object, method = "POST") =>
      (method === "PATCH" ? a.patch("/api" + path) : a.post("/api" + path))
        .set("Origin", c.APP_ORIGIN)
        .set("X-CSRF-Token", csrf)
        .send(body),
  };
}
try {
  const mode = process.argv[2];
  if (mode === "prepare") {
    const names = [
      "audit_" + randomBytes(6).toString("hex"),
      "audit_" + randomBytes(6).toString("hex"),
    ];
    const primary = await agent();
    assert.equal(
      (
        await primary.send("/auth/register", {
          username: names[0],
          password,
          confirmPassword: password,
          characterName: "Auditoria persistente",
        })
      ).status,
      201,
    );
    const id = (await primary.a.get("/api/characters")).body.characters[0]
      .id as string;
    const initial = (await primary.a.get("/api/characters/" + id + "/sheet"))
      .body.sheet;
    assert.equal(
      (
        await primary.send(
          "/characters/" + id + "/identity",
          {
            ...initial.identity,
            nickname: "Conferido",
            profession: "Auditoria",
            appearance: "Descrição persistente",
            backstory: "Histórico persistente",
            version: 1,
            operationId: randomUUID(),
          },
          "PATCH",
        )
      ).status,
      200,
    );
    const attributes = { AGI: 2, FOR: 1, INT: 1, PRE: 2, VIG: 2 };
    assert.equal(
      (
        await primary.send(
          "/characters/" + id + "/attributes",
          { attributes, version: 1, operationId: randomUUID() },
          "PATCH",
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await primary.send(
          "/characters/" + id + "/skills",
          {
            trained: ["atletismo", "luta", "medicina", "vontade"],
            version: 1,
            operationId: randomUUID(),
          },
          "PATCH",
        )
      ).status,
      200,
    );
    const sheet = (await primary.a.get("/api/characters/" + id + "/sheet")).body
      .sheet;
    assert.equal(
      (
        await primary.send(
          "/characters/" + id + "/resources",
          {
            key: "PV",
            mode: "SET",
            value: 9,
            version: sheet.resources[0].version,
            operationId: randomUUID(),
          },
          "PATCH",
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await primary.send("/characters/" + id + "/inventory", {
          name: "Lanterna de auditoria",
          quantity: 2,
          slotsPerUnit: 1,
          description: "Persistência real",
          notes: "",
          equipment: true,
          type: "Ferramenta",
          damage: "",
          operationId: randomUUID(),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await primary.send(
          "/characters/" + id + "/conditions",
          { fatigue: 1, bleeding: true, version: 1, operationId: randomUUID() },
          "PATCH",
        )
      ).status,
      200,
    );
    const row = await db.character.findUniqueOrThrow({
      where: { id },
      include: {
        attributes: true,
        skills: true,
        resources: true,
        inventory: true,
        conditionState: true,
      },
    });
    assert.equal(row.nickname, "Conferido");
    assert.equal(row.resources.find((r) => r.key === "PV")?.current, 9);
    assert.equal(row.inventory[0]?.quantity, 2);
    assert.equal(row.conditionState?.fatigue, 1);
    assert.equal(row.skills.filter((s) => s.trained).length, 4);
    assert.equal((await primary.send("/auth/logout", {})).status, 204);
    assert.equal((await primary.a.get("/api/auth/me")).status, 401);
    assert.equal(
      (await primary.send("/auth/login", { username: names[0], password }))
        .status,
      200,
    );
    const reopened = (await primary.a.get("/api/characters/" + id + "/sheet"))
      .body.sheet;
    assert.deepEqual(reopened.attributes, attributes);
    assert.equal(reopened.resources[0].current, 9);
    assert.equal(reopened.inventoryUsage, 2);
    const outsider = await agent();
    assert.equal(
      (
        await outsider.send("/auth/register", {
          username: names[1],
          password,
          confirmPassword: password,
        })
      ).status,
      201,
    );
    assert.equal(
      (await outsider.a.get("/api/characters/" + id + "/sheet")).status,
      404,
    );
    writeFileSync(manifest, JSON.stringify({ names, id, attributes }), {
      mode: 0o600,
    });
    console.log(
      JSON.stringify({
        audit: "prepare",
        status: "passed",
        steps: 17,
        mysql: "verified",
        secondClientDenied: true,
      }),
    );
  } else {
    const data = JSON.parse(readFileSync(manifest, "utf8")) as {
      names: string[];
      id: string;
      attributes: object;
    };
    if (mode === "verify") {
      const fresh = await agent();
      assert.equal(
        (await fresh.send("/auth/login", { username: data.names[0], password }))
          .status,
        200,
      );
      const result = await fresh.a.get("/api/characters/" + data.id + "/sheet");
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.sheet.attributes, data.attributes);
      assert.equal(result.body.sheet.identity.nickname, "Conferido");
      assert.equal(
        result.body.sheet.identity.appearance,
        "Descrição persistente",
      );
      assert.equal(result.body.sheet.resources[0].current, 9);
      assert.equal(result.body.sheet.inventory[0].quantity, 2);
      assert.equal(result.body.sheet.conditions.bleeding, true);
      assert.equal(result.body.sheet.conditions.fatigue, 1);
      assert.equal((await fresh.a.get("/api/ready")).status, 200);
      console.log(
        JSON.stringify({
          audit: "after_mysql_and_api_restart",
          status: "passed",
          mysql: "verified",
          identity: true,
          attributes: true,
          training: true,
          resources: true,
          inventory: true,
          conditions: true,
        }),
      );
    } else if (mode === "cleanup") {
      await cleanupUsers(db, data.names);
      unlinkSync(manifest);
      console.log(JSON.stringify({ audit: "cleanup", status: "passed" }));
    } else throw new Error("Use prepare, verify ou cleanup.");
  }
} finally {
  await db.$disconnect();
}

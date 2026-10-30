import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import { config as dotenv } from "dotenv";
import { randomBytes } from "node:crypto";
import { createApp } from "../../apps/api/src/app.js";
import { loadConfig } from "../../apps/api/src/config.js";
import { createDb } from "../../apps/api/src/db.js";
import { tokenHash, randomToken } from "../../apps/api/src/security.js";
dotenv({ path: ".env.test", quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error(
    "Testes de integração exigem NODE_ENV=test e banco terminado em _test.",
  );
const c = loadConfig();
const db = createDb(c);
let app: ReturnType<typeof createApp>;
const names: string[] = [];
const prefix = "it_" + randomBytes(4).toString("hex");
let serial = 0;
const pass = "uma frase de senha segura 26";
async function client() {
  const agent = request.agent(app);
  const response = await agent.get("/api/auth/csrf");
  expect(response.status).toBe(200);
  const csrf = response.body.csrfToken as string;
  return {
    agent,
    csrf,
    post: (path: string, body: object) =>
      agent
        .post("/api" + path)
        .set("Origin", c.APP_ORIGIN)
        .set("x-csrf-token", csrf)
        .send(body),
    patch: (path: string, body: object) =>
      agent
        .patch("/api" + path)
        .set("Origin", c.APP_ORIGIN)
        .set("x-csrf-token", csrf)
        .send(body),
    del: (path: string) =>
      agent
        .delete("/api" + path)
        .set("Origin", c.APP_ORIGIN)
        .set("x-csrf-token", csrf),
  };
}
async function register(extra: Record<string, unknown> = {}) {
  const cl = await client();
  const username = prefix + "_" + ++serial;
  names.push(username);
  const response = await cl.post("/auth/register", {
    username,
    password: pass,
    confirmPassword: pass,
    ...extra,
  });
  expect(response.status).toBe(201);
  return {
    ...cl,
    response,
    username,
    user: response.body.user,
    codes: response.body.recoveryCodes as string[],
  };
}
async function privilegedInvite() {
  const admin = await register();
  await db.user.update({
    where: { id: admin.user.id },
    data: { role: "ADMIN" },
  });
  const invite = await admin.post("/admin/gm-invites", { expiresInHours: 24 });
  expect(invite.status).toBe(201);
  return {
    admin,
    code: invite.body.code as string,
    id: invite.body.invite.id as string,
  };
}
beforeAll(async () => {
  await db.$queryRaw`SELECT 1`;
});
beforeEach(() => {
  app = createApp(db, c);
});
afterAll(async () => {
  const users = await db.user.findMany({
    where: { username: { in: names } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  await db.adminAuditLog.deleteMany({ where: { actorId: { in: ids } } });
  await db.characterAuditLog.deleteMany({ where: { actorId: { in: ids } } });
  await db.character.deleteMany({ where: { ownerId: { in: ids } } });
  await db.privilegeInvite.deleteMany({ where: { createdById: { in: ids } } });
  await db.recoveryCode.deleteMany({ where: { userId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("cadastro, sessões e autorização", () => {
  it("RF-001/005: cadastro transacional cria rascunho, códigos e auditoria no MySQL", async () => {
    const a = await register({ characterName: "Sobrevivente" });
    expect(a.user.role).toBe("PLAYER");
    expect(a.codes).toHaveLength(8);
    const u = await db.user.findUniqueOrThrow({
      where: { id: a.user.id },
      include: { characters: true, recoveryCodes: true, sessions: true },
    });
    expect(u.passwordHash).toMatch(/^\$argon2id/);
    expect(u.characters[0]?.status).toBe("DRAFT");
    expect(u.recoveryCodes.map((r) => r.codeHash)).not.toContain(a.codes[0]);
    const cookies = a.response.headers["set-cookie"] as unknown as string[];
    expect(cookies.join(" ")).toContain("HttpOnly");
    expect(cookies.join(" ")).toContain("SameSite=Lax");
    expect(u.sessions[0]?.tokenHash).toHaveLength(64);
    expect((await a.agent.get("/api/auth/me")).body).not.toHaveProperty(
      "passwordHash",
    );
    expect(
      await db.characterAuditLog.count({ where: { actorId: a.user.id } }),
    ).toBe(1);
  });
  it("RF-002/003: login entre agentes, logout revoga a sessão no servidor", async () => {
    const a = await register();
    const b = await client();
    expect(
      (
        await b.post("/auth/login", {
          username: a.username.toUpperCase(),
          password: pass,
        })
      ).status,
    ).toBe(200);
    expect((await b.agent.get("/api/auth/me")).body.user.id).toBe(a.user.id);
    expect((await b.post("/auth/logout", {})).status).toBe(204);
    expect((await b.agent.get("/api/auth/me")).status).toBe(401);
    expect((await a.agent.get("/api/auth/me")).status).toBe(200);
  });
  it("nega enumeração por mensagem de login e protege conta desabilitada", async () => {
    const a = await register();
    const b = await client();
    const wrong = await b.post("/auth/login", {
      username: a.username,
      password: "errada",
    });
    const missing = await b.post("/auth/login", {
      username: prefix + "_none",
      password: "errada",
    });
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual(missing.body);
    await db.user.update({
      where: { id: a.user.id },
      data: { disabledAt: new Date() },
    });
    expect((await a.agent.get("/api/auth/me")).status).toBe(401);
  });
  it("RN-008/019: payload não pode conceder ADMIN ou permissão GM", async () => {
    const a = await client();
    const username = prefix + "_" + ++serial;
    names.push(username);
    expect(
      (
        await a.post("/auth/register", {
          username,
          password: pass,
          confirmPassword: pass,
          role: "ADMIN",
        })
      ).status,
    ).toBe(400);
    expect(await db.user.count({ where: { username } })).toBe(0);
    const user = await register();
    expect(
      (await user.post("/admin/gm-invites", { expiresInHours: 24 })).status,
    ).toBe(403);
  });
  it("unicidade do login normalizado não cria personagens ou códigos órfãos", async () => {
    const a = await register();
    const b = await client();
    expect(
      (
        await b.post("/auth/register", {
          username: a.username.toUpperCase(),
          password: pass,
          confirmPassword: pass,
          characterName: "Duplicado",
        })
      ).status,
    ).toBe(409);
    expect(await db.character.count({ where: { ownerId: a.user.id } })).toBe(0);
    expect(await db.recoveryCode.count({ where: { userId: a.user.id } })).toBe(
      8,
    );
  });
  it("CSRF: bloqueia token ausente, forjado e origem externa", async () => {
    const a = await register();
    expect(
      (await a.agent.post("/api/characters").send({ name: "Falha" })).status,
    ).toBe(403);
    expect(
      (
        await a.agent
          .post("/api/characters")
          .set("Origin", "https://evil.example")
          .set("x-csrf-token", a.csrf)
          .send({ name: "Falha" })
      ).status,
    ).toBe(403);
    expect(
      (
        await a.agent
          .post("/api/characters")
          .set("Origin", c.APP_ORIGIN)
          .set("x-csrf-token", "forjado")
          .send({ name: "Falha" })
      ).status,
    ).toBe(403);
    expect(await db.character.count({ where: { ownerId: a.user.id } })).toBe(0);
  });
  it("expiração absoluta e por inatividade são verificadas no servidor", async () => {
    const a = await register();
    await db.session.updateMany({
      where: { userId: a.user.id },
      data: { idleExpiresAt: new Date(Date.now() - 1000) },
    });
    expect((await a.agent.get("/api/auth/me")).status).toBe(401);
    const b = await register();
    await db.session.updateMany({
      where: { userId: b.user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await b.agent.get("/api/auth/me")).status).toBe(401);
  });
  it("protege tentativas por conta sem depender só do IP", async () => {
    const a = await client();
    for (let i = 0; i < 12; i++)
      expect(
        (
          await a.post("/auth/login", {
            username: prefix + "_guess",
            password: "errada",
          })
        ).status,
      ).toBe(401);
    expect(
      (
        await a.post("/auth/login", {
          username: prefix + "_guess",
          password: "errada",
        })
      ).status,
    ).toBe(429);
  });
  it("produção emite cookie __Host com Secure, HttpOnly e SameSite", async () => {
    app = createApp(db, {
      ...c,
      NODE_ENV: "production",
      APP_ORIGIN: "https://rpg.example.com",
      DATABASE_SSL: "true",
    });
    const csrf = await request(app).get("/api/auth/csrf");
    const token = csrf.body.csrfToken;
    const username = prefix + "_" + ++serial;
    names.push(username);
    const response = await request(app)
      .post("/api/auth/register")
      .set("Origin", "https://rpg.example.com")
      .set("Cookie", "__Host-hibrido-csrf=" + token)
      .set("x-csrf-token", token)
      .send({ username, password: pass, confirmPassword: pass });
    expect(response.status).toBe(201);
    const cookie = (response.headers["set-cookie"] as unknown as string[]).join(
      " ",
    );
    expect(cookie).toContain("__Host-hibrido-session=");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });
});
describe("recuperação e convites", () => {
  it("RF-004: código é de uso único e recuperação encerra todas as sessões", async () => {
    const a = await register();
    const other = await client();
    expect(
      (
        await other.post("/auth/login", {
          username: a.username,
          password: pass,
        })
      ).status,
    ).toBe(200);
    const recover = await client();
    const input = {
      username: a.username,
      recoveryCode: a.codes[0],
      password: "uma nova senha muito segura",
      confirmPassword: "uma nova senha muito segura",
    };
    const results = await Promise.all([
      recover.post("/auth/recover", input),
      recover.post("/auth/recover", input),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(await db.session.count({ where: { userId: a.user.id } })).toBe(0);
    expect((await a.agent.get("/api/auth/me")).status).toBe(401);
    expect((await other.agent.get("/api/auth/me")).status).toBe(401);
    expect(
      (
        await recover.post("/auth/login", {
          username: a.username,
          password: input.password,
        })
      ).status,
    ).toBe(200);
  });
  it("código inválido não altera senha nem revoga sessões", async () => {
    const a = await register();
    const b = await client();
    expect(
      (
        await b.post("/auth/recover", {
          username: a.username,
          recoveryCode: "invalido",
          password: pass,
          confirmPassword: pass,
        })
      ).status,
    ).toBe(400);
    expect((await a.agent.get("/api/auth/me")).status).toBe(200);
  });
  it("convite GM tem hash, validade, uso único atômico e nunca concede ADMIN", async () => {
    const i = await privilegedInvite();
    const a = await client();
    const b = await client();
    const usernames = [prefix + "_" + ++serial, prefix + "_" + ++serial];
    names.push(...usernames);
    const results = await Promise.all([
      a.post("/auth/register", {
        username: usernames[0],
        password: pass,
        confirmPassword: pass,
        inviteCode: i.code,
      }),
      b.post("/auth/register", {
        username: usernames[1],
        password: pass,
        confirmPassword: pass,
        inviteCode: i.code,
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    const success = results.find((r) => r.status === 201)!;
    expect(success.body.user).toMatchObject({
      role: "PLAYER",
      canCreateCampaigns: true,
    });
    const stored = await db.privilegeInvite.findUniqueOrThrow({
      where: { id: i.id },
    });
    expect(stored.codeHash).toBe(tokenHash(i.code));
    expect(stored.codeHash).not.toBe(i.code);
    expect(stored.usedAt).not.toBeNull();
  });
  it("convites expirados/revogados são recusados sem criar conta", async () => {
    const i = await privilegedInvite();
    expect((await i.admin.del("/admin/gm-invites/" + i.id)).status).toBe(204);
    const a = await client();
    const username = prefix + "_" + ++serial;
    names.push(username);
    expect(
      (
        await a.post("/auth/register", {
          username,
          password: pass,
          confirmPassword: pass,
          inviteCode: i.code,
        })
      ).status,
    ).toBe(400);
    expect(await db.user.count({ where: { username } })).toBe(0);
    const code = randomToken();
    await db.privilegeInvite.create({
      data: {
        codeHash: tokenHash(code),
        createdById: i.admin.user.id,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    expect(
      (
        await a.post("/auth/register", {
          username,
          password: pass,
          confirmPassword: pass,
          inviteCode: code,
        })
      ).status,
    ).toBe(400);
  });
  it("falha por login duplicado reverte consumo do convite", async () => {
    const i = await privilegedInvite();
    const a = await register();
    const b = await client();
    expect(
      (
        await b.post("/auth/register", {
          username: a.username,
          password: pass,
          confirmPassword: pass,
          inviteCode: i.code,
        })
      ).status,
    ).toBe(409);
    expect(
      (await db.privilegeInvite.findUniqueOrThrow({ where: { id: i.id } }))
        .usedAt,
    ).toBeNull();
  });
});
describe("persistência, isolamento e conflitos", () => {
  it("RF-005/006/007/008/018/022: cria, salva e consulta ficha em outro dispositivo", async () => {
    const a = await register();
    const created = await a.post("/characters", { name: "Nome inicial" });
    expect(created.status).toBe(201);
    const id = created.body.character.id;
    const updated = await a.patch("/characters/" + id, {
      name: "Novo nome",
      concept: "Uma história.",
      version: 1,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.character.version).toBe(2);
    const b = await client();
    await b.post("/auth/login", { username: a.username, password: pass });
    expect(
      (await b.agent.get("/api/characters/" + id)).body.character,
    ).toMatchObject({
      name: "Novo nome",
      concept: "Uma história.",
      version: 2,
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: a.user.id } })).username,
    ).toBe(a.username);
    expect(
      await db.characterAuditLog.count({ where: { characterId: id } }),
    ).toBe(2);
  });
  it("RNF-011: duas edições com mesma versão têm um vencedor e um conflito", async () => {
    const a = await register({ characterName: "Conflito" });
    const list = await a.agent.get("/api/characters");
    const id = list.body.characters[0].id;
    const responses = await Promise.all([
      a.patch("/characters/" + id, { name: "A", concept: "", version: 1 }),
      a.patch("/characters/" + id, { name: "B", concept: "", version: 1 }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (await db.character.findUniqueOrThrow({ where: { id } })).version,
    ).toBe(2);
    expect(
      await db.characterAuditLog.count({ where: { characterId: id } }),
    ).toBe(2);
  });
  it("RN-005/015: terceiro e ADMIN sem vínculo não leem nem editam ficha", async () => {
    const a = await register({ characterName: "Privada" });
    const b = await register();
    await db.user.update({ where: { id: b.user.id }, data: { role: "ADMIN" } });
    const id = (await a.agent.get("/api/characters")).body.characters[0].id;
    expect((await b.agent.get("/api/characters/" + id)).status).toBe(404);
    expect(
      (
        await b.patch("/characters/" + id, {
          name: "Intrusão",
          concept: "",
          version: 1,
        })
      ).status,
    ).toBe(404);
    expect((await b.agent.get("/api/characters")).body.characters).toEqual([]);
    expect((await request(app).get("/api/characters/" + id)).status).toBe(401);
  });
  it("rejeita campos mecânicos não autorizados sem modificar versão", async () => {
    const a = await register({ characterName: "Rascunho" });
    const ch = (await a.agent.get("/api/characters")).body.characters[0];
    expect(
      (
        await a.patch("/characters/" + ch.id, {
          name: "Nome",
          concept: "",
          version: 1,
          status: "APPROVED",
          ownerId: randomToken(),
        })
      ).status,
    ).toBe(400);
    expect(
      (await db.character.findUniqueOrThrow({ where: { id: ch.id } })).version,
    ).toBe(1);
  });
  it("não expõe hash dos convites nem códigos de recuperação nas consultas", async () => {
    const i = await privilegedInvite();
    const list = await i.admin.agent.get("/api/admin/gm-invites");
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain(i.code);
    expect(JSON.stringify(list.body)).not.toContain("codeHash");
    const me = await i.admin.agent.get("/api/auth/me");
    expect(Object.keys(me.body.user).sort()).toEqual([
      "canCreateCampaigns",
      "id",
      "role",
      "username",
    ]);
  });
});

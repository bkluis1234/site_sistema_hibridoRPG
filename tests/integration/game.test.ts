import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import request from "supertest";
import { createApp } from "../../apps/api/src/app.js";
import { createDb } from "../../apps/api/src/db.js";
import { loadConfig } from "../../apps/api/src/config.js";
import { cleanupUsers } from "../helpers/cleanup.js";
config({ path: ".env.test", quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error("Use somente MySQL dedicado terminado _test.");
const c = loadConfig(),
  db = createDb(c),
  names: string[] = [],
  prefix = "g4_" + randomBytes(4).toString("hex"),
  pass = "frase sintetica para modo sessao";
let serial = 0;
let app: ReturnType<typeof createApp>;
async function actor(role: "PLAYER" | "GM" | "ADMIN" = "PLAYER") {
  const agent = request.agent(app),
    csrf = (await agent.get("/api/auth/csrf")).body.csrfToken,
    username = prefix + "_" + ++serial;
  names.push(username);
  const signup = await agent
    .post("/api/auth/register")
    .set("Origin", c.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .send({
      username,
      password: pass,
      confirmPassword: pass,
      characterName: "Sobrevivente " + serial,
    });
  expect(signup.status).toBe(201);
  const user = signup.body.user;
  if (role !== "PLAYER")
    await db.user.update({
      where: { id: user.id },
      data: {
        role: role === "ADMIN" ? "ADMIN" : "PLAYER",
        canCreateCampaigns: true,
      },
    });
  const id = (await agent.get("/api/characters")).body.characters[0]
    .id as string;
  const cookie = (signup.headers["set-cookie"] as unknown as string[])
    .map((s) => s.split(";")[0])
    .join("; ");
  const send = (path: string, body: object, method = "POST", gm = false) => {
    const q =
      method === "PATCH"
        ? agent.patch("/api" + path)
        : method === "DELETE"
          ? agent.delete("/api" + path)
          : agent.post("/api" + path);
    return q
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", csrf)
      .set(gm ? { "X-View-Context": "gm" } : {})
      .send({ operationId: randomUUID(), ...body });
  };
  const get = (path: string, gm = false) =>
    agent.get("/api" + path).set(gm ? { "X-View-Context": "gm" } : {});
  return {
    agent,
    user,
    id,
    username,
    csrf,
    cookie,
    send,
    get,
    sheet: async () =>
      (await agent.get("/api/characters/" + id + "/sheet")).body.sheet,
  };
}
type Actor = Awaited<ReturnType<typeof actor>>;
async function party(
  options: { privateToGM?: boolean; start?: boolean; share?: boolean } = {},
) {
  const gm = await actor("GM"),
    owner = await actor(),
    peer = await actor();
  const created = await gm.send("/campaigns", {
    name: "Noite de teste",
    status: "ACTIVE",
    shareSheets: options.share ?? true,
  });
  expect(created.status).toBe(201);
  const campaignId = created.body.campaign.id as string;
  const invite = await gm.send("/campaigns/" + campaignId + "/invites", {
    expiresInHours: 24,
    maxUses: 3,
  });
  expect(invite.status).toBe(201);
  for (const p of [owner, peer]) {
    expect(
      (await p.send("/campaign-memberships/join", { code: invite.body.code }))
        .status,
    ).toBe(200);
    expect(
      (
        await gm.send(
          "/campaigns/" + campaignId + "/members/" + p.user.id,
          {
            version: 1,
            decision: "ACCEPT",
            reason: "Participante sintético conhecido.",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await p.send("/campaigns/" + campaignId + "/characters", {
          characterId: p.id,
          version: (await p.sheet()).version,
        })
      ).status,
    ).toBe(200);
    if (options.share !== false)
      expect(
        (
          await p.send(
            "/characters/" + p.id + "/sharing",
            { version: 1, sharingEnabled: true, publicFields: [] },
            "PATCH",
          )
        ).status,
      ).toBe(200);
  }
  const createdGame = await gm.send("/campaigns/" + campaignId + "/sessions", {
    title: "Vigília",
    privateRollsToGM: options.privateToGM ?? true,
  });
  expect(createdGame.status).toBe(201);
  const sessionId = createdGame.body.session.id as string,
    path = "/sessions/" + sessionId;
  if (options.start !== false) {
    expect(
      (
        await gm.send(path + "/start", {
          version: 1,
          reason: "Início autorizado.",
        })
      ).status,
    ).toBe(200);
    for (const p of [owner, peer])
      expect((await p.send(path + "/join", { characterId: p.id })).status).toBe(
        200,
      );
    expect((await gm.send(path + "/join", { characterId: null })).status).toBe(
      200,
    );
  }
  return { gm, owner, peer, campaignId, sessionId, path };
}
async function currentGame(p: Actor, path: string, gm = false) {
  const r = await p.get(path, gm);
  expect(r.status).toBe(200);
  return r.body.session;
}
async function skillRoll(
  p: Actor,
  path: string,
  visibility = "PUBLIC",
  gm = false,
) {
  const r = await p.send(
    path + "/rolls",
    { characterId: p.id, skillKey: "atletismo", visibility },
    "POST",
    gm,
  );
  expect(r.status).toBe(200);
  return r.body.roll;
}
async function finish(gm: Actor, path: string) {
  const s = await currentGame(gm, path, true);
  const r = await gm.send(path + "/finish", {
    version: s.version,
    reason: "Encerramento confirmado.",
  });
  expect(r.status).toBe(200);
  return r;
}
beforeAll(async () => {
  await db.$queryRaw`SELECT 1`;
});
beforeEach(() => {
  app = createApp(db, c);
});
afterAll(async () => {
  await cleanupUsers(db, names);
  await db.$disconnect();
});

describe("sessões reais e autorização", () => {
  it("somente GM da campanha cria e controla; ADMIN global não tem acesso narrativo automático", async () => {
    const { gm, owner, peer, campaignId, path } = await party({ start: false });
    const admin = await actor("ADMIN"),
      stranger = await actor("GM");
    expect(
      (
        await owner.send("/campaigns/" + campaignId + "/sessions", {
          title: "Indevida",
        })
      ).status,
    ).toBe(403);
    for (const outsider of [admin, stranger]) {
      expect((await outsider.get(path)).status).toBe(404);
      expect(
        (
          await outsider.send(path + "/start", {
            version: 1,
            reason: "Não autorizado.",
          })
        ).status,
      ).toBe(404);
    }
    expect(
      (
        await owner.send(path + "/start", {
          version: 1,
          reason: "Não autorizado.",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await gm.send(path + "/start", {
          version: 1,
          reason: "Autorizado pelo GM.",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await gm.send(path + "/start", {
          version: 1,
          reason: "Estado obsoleto.",
        })
      ).status,
    ).toBe(409);
  });
  it("uma campanha não abre duas sessões simultâneas; estados e versões são persistidos", async () => {
    const { gm, campaignId, path } = await party({ start: false });
    const other = await gm.send("/campaigns/" + campaignId + "/sessions", {
      title: "Outra sessão",
    });
    const paths = [path, "/sessions/" + other.body.session.id];
    const starts = await Promise.all(
      paths.map((p) =>
        gm.send(p + "/start", { version: 1, reason: "Início concorrente." }),
      ),
    );
    expect(starts.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      await db.gameSession.count({ where: { campaignId, activeSlot: 1 } }),
    ).toBe(1);
  });
  it("jogador entra apenas com ficha própria vinculada e só na sessão ativa", async () => {
    const { gm, owner, peer, path } = await party({ start: false });
    expect(
      (await owner.send(path + "/join", { characterId: owner.id })).status,
    ).toBe(409);
    await gm.send(path + "/start", { version: 1, reason: "Abrir a sessão." });
    expect(
      (await owner.send(path + "/join", { characterId: peer.id })).status,
    ).toBe(404);
    expect(
      (await owner.send(path + "/join", { characterId: null })).status,
    ).toBe(400);
    expect(
      (await owner.send(path + "/join", { characterId: owner.id })).status,
    ).toBe(200);
    const roster = (await owner.get(path)).body.participants;
    expect(roster.filter((p: any) => p.user.id === owner.user.id)).toHaveLength(
      1,
    );
  });
  it("pausar bloqueia ações da sala, retomar permite e encerrar mantém histórico somente leitura", async () => {
    const { gm, owner, path } = await party();
    let state = await currentGame(gm, path);
    expect(
      (
        await gm.send(path + "/pause", {
          version: state.version,
          reason: "Intervalo do grupo.",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await owner.send(path + "/rolls", {
          characterId: owner.id,
          expression: "1d20",
          visibility: "PUBLIC",
        })
      ).status,
    ).toBe(409);
    state = await currentGame(gm, path);
    expect(
      (
        await gm.send(path + "/resume", {
          version: state.version,
          reason: "Retorno à mesa.",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await owner.send(path + "/rolls", {
          characterId: owner.id,
          expression: "2d6",
          visibility: "PUBLIC",
        })
      ).status,
    ).toBe(200);
    await finish(gm, path);
    expect(
      (
        await owner.send(path + "/notes", {
          title: "Após fechar",
          body: "Bloqueado",
          visibility: "PUBLIC",
        })
      ).status,
    ).toBe(409);
    expect(
      (await owner.get(path + "/events")).body.entries.some(
        (e: any) => e.type === "SESSION_FINISHED",
      ),
    ).toBe(true);
  });
});
describe("rolagens e privacidade", () => {
  it("motor existente gera dados reais, persiste e compartilha apenas o resultado oficial", async () => {
    const { owner, peer, path, sessionId, campaignId } = await party();
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      const r = await owner.send(path + "/rolls", {
        characterId: owner.id,
        expression: "2d" + sides,
        visibility: "PUBLIC",
      });
      expect(r.status).toBe(200);
      expect(r.body.roll.results).toHaveLength(2);
      expect(
        r.body.roll.results.every((n: number) => n >= 1 && n <= sides),
      ).toBe(true);
      const stored = await db.diceRoll.findUniqueOrThrow({
        where: { id: r.body.roll.id },
      });
      expect(stored.gameSessionId).toBe(sessionId);
      expect(stored.campaignId).toBe(campaignId);
      expect(stored.results).toEqual(r.body.roll.results);
      expect(
        (await peer.get(path + "/rolls")).body.rolls.some(
          (x: any) => x.id === stored.id,
        ),
      ).toBe(true);
    }
  });
  it("PUBLIC/PRIVATE/GM_ONLY/GM_SHARED filtram rolagens, eventos e endpoints legados", async () => {
    const { gm, owner, peer, path } = await party();
    const privateRoll = await owner.send(path + "/rolls", {
      characterId: owner.id,
      expression: "2d6",
      visibility: "PRIVATE",
    });
    const secret = await gm.send(
      path + "/rolls",
      { characterId: owner.id, expression: "1d100", visibility: "GM_ONLY" },
      "POST",
      true,
    );
    const shared = await gm.send(
      path + "/rolls",
      { characterId: null, expression: "3d6", visibility: "GM_SHARED" },
      "POST",
      true,
    );
    expect(secret.status).toBe(200);
    expect(shared.status).toBe(200);
    const mine = (await owner.get(path + "/rolls")).body.rolls,
      others = (await peer.get(path + "/rolls")).body.rolls,
      master = (await gm.get(path + "/rolls", true)).body.rolls;
    expect(mine.some((r: any) => r.id === privateRoll.body.roll.id)).toBe(true);
    expect(others.some((r: any) => r.id === privateRoll.body.roll.id)).toBe(
      false,
    );
    expect(master.some((r: any) => r.id === privateRoll.body.roll.id)).toBe(
      true,
    );
    for (const p of [owner, peer]) {
      expect(JSON.stringify((await p.get(path + "/rolls")).body)).not.toContain(
        secret.body.roll.id,
      );
      expect(
        JSON.stringify((await p.get(path + "/events")).body),
      ).not.toContain(secret.body.roll.id);
    }
    expect(JSON.stringify((await gm.get(path + "/rolls")).body)).not.toContain(
      secret.body.roll.id,
    );
    expect(
      JSON.stringify(
        (await owner.get("/characters/" + owner.id + "/rolls")).body,
      ),
    ).not.toContain(secret.body.roll.id);
    expect(
      JSON.stringify(
        (await owner.get("/characters/" + owner.id + "/history")).body,
      ),
    ).not.toContain(secret.body.roll.id);
    expect(others.some((r: any) => r.id === shared.body.roll.id)).toBe(true);
  });
  it("privacidade configurada pode excluir GM de rolagem pessoal; filtros não expõem contadores secretos", async () => {
    const { gm, owner, peer, path } = await party({ privateToGM: false });
    const r = await owner.send(path + "/rolls", {
      characterId: owner.id,
      expression: "1d6",
      visibility: "PRIVATE",
    });
    expect((await gm.get(path + "/rolls", true)).body.rolls).toHaveLength(0);
    for (const filter of ["ALL", "MINE", "SKILL", "DAMAGE", "GM"]) {
      const response = await peer.get(path + "/rolls?filter=" + filter);
      expect(response.body.rolls).toHaveLength(0);
      expect(response.body).not.toHaveProperty("total");
    }
    expect(
      (await peer.get(path + "/rolls?before=" + r.body.roll.id)).status,
    ).toBe(409);
  });
  it("cliente não fabrica dados, sucesso, personagem alheio ou visibilidade GM", async () => {
    const { owner, peer, path } = await party();
    expect(
      (
        await owner.send(path + "/rolls", {
          characterId: owner.id,
          expression: "1d20",
          visibility: "PUBLIC",
          results: [1],
          outcome: "SUCCESS",
        })
      ).status,
    ).toBe(400);
    for (const visibility of ["GM_ONLY", "GM_SHARED"])
      expect(
        (
          await owner.send(path + "/rolls", {
            characterId: owner.id,
            expression: "1d6",
            visibility,
          })
        ).status,
      ).toBe(403);
    expect(
      (
        await owner.send(path + "/rolls", {
          characterId: peer.id,
          expression: "1d6",
          visibility: "PUBLIC",
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await owner.send(path + "/rolls", {
          characterId: owner.id,
          skillKey: "atletismo",
          visibility: "PUBLIC",
          contextModifier: 2,
          modifierReason: "Tentei me autorizar.",
        })
      ).status,
    ).toBe(403);
  });
  it("fadiga usa política persistida, preserva base e GM pode justificar modificador", async () => {
    const { gm, owner, path, campaignId } = await party();
    await db.campaign.update({
      where: { id: campaignId },
      data: { physicalSkillKeys: ["fortitude"] },
    });
    let s = await owner.sheet();
    expect(
      (
        await owner.send(
          path + "/conditions",
          { characterId: owner.id, version: s.conditions.version, fatigue: 2 },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    const r = await gm.send(
      path + "/rolls",
      {
        characterId: owner.id,
        skillKey: "fortitude",
        visibility: "PUBLIC",
        contextModifier: 3,
        modifierReason: "Condição contextual decidida pelo GM.",
      },
      "POST",
      true,
    );
    expect(r.status).toBe(200);
    expect(r.body.roll).toMatchObject({
      baseTarget: 11,
      fatiguePenalty: -4,
      contextModifier: 3,
      target: 10,
    });
    const athletics = await skillRoll(owner, path);
    expect(athletics.fatiguePenalty).toBe(0);
    expect(
      (await owner.sheet()).skills.find((s: any) => s.key === "fortitude")
        .baseTarget,
    ).toBe(11);
  });
});
describe("recursos, PE, condições e inventário integrados", () => {
  it("recurso usa valor anterior do MySQL, emite delta e repetição idempotente não duplica", async () => {
    const { gm, owner, peer, path } = await party();
    const s = await owner.sheet(),
      pv = s.resources.find((r: any) => r.key === "PV"),
      operationId = randomUUID();
    const input = {
      operationId,
      characterId: owner.id,
      key: "PV",
      mode: "ADJUST",
      value: -3,
      event: "DAMAGE",
      version: pv.version,
    };
    const first = await owner.send(path + "/resources", input, "PATCH"),
      again = await owner.send(path + "/resources", input, "PATCH");
    expect(first.status).toBe(200);
    expect(again.status).toBe(200);
    expect(
      (await owner.sheet()).resources.find((r: any) => r.key === "PV").current,
    ).toBe(pv.current - 3);
    const events = (await peer.get(path + "/events")).body.entries.filter(
      (e: any) => e.type === "RESOURCE_CHANGED",
    );
    expect(events).toHaveLength(1);
    expect(events[0].data).toMatchObject({
      resource: "PV",
      previous: pv.current,
      current: pv.current - 3,
      difference: -3,
    });
    expect(
      (
        await peer.send(
          path + "/resources",
          { ...input, operationId: randomUUID() },
          "PATCH",
        )
      ).status,
    ).toBe(404);
    expect(
      (await gm.get(path, true)).body.participants
        .find((p: any) => p.characterId === owner.id)
        .resources.find((r: any) => r.key === "PV").current,
    ).toBe(pv.current - 3);
  });
  it("decisão de PE reutiliza a transação e mesma requisição não gasta duas vezes", async () => {
    const { owner, path } = await party();
    const s = await owner.sheet(),
      pe = s.resources.find((r: any) => r.key === "PE"),
      roll = await skillRoll(owner, path);
    const input = {
      operationId: randomUUID(),
      version: roll.version,
      action: "BONUS",
    };
    const results = await Promise.all([
      owner.send(path + "/rolls/" + roll.id + "/effort", input),
      owner.send(path + "/rolls/" + roll.id + "/effort", input),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(
      (await owner.sheet()).resources.find((r: any) => r.key === "PE").current,
    ).toBe(pe.current - 1);
    expect(
      (await db.diceRoll.findUniqueOrThrow({ where: { id: roll.id } })).target,
    ).toBe(Math.min(19, roll.target + 2));
    expect(
      (
        await owner.send(
          "/characters/" + owner.id + "/rolls/" + roll.id + "/effort",
          { version: roll.version, action: "BONUS" },
        )
      ).status,
    ).toBe(404);
  });
  it("decisões simultâneas distintas têm um vencedor e recursos não ficam negativos", async () => {
    const { owner, path } = await party();
    const roll = await skillRoll(owner, path);
    const answers = await Promise.all([
      owner.send(path + "/rolls/" + roll.id + "/effort", {
        version: roll.version,
        action: "BONUS",
      }),
      owner.send(path + "/rolls/" + roll.id + "/effort", {
        version: roll.version,
        action: "BONUS",
      }),
    ]);
    expect(answers.map((r) => r.status).sort()).toEqual([200, 409]);
    const s = await owner.sheet(),
      pe = s.resources.find((r: any) => r.key === "PE");
    expect(
      (
        await owner.send(
          path + "/resources",
          {
            characterId: owner.id,
            key: "PE",
            mode: "ADJUST",
            value: -999,
            version: pe.version,
          },
          "PATCH",
        )
      ).status,
    ).toBe(400);
  });
  it("ficha fora da sala também sincroniza condições, ferimentos, itens e crítico sem notas privadas", async () => {
    const { owner, peer, path } = await party();
    let s = await owner.sheet();
    expect(
      (
        await owner.send(
          "/characters/" + owner.id + "/conditions",
          { version: s.conditions.version, bleeding: true, fatigue: 1 },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    const item = await owner.send("/characters/" + owner.id + "/inventory", {
      name: "Bandagem",
      quantity: 2,
      slotsPerUnit: 0.5,
      description: "Tecido",
      notes: "SEGREDO_ITEM",
      equipment: false,
      type: "",
      damage: "",
    });
    expect(item.status).toBe(200);
    const id = item.body.id;
    expect(
      (
        await owner.send(path + "/inventory/" + id + "/use", {
          characterId: owner.id,
          quantity: 1,
          kind: "USE",
          version: 1,
        })
      ).status,
    ).toBe(200);
    s = await owner.sheet();
    const pv = s.resources.find((r: any) => r.key === "PV");
    expect(
      (
        await owner.send(
          path + "/resources",
          {
            characterId: owner.id,
            key: "PV",
            mode: "ADJUST",
            value: -pv.current,
            event: "DAMAGE",
            version: pv.version,
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    s = await owner.sheet();
    expect(
      (
        await owner.send(
          path + "/critical",
          {
            characterId: owner.id,
            action: "SUCCESS",
            version: s.conditions.version,
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await owner.send(path + "/injuries", {
          characterId: owner.id,
          description: "Descrição privada de ferimento",
          location: "braço",
          consequences: "Dor",
          status: "ACTIVE",
        })
      ).status,
    ).toBe(200);
    const events = (await peer.get(path + "/events")).body.entries;
    expect(events.some((e: any) => e.type === "CRITICAL_SUCCESS")).toBe(true);
    expect(events.some((e: any) => e.type === "ITEM_USED")).toBe(true);
    expect(JSON.stringify(events)).not.toMatch(
      /SEGREDO_ITEM|Descrição privada/,
    );
    expect(
      (await owner.sheet()).inventory.find((i: any) => i.id === id).quantity,
    ).toBe(1);
  });
  it("sem compartilhamento recursos e itens não vazam para o grupo", async () => {
    const { gm, owner, peer, path } = await party({ share: false });
    const s = await owner.sheet(),
      pv = s.resources.find((r: any) => r.key === "PV");
    await owner.send(
      path + "/resources",
      {
        characterId: owner.id,
        key: "PV",
        mode: "ADJUST",
        value: -1,
        version: pv.version,
      },
      "PATCH",
    );
    expect(
      (await peer.get(path + "/events")).body.entries.some(
        (e: any) => e.type === "RESOURCE_CHANGED",
      ),
    ).toBe(false);
    expect(
      (await gm.get(path + "/events", true)).body.entries.some(
        (e: any) => e.type === "RESOURCE_CHANGED",
      ),
    ).toBe(true);
    expect(
      (await peer.get(path)).body.participants.find(
        (p: any) => p.characterId === owner.id,
      ),
    ).not.toHaveProperty("resources");
  });
});
describe("diário, reconexão e presença", () => {
  it("notas pessoais, compartilhadas e GM têm visibilidade independente e edição autorizada", async () => {
    const { gm, owner, peer, path } = await party();
    const own = await owner.send(path + "/notes", {
      title: "Pessoal",
      body: "PESSOAL_DO_AUTOR",
      visibility: "PRIVATE",
    });
    const secret = await gm.send(
      path + "/notes",
      { title: "Preparação", body: "SEGREDO_DO_MESTRE", visibility: "GM_ONLY" },
      "POST",
      true,
    );
    expect(own.status).toBe(200);
    expect(secret.status).toBe(200);
    await owner.send(path + "/notes", {
      title: "Compartilhada",
      body: "Pista pública",
      visibility: "PUBLIC",
    });
    expect(JSON.stringify((await peer.get(path + "/notes")).body)).not.toMatch(
      /PESSOAL_DO_AUTOR|SEGREDO_DO_MESTRE/,
    );
    expect(
      JSON.stringify((await gm.get(path + "/notes", true)).body),
    ).not.toContain("PESSOAL_DO_AUTOR");
    expect(JSON.stringify((await gm.get(path + "/notes")).body)).not.toContain(
      "SEGREDO_DO_MESTRE",
    );
    expect(
      (
        await peer.send(
          path + "/notes/" + own.body.note.id,
          {
            version: 1,
            title: "Invasão",
            body: "Invadido",
            visibility: "PRIVATE",
          },
          "PATCH",
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await owner.send(
          path + "/notes/" + own.body.note.id,
          {
            version: 1,
            title: "Pessoal",
            body: "Não publicar por troca",
            visibility: "PUBLIC",
          },
          "PATCH",
        )
      ).status,
    ).toBe(409);
    const updated = await owner.send(
      path + "/notes/" + own.body.note.id,
      {
        version: 1,
        title: "Pessoal",
        body: "Atualizado",
        visibility: "PRIVATE",
      },
      "PATCH",
    );
    expect(updated.status).toBe(200);
    expect(
      (
        await owner.send(
          path + "/notes/" + own.body.note.id,
          {
            version: 1,
            title: "Pessoal",
            body: "Obsoleto",
            visibility: "PRIVATE",
          },
          "PATCH",
        )
      ).status,
    ).toBe(409);
  });
  it("cursores opacos recuperam eventos perdidos sem expor sequência ou eventos privados", async () => {
    const { gm, owner, peer, path, sessionId } = await party();
    const initial = (await peer.get(path + "/events")).body.nextAfter;
    await owner.send(path + "/events", {
      title: "Particular",
      body: "NÃO_ENVIAR",
      visibility: "PRIVATE",
    });
    const hidden = await db.sessionEvent.findFirstOrThrow({
      where: {
        gameSessionId: sessionId,
        type: "NARRATIVE_RECORDED",
        visibility: "PRIVATE",
      },
    });
    await owner.send(path + "/events", {
      title: "Pública",
      body: "RECUPERADO_DEPOIS",
      visibility: "PUBLIC",
    });
    const response = await peer.get(path + "/events?after=" + initial);
    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(1);
    expect(response.body.entries[0].data.body).toBe("RECUPERADO_DEPOIS");
    expect(response.body.entries[0]).not.toHaveProperty("sequence");
    expect((await peer.get(path + "/events?after=" + hidden.id)).status).toBe(
      409,
    );
    expect(
      (await peer.get(path + "/events?after=" + response.body.nextAfter)).body
        .entries,
    ).toHaveLength(0);
  });
  it("presença agrega abas, expira por relógio e não significa presença física", async () => {
    const { owner, peer, path, sessionId } = await party();
    for (const away of [true, false]) {
      const response = await owner.agent
        .post("/api" + path + "/heartbeat")
        .set("Origin", c.APP_ORIGIN)
        .set("X-CSRF-Token", owner.csrf)
        .send({ clientId: randomUUID(), away });
      expect(response.status).toBe(200);
    }
    let roster = (await peer.get(path)).body.participants;
    expect(roster.filter((p: any) => p.user.id === owner.user.id)).toHaveLength(
      1,
    );
    expect(roster.find((p: any) => p.user.id === owner.user.id).presence).toBe(
      "ONLINE",
    );
    await db.presenceRecord.updateMany({
      where: { gameSessionId: sessionId, userId: owner.user.id },
      data: { lastSeenAt: new Date(Date.now() - 60000) },
    });
    expect(
      (await peer.get(path)).body.participants.find(
        (p: any) => p.user.id === owner.user.id,
      ).presence,
    ).toBe("AWAY");
    await db.presenceRecord.updateMany({
      where: { gameSessionId: sessionId, userId: owner.user.id },
      data: { lastSeenAt: new Date(Date.now() - 100000) },
    });
    expect(
      (await peer.get(path)).body.participants.find(
        (p: any) => p.user.id === owner.user.id,
      ).presence,
    ).toBe("OFFLINE");
  });
  it("remoção da campanha revoga sala e leituras por ID sem apagar registros", async () => {
    const { gm, owner, campaignId, path, sessionId } = await party();
    const m = await db.campaignMember.findUniqueOrThrow({
      where: { campaignId_userId: { campaignId, userId: owner.user.id } },
    });
    await gm.send(
      "/campaigns/" + campaignId + "/members/" + owner.user.id,
      {
        version: m.version,
        decision: "REMOVE",
        reason: "Remoção sintética verificada.",
      },
      "PATCH",
    );
    for (const suffix of [
      "",
      "/events",
      "/rolls",
      "/notes",
      "/summary",
      "/stream",
    ])
      expect((await owner.get(path + suffix)).status).toBe(404);
    expect(await db.gameSession.count({ where: { id: sessionId } })).toBe(1);
  });
  it("SSE entrega somente IDs autorizados e encerra conexão após revogação", async () => {
    const { gm, owner, peer, path, campaignId, sessionId } = await party();
    const server = createServer(app);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port;
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const stream = await fetch(
        "http://127.0.0.1:" + port + "/api" + path + "/stream",
        { headers: { Cookie: peer.cookie }, signal: controller.signal },
      );
      expect(stream.status).toBe(200);
      expect(stream.headers.get("content-type")).toContain("text/event-stream");
      reader = stream.body!.getReader();
      const privateRoll = await owner.send(path + "/rolls", {
        characterId: owner.id,
        expression: "1d6",
        visibility: "PRIVATE",
      });
      const publicRoll = await owner.send(path + "/rolls", {
        characterId: owner.id,
        expression: "1d6",
        visibility: "PUBLIC",
      });
      const publicEvent = await db.sessionEvent.findFirstOrThrow({
        where: {
          gameSessionId: sessionId,
          type: "ROLL_CREATED",
          visibility: "PUBLIC",
        },
        orderBy: { sequence: "desc" },
      });
      const privateEvent = await db.sessionEvent.findFirstOrThrow({
        where: {
          gameSessionId: sessionId,
          type: "ROLL_CREATED",
          visibility: "PRIVATE",
        },
      });
      let text = "";
      const deadline = Date.now() + 7000;
      while (!text.includes(publicEvent.id) && Date.now() < deadline) {
        const chunk = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("SSE não respondeu a tempo.")),
              8000,
            ),
          ),
        ]);
        if (chunk.done) break;
        text += new TextDecoder().decode(chunk.value);
      }
      expect(text).toContain(publicEvent.id);
      expect(text).not.toContain(privateEvent.id);
      expect(text).not.toContain(privateRoll.body.roll.id);
      expect(text).not.toContain("sequence");
      expect(
        (await peer.get(path + "/rolls")).body.rolls.some(
          (r: any) => r.id === publicRoll.body.roll.id,
        ),
      ).toBe(true);
      const m = await db.campaignMember.findUniqueOrThrow({
        where: { campaignId_userId: { campaignId, userId: peer.user.id } },
      });
      await gm.send(
        "/campaigns/" + campaignId + "/members/" + peer.user.id,
        {
          version: m.version,
          decision: "REMOVE",
          reason: "Revogar streaming já aberto.",
        },
        "PATCH",
      );
      let closed = false;
      for (let i = 0; i < 5 && !closed; i++) {
        const next = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Stream não encerrou após remoção.")),
              5000,
            ),
          ),
        ]);
        closed = next.done;
      }
      expect(closed).toBe(true);
    } finally {
      controller.abort();
      await reader?.cancel().catch(() => {});
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }, 15000);
});
describe("resumo e transferência optativa", () => {
  it("resumo usa apenas dados persistidos, filtra segredos e admite narrativa manual explícita", async () => {
    const { gm, owner, peer, path } = await party();
    await owner.send(path + "/notes", {
      title: "Diário público",
      body: "RELATO_REGISTRADO",
      visibility: "PUBLIC",
    });
    await gm.send(
      path + "/notes",
      { title: "Segredo", body: "RESUMO_NAO_VAZAR", visibility: "GM_ONLY" },
      "POST",
      true,
    );
    await owner.send(path + "/rolls", {
      characterId: owner.id,
      expression: "1d6",
      visibility: "PRIVATE",
    });
    await finish(gm, path);
    const summary = (await peer.get(path + "/summary")).body.summary;
    expect(summary.session.status).toBe("FINISHED");
    expect(summary.rolls).toHaveLength(0);
    expect(summary.notes.some((n: any) => n.body === "RELATO_REGISTRADO")).toBe(
      true,
    );
    expect(JSON.stringify(summary)).not.toContain("RESUMO_NAO_VAZAR");
    expect(
      summary.eventCounts.some((e: any) => e.type === "ROLL_CREATED"),
    ).toBe(false);
    const s = await currentGame(gm, path);
    expect(
      (
        await gm.send(
          path + "/summary",
          {
            version: s.version,
            narrativeSummary: "Resumo escrito manualmente pelo mestre.",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect(
      (await owner.get(path + "/summary")).body.summary.session
        .narrativeSummary,
    ).toBe("Resumo escrito manualmente pelo mestre.");
  });
  it("transferência fica desativada por padrão e só GM configura", async () => {
    const { gm, owner, peer, path, campaignId } = await party();
    expect((await owner.get(path + "/transfers")).body.enabled).toBe(false);
    expect(
      (
        await owner.send(path + "/transfers", {
          itemId: randomUUID(),
          destinationCharacterId: peer.id,
          quantity: 1,
          version: 1,
        })
      ).status,
    ).toBe(409);
    const campaign = await db.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    expect(
      (
        await owner.send(
          path + "/transfer-settings",
          {
            enabled: true,
            approvalMode: "RECIPIENT",
            version: campaign.version,
            reason: "Jogador não aprova regra.",
          },
          "PATCH",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await gm.send(
          path + "/transfer-settings",
          {
            enabled: true,
            approvalMode: "RECIPIENT",
            version: campaign.version,
            reason: "Configuração experimental aprovada apenas para teste.",
          },
          "PATCH",
          true,
        )
      ).status,
    ).toBe(200);
  });
  it("destinatário confirma transferência atomicamente, sem duplicar itens ou notas privadas", async () => {
    const { owner, peer, path, campaignId } = await party();
    await db.campaign.update({
      where: { id: campaignId },
      data: { itemTransfersEnabled: true },
    });
    const item = await owner.send("/characters/" + owner.id + "/inventory", {
      name: "Ração",
      quantity: 5,
      slotsPerUnit: 1,
      description: "Pacote",
      notes: "PRIVADO_ORIGEM",
      equipment: false,
      type: "",
      damage: "",
    });
    const proposed = await owner.send(path + "/transfers", {
      itemId: item.body.id,
      destinationCharacterId: peer.id,
      quantity: 2,
      version: 1,
    });
    expect(proposed.status).toBe(200);
    const id = proposed.body.id;
    const outcomes = await Promise.all([
      peer.send(path + "/transfers/" + id + "/review", {
        version: 1,
        decision: "APPROVE",
        reason: "Recebimento confirmado.",
      }),
      peer.send(path + "/transfers/" + id + "/review", {
        version: 1,
        decision: "APPROVE",
        reason: "Recebimento confirmado.",
      }),
    ]);
    expect(outcomes.map((r) => r.status).sort()).toEqual([200, 409]);
    const original = (await owner.sheet()).inventory.find(
        (i: any) => i.id === item.body.id,
      ),
      received = (await peer.sheet()).inventory.find(
        (i: any) => i.name === "Ração",
      );
    expect(original.quantity + received.quantity).toBe(5);
    expect(received.quantity).toBe(2);
    expect(received.notes).toBe("");
    expect(
      JSON.stringify((await peer.get(path + "/transfers")).body),
    ).not.toContain("PRIVADO_ORIGEM");
  });
  it("capacidade e versão são revalidadas no aceite sem consumir origem na falha", async () => {
    const { owner, peer, path, campaignId } = await party();
    await db.campaign.update({
      where: { id: campaignId },
      data: { itemTransfersEnabled: true },
    });
    const item = await owner.send("/characters/" + owner.id + "/inventory", {
      name: "Carga pesada",
      quantity: 5,
      slotsPerUnit: 3,
      description: "",
      notes: "",
      equipment: false,
      type: "",
      damage: "",
    });
    const proposed = await owner.send(path + "/transfers", {
      itemId: item.body.id,
      destinationCharacterId: peer.id,
      quantity: 2,
      version: 1,
    });
    expect(
      (
        await peer.send(path + "/transfers/" + proposed.body.id + "/review", {
          version: 1,
          decision: "APPROVE",
          reason: "Tentativa acima da capacidade.",
        })
      ).status,
    ).toBe(409);
    expect(
      (await owner.sheet()).inventory.find((i: any) => i.id === item.body.id)
        .quantity,
    ).toBe(5);
    expect((await peer.sheet()).inventory).toHaveLength(0);
  });
});

describe("regressões de privacidade e uso contínuo", () => {
  it("repetição privada divulga ao mestre por pedido explícito e custa exatamente 2 PE", async () => {
    const { gm, owner, path, sessionId, campaignId } = await party({
      privateToGM: false,
    });
    // Fixture persistida de 20 natural: testa a decisão sem depender do acaso; geração segura é testada separadamente.
    const r = await db.diceRoll.create({
      data: {
        gameSessionId: sessionId,
        campaignId,
        characterId: owner.id,
        characterName: "Falha sintética",
        userId: owner.user.id,
        expression: "1d20",
        results: [20],
        initialResults: [20],
        total: 20,
        skillKey: "atletismo",
        baseTarget: 11,
        target: 11,
        outcome: "FAILURE",
        visibility: "PRIVATE",
        privateToGM: false,
        category: "SKILL",
      },
    });
    expect((await gm.get(path + "/rolls", true)).body.rolls).toHaveLength(0);
    const requested = await owner.send(path + "/rolls/" + r.id + "/effort", {
      version: 1,
      action: "REQUEST_RETRY",
    });
    expect(requested.status).toBe(200);
    expect(
      (await gm.get(path + "/rolls", true)).body.rolls.some(
        (row: any) => row.id === r.id,
      ),
    ).toBe(true);
    const authorized = await gm.send(
      path + "/rolls/" + r.id + "/authorize-retry",
      {
        version: requested.body.roll.version,
        category: "RESISTANCE",
        reason: "Teste de resistência recém-falhado.",
      },
      "POST",
      true,
    );
    expect(authorized.status).toBe(200);
    const before = (await owner.sheet()).resources.find(
      (p: any) => p.key === "PE",
    ).current;
    const body = {
      operationId: randomUUID(),
      version: authorized.body.roll.version,
      action: "RETRY",
    };
    expect(
      (await owner.send(path + "/rolls/" + r.id + "/effort", body)).status,
    ).toBe(200);
    expect(
      (await owner.send(path + "/rolls/" + r.id + "/effort", body)).status,
    ).toBe(200);
    expect(
      (await owner.sheet()).resources.find((p: any) => p.key === "PE").current,
    ).toBe(before - 2);
    const updated = await db.diceRoll.findUniqueOrThrow({
      where: { id: r.id },
    });
    expect(updated.effortMode).toBe("RETRY");
    expect(updated.initialResults).toEqual([20]);
    expect(updated.total).toBeGreaterThanOrEqual(1);
    expect(updated.total).toBeLessThanOrEqual(20);
  });
  it("gasto de PE em rolagem da sala não expõe resultado pelo histórico legado", async () => {
    const { gm, owner, path } = await party({ privateToGM: false });
    const r = await skillRoll(owner, path, "PRIVATE");
    expect(
      (
        await owner.send(path + "/rolls/" + r.id + "/effort", {
          version: r.version,
          action: "BONUS",
        })
      ).status,
    ).toBe(200);
    const history = await gm.get("/characters/" + owner.id + "/history", true);
    expect(history.status).toBe(200);
    expect(JSON.stringify(history.body)).not.toContain(r.id);
    expect((await gm.get(path + "/rolls", true)).body.rolls).toHaveLength(0);
  });
  it("retirar papel GM bloqueia replay de resposta secreta e contexto forjado", async () => {
    const { gm, owner, path, campaignId } = await party();
    const body = {
      operationId: randomUUID(),
      characterId: null,
      expression: "1d100",
      visibility: "GM_ONLY",
    };
    const secret = await gm.send(path + "/rolls", body, "POST", true);
    expect(secret.status).toBe(200);
    await db.campaignMember.update({
      where: { campaignId_userId: { campaignId, userId: gm.user.id } },
      data: { role: "PLAYER", version: { increment: 1 } },
    });
    expect((await gm.send(path + "/rolls", body, "POST", true)).status).toBe(
      403,
    );
    expect(JSON.stringify((await gm.get(path + "/rolls")).body)).not.toContain(
      secret.body.roll.id,
    );
    expect((await owner.get(path + "/notes", true)).status).toBe(403);
  });
  it("transferência recusa campanha diferente e estoque modificado desde a proposta", async () => {
    const { gm, owner, peer, path, campaignId } = await party();
    await db.campaign.update({
      where: { id: campaignId },
      data: { itemTransfersEnabled: true },
    });
    const other = await gm.send("/campaigns", {
        name: "Outro grupo",
        status: "ACTIVE",
        shareSheets: false,
      }),
      otherId = other.body.campaign.id;
    expect(
      (
        await gm.send("/campaigns/" + otherId + "/characters", {
          characterId: gm.id,
          version: (await gm.sheet()).version,
        })
      ).status,
    ).toBe(200);
    const item = await owner.send("/characters/" + owner.id + "/inventory", {
      name: "Água",
      quantity: 4,
      slotsPerUnit: 1,
      description: "",
      notes: "",
      equipment: false,
      type: "",
      damage: "",
    });
    expect(item.status).toBe(200);
    expect(
      (
        await owner.send(path + "/transfers", {
          itemId: item.body.id,
          destinationCharacterId: gm.id,
          quantity: 1,
          version: 1,
        })
      ).status,
    ).toBe(404);
    const t = await owner.send(path + "/transfers", {
      itemId: item.body.id,
      destinationCharacterId: peer.id,
      quantity: 1,
      version: 1,
    });
    expect(t.status).toBe(200);
    expect(
      (
        await owner.send(path + "/inventory/" + item.body.id + "/use", {
          characterId: owner.id,
          quantity: 1,
          kind: "USE",
          version: 1,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await peer.send(path + "/transfers/" + t.body.id + "/review", {
          version: 1,
          decision: "APPROVE",
          reason: "Estoque ficou desatualizado.",
        })
      ).status,
    ).toBe(409);
    expect(
      (await owner.sheet()).inventory.find((i: any) => i.id === item.body.id)
        .quantity,
    ).toBe(3);
    expect((await peer.sheet()).inventory).toHaveLength(0);
  });
  it("consultar sessão autenticada não consome o limite de tentativas de credenciais", async () => {
    const p = await actor();
    for (let n = 0; n < 45; n++)
      expect((await p.get("/auth/me")).status).toBe(200);
  });
});

it("mudança de atributo gera eventos de máximo/current derivados sem curar automaticamente", async () => {
  const { owner, peer, path } = await party();
  let s = await owner.sheet();
  expect(
    (
      await owner.send(
        "/characters/" + owner.id + "/attributes",
        {
          version: s.attributesVersion,
          attributes: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 2 },
        },
        "PATCH",
      )
    ).status,
  ).toBe(200);
  let events = (await peer.get(path + "/events")).body.entries.filter(
    (e: any) => e.type === "RESOURCE_CHANGED",
  );
  expect(events[0].data).toMatchObject({
    resource: "PV",
    previous: 12,
    current: 12,
    difference: 0,
    previousMaximum: 12,
    maximum: 14,
  });
  s = await owner.sheet();
  expect(
    (
      await owner.send(
        "/characters/" + owner.id + "/attributes",
        {
          version: s.attributesVersion,
          attributes: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 0 },
        },
        "PATCH",
      )
    ).status,
  ).toBe(200);
  events = (await peer.get(path + "/events")).body.entries.filter(
    (e: any) => e.type === "RESOURCE_CHANGED",
  );
  expect(events[0].data).toMatchObject({
    resource: "PV",
    previous: 12,
    current: 10,
    difference: -2,
    previousMaximum: 14,
    maximum: 10,
  });
});
it("SSE limita conexões por usuário e permite desligamento limpo sem perder persistência", async () => {
  const { owner, path } = await party();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port,
    controllers: AbortController[] = [],
    readers: ReadableStreamDefaultReader<Uint8Array>[] = [];
  try {
    for (let i = 0; i < 4; i++) {
      const controller = new AbortController();
      controllers.push(controller);
      const r = await fetch(
        "http://127.0.0.1:" + port + "/api" + path + "/stream",
        { headers: { Cookie: owner.cookie }, signal: controller.signal },
      );
      expect(r.status).toBe(200);
      readers.push(r.body!.getReader());
    }
    const fifth = await fetch(
      "http://127.0.0.1:" + port + "/api" + path + "/stream",
      { headers: { Cookie: owner.cookie } },
    );
    expect(fifth.status).toBe(429);
    app.locals.closeGameStreams();
    for (const reader of readers) {
      let done = false;
      for (let i = 0; i < 5 && !done; i++) {
        const chunk = await reader.read();
        done = chunk.done;
      }
      expect(done).toBe(true);
    }
    expect((await owner.get(path)).status).toBe(200);
  } finally {
    for (const controller of controllers) controller.abort();
    await Promise.all(readers.map((r) => r.cancel().catch(() => {})));
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}, 15000);

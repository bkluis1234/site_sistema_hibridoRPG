import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
import { createApp } from "../../apps/api/src/app.js";
import { loadConfig } from "../../apps/api/src/config.js";
import { createDb } from "../../apps/api/src/db.js";
import { cleanupUsers } from "../helpers/cleanup.js";
import type { SheetDetails } from "../../packages/shared/src/index.js";
config({ path: ".env.test", quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error("Banco dedicado de teste obrigatório.");
const c = loadConfig(),
  db = createDb(c),
  prefix = "s2_" + randomBytes(4).toString("hex"),
  names: string[] = [];
let app: ReturnType<typeof createApp>;
let n = 0;
const valid = { AGI: 2, FOR: 1, INT: 1, PRE: 1, VIG: 3 };
const item = {
  name: "Item de teste",
  quantity: 2,
  slotsPerUnit: 1.5,
  description: "Detalhes",
  notes: "Anotação",
  equipment: false,
  type: "",
  damage: "",
};
async function player() {
  const agent = request.agent(app);
  const csrf = (await agent.get("/api/auth/csrf")).body.csrfToken;
  const username = prefix + "_" + ++n;
  names.push(username);
  const r = await agent
    .post("/api/auth/register")
    .set("Origin", c.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .send({
      username,
      password: "frase de senha para integracao",
      confirmPassword: "frase de senha para integracao",
      characterName: "Sobrevivente",
    });
  expect(r.status).toBe(201);
  const list = await agent.get("/api/characters");
  const id = list.body.characters[0].id as string;
  return {
    agent,
    csrf,
    id,
    user: r.body.user,
    send: (suffix: string, body: object, method = "patch") =>
      (method === "post"
        ? agent.post("/api/characters/" + id + suffix)
        : method === "delete"
          ? agent.delete("/api/characters/" + id + suffix)
          : agent.patch("/api/characters/" + id + suffix)
      )
        .set("Origin", c.APP_ORIGIN)
        .set("X-CSRF-Token", csrf)
        .send({ operationId: randomUUID(), ...body }),
    sheet: async () =>
      (await agent.get("/api/characters/" + id + "/sheet")).body
        .sheet as SheetDetails,
  };
}
async function campaign() {
  const owner = await player(),
    gm = await player();
  const campaign = await db.campaign.create({
    data: {
      name: "Campanha sintética",
      ownerId: gm.user.id,
      members: {
        create: [
          { userId: gm.user.id, role: "GM" },
          { userId: owner.user.id, role: "PLAYER" },
        ],
      },
    },
  });
  await db.character.update({
    where: { id: owner.id },
    data: { campaignId: campaign.id },
  });
  return { owner, gm, campaign };
}
async function roll(a: Awaited<ReturnType<typeof player>>, data: object) {
  return a.agent
    .post("/api/dice/roll")
    .set("Origin", c.APP_ORIGIN)
    .set("X-CSRF-Token", a.csrf)
    .send({ characterId: a.id, operationId: randomUUID(), ...data });
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
describe("ficha, versões e persistência", () => {
  it("inicializa cinco atributos, 21 perícias e recursos nos máximos sem inventar treinamento", async () => {
    const a = await player();
    const s = await a.sheet();
    expect(s.attributes).toEqual({ AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 });
    expect(s.skills).toHaveLength(21);
    expect(s.skills.filter((x) => x.trained)).toHaveLength(0);
    expect(s.resources.map((r) => r.current)).toEqual([12, 12, 4]);
    expect(s.portrait.configured).toBe(false);
  });
  it("salva identificação completa sem alterar login e rejeita valores inválidos", async () => {
    const a = await player();
    const s = await a.sheet();
    expect(
      (
        await a.send("/identity", {
          ...s.identity,
          name: "Novo nome",
          nickname: "Eco",
          age: 28,
          height: 1.72,
          weight: 68.5,
          profession: "Livre",
          backstory: "Histórico",
          appearance: "Aparência",
          personality: "Reservada",
          objectives: "Escapar",
          personalNotes: "Lembrança",
          version: 1,
        })
      ).status,
    ).toBe(200);
    const current = await a.sheet();
    expect(current.identity).toMatchObject({
      nickname: "Eco",
      age: 28,
      backstory: "Histórico",
      height: 1.72,
    });
    expect(current.identityVersion).toBe(2);
    expect(
      (await a.send("/identity", { ...current.identity, age: -1, version: 2 }))
        .status,
    ).toBe(400);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: a.user.id } })).username,
    ).not.toBe("Novo nome");
  });
  it("não cura ao aumentar máximos; redução limita atual e gera histórico", async () => {
    const a = await player();
    expect(
      (await a.send("/attributes", { attributes: valid, version: 1 })).status,
    ).toBe(200);
    let s = await a.sheet();
    expect(s.resources[0]).toMatchObject({ current: 12, maximum: 16 });
    expect(
      (
        await a.send("/resources", {
          key: "PV",
          mode: "SET",
          value: 16,
          version: s.resources[0]!.version,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await a.send("/attributes", {
          attributes: { AGI: 3, FOR: 1, INT: 2, PRE: 2, VIG: 0 },
          version: s.attributesVersion,
        })
      ).status,
    ).toBe(200);
    s = await a.sheet();
    expect(s.resources[0]).toMatchObject({ current: 10, maximum: 10 });
    const entries = (await a.agent.get("/api/characters/" + a.id + "/history"))
      .body.entries;
    expect(entries[0].afterData.resourceAdjustments).toContainEqual(
      expect.objectContaining({ key: "PV", before: 16, after: 10 }),
    );
  });
  it("valida distribuição, treinamento e protege mecânica aprovada", async () => {
    const a = await player();
    expect(
      (
        await a.send("/attributes", {
          attributes: { ...valid, VIG: 4 },
          version: 1,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await a.send("/attributes", {
          attributes: { AGI: 3, FOR: 3, INT: 3, PRE: 3, VIG: 3 },
          version: 1,
        })
      ).status,
    ).toBe(400);
    expect(
      (await a.send("/skills", { trained: ["luta", "luta"], version: 1 }))
        .status,
    ).toBe(400);
    expect(
      (
        await a.send("/skills", {
          trained: ["luta", "crime", "reflexos", "fortitude", "vontade"],
          version: 1,
        })
      ).status,
    ).toBe(400);
    await db.character.update({
      where: { id: a.id },
      data: { status: "APPROVED" },
    });
    expect(
      (await a.send("/attributes", { attributes: valid, version: 1 })).status,
    ).toBe(409);
    expect(
      (await a.send("/skills", { trained: ["luta"], version: 1 })).status,
    ).toBe(409);
  });
  it("domínios independentes salvam simultaneamente; mesma versão de recurso tem só um vencedor", async () => {
    const a = await player();
    const s = await a.sheet();
    const results = await Promise.all([
      a.send("/resources", {
        key: "PV",
        mode: "ADJUST",
        value: -1,
        version: 1,
      }),
      a.send("/conditions", { bleeding: true, version: s.conditions.version }),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    let current = await a.sheet();
    expect(current.resources[0]!.current).toBe(11);
    expect(current.conditions.bleeding).toBe(true);
    const pair = await Promise.all([
      a.send("/resources", {
        key: "PV",
        mode: "ADJUST",
        value: -1,
        version: 2,
      }),
      a.send("/resources", {
        key: "PV",
        mode: "ADJUST",
        value: -2,
        version: 2,
      }),
    ]);
    expect(pair.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it("operação repetida não duplica gasto nem auditoria e id não pode ser reutilizado com outro conteúdo", async () => {
    const a = await player();
    const operationId = randomUUID();
    const body = {
      operationId,
      key: "PE",
      mode: "ADJUST",
      value: -1,
      version: 1,
    };
    const results = await Promise.all([
      a.send("/resources", body),
      a.send("/resources", body),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect((await a.sheet()).resources[2]!.current).toBe(3);
    expect(
      await db.characterAuditLog.count({
        where: { characterId: a.id, action: "RESOURCE_CHANGED" },
      }),
    ).toBe(1);
    expect((await a.send("/resources", { ...body, value: -2 })).status).toBe(
      409,
    );
  });
  it("nega a terceiro, ADMIN sem vínculo, payload de dono e escrita arquivada", async () => {
    const a = await player(),
      b = await player();
    await db.user.update({ where: { id: b.user.id }, data: { role: "ADMIN" } });
    for (const endpoint of ["/sheet", "/history", "/rolls"])
      expect(
        (await b.agent.get("/api/characters/" + a.id + endpoint)).status,
      ).toBe(404);
    const attempt = await b.agent
      .patch("/api/characters/" + a.id + "/resources")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", b.csrf)
      .send({
        operationId: randomUUID(),
        key: "PV",
        mode: "SET",
        value: 0,
        version: 1,
      });
    expect(attempt.status).toBe(404);
    expect(
      (
        await a.send("/resources", {
          key: "PV",
          mode: "SET",
          value: 0,
          version: 1,
          ownerId: a.user.id,
        })
      ).status,
    ).toBe(400);
    await db.character.update({
      where: { id: a.id },
      data: { status: "ARCHIVED" },
    });
    expect(
      (await a.agent.get("/api/characters/" + a.id + "/sheet")).status,
    ).toBe(200);
    expect(
      (await a.send("/conditions", { bleeding: true, version: 1 })).status,
    ).toBe(409);
  });
});
describe("inventário, condições e finalização", () => {
  it("CRUD de item/equipamento mantém contagem única, valida negativos e controla versão", async () => {
    const a = await player();
    const create = await a.send(
      "/inventory",
      { ...item, equipment: true, type: "Ferramenta", damage: "" },
      "post",
    );
    expect(create.status).toBe(200);
    const id = create.body.id;
    let s = await a.sheet();
    expect(s.inventoryUsage).toBe(3);
    expect(s.inventory[0]!.equipment).toBe(true);
    expect(
      (
        await a.send("/inventory/" + id, {
          ...item,
          equipment: true,
          quantity: 3,
          type: "Ferramenta",
          version: 1,
        })
      ).status,
    ).toBe(200);
    s = await a.sheet();
    expect(s.inventoryUsage).toBe(4.5);
    expect(
      (await a.send("/inventory/" + id, { ...item, quantity: -1, version: 2 }))
        .status,
    ).toBe(400);
    expect(
      (await a.send("/inventory/" + id, { ...item, version: 1 })).status,
    ).toBe(409);
    expect(
      (await a.send("/inventory/" + id, { version: 2 }, "delete")).status,
    ).toBe(200);
    expect((await a.sheet()).inventory).toHaveLength(0);
  });
  it("excesso de inventário não apaga itens e bloqueia envio da ficha", async () => {
    const a = await player();
    await a.send("/attributes", { attributes: valid, version: 1 });
    await a.send("/skills", {
      trained: ["luta", "crime", "reflexos", "fortitude"],
      version: 1,
    });
    await a.send("/inventory", { ...item, quantity: 10 }, "post");
    let s = await a.sheet();
    expect(
      (await a.send("/submit", { version: s.version }, "post")).status,
    ).toBe(400);
    expect(s.inventory).toHaveLength(1);
    const id = s.inventory[0]!.id;
    await a.send("/inventory/" + id, { version: 1 }, "delete");
    s = await a.sheet();
    expect(
      (await a.send("/submit", { version: s.version }, "post")).status,
    ).toBe(200);
    s = await a.sheet();
    expect(s.status).toBe("PENDING_APPROVAL");
    expect(
      (await a.send("/skills", { trained: [], version: s.skillsVersion }))
        .status,
    ).toBe(409);
    expect(
      (await a.send("/reopen", { version: s.version }, "post")).status,
    ).toBe(200);
    expect((await a.sheet()).status).toBe("DRAFT");
  });
  it("ferimentos são editáveis; sangramento/fadiga não reduzem PV automaticamente", async () => {
    const a = await player();
    const injury = await a.send(
      "/injuries",
      {
        description: "Lesão",
        location: "Perna",
        consequences: "Dor",
        status: "ACTIVE",
      },
      "post",
    );
    expect(injury.status).toBe(200);
    expect(
      (
        await a.send("/injuries/" + injury.body.id, {
          description: "Lesão",
          location: "Perna",
          consequences: "Tratamento",
          status: "TREATED",
          version: 1,
        })
      ).status,
    ).toBe(200);
    expect(
      (await a.send("/conditions", { fatigue: 3, bleeding: true, version: 1 }))
        .status,
    ).toBe(200);
    const s = await a.sheet();
    expect(s.conditions).toMatchObject({ fatigue: 3, bleeding: true });
    expect(s.resources[0]!.current).toBe(12);
    expect(s.injuries[0]!.status).toBe("TREATED");
    expect(
      (await a.send("/conditions", { fatigue: 4, version: 2 })).status,
    ).toBe(400);
  });
  it("zero PV incapacita; dano declarado em crítico soma falha; três sucessos estabilizam sem curar", async () => {
    const a = await player();
    expect(
      (
        await a.send("/resources", {
          key: "PV",
          mode: "ADJUST",
          value: -12,
          event: "SINGLE_ATTACK",
          version: 1,
        })
      ).body.alert,
    ).toMatch(/VIG/);
    let s = await a.sheet();
    expect(s.conditions).toMatchObject({
      critical: true,
      incapacitated: true,
      failures: 0,
    });
    await a.send("/resources", {
      key: "PV",
      mode: "ADJUST",
      value: -1,
      event: "DAMAGE",
      version: s.resources[0]!.version,
    });
    s = await a.sheet();
    expect(s.conditions.failures).toBe(1);
    for (let i = 0; i < 3; i++) {
      s = await a.sheet();
      expect(
        (
          await a.send("/critical", {
            action: "SUCCESS",
            version: s.conditions.version,
          })
        ).status,
      ).toBe(200);
    }
    s = await a.sheet();
    expect(s.conditions.stabilization).toBe("STABLE");
    expect(s.resources[0]!.current).toBe(0);
    expect(
      (
        await a.send("/critical", {
          action: "RESET",
          version: s.conditions.version,
        })
      ).status,
    ).toBe(400);
  });
  it("três falhas registram morte e ajuste simples não declara ataque único", async () => {
    const a = await player();
    const response = await a.send("/resources", {
      key: "PV",
      mode: "SET",
      value: 0,
      version: 1,
    });
    expect(response.body.alert).toBeNull();
    for (let i = 0; i < 3; i++) {
      const s = await a.sheet();
      await a.send("/critical", {
        action: "FAILURE",
        version: s.conditions.version,
      });
    }
    expect((await a.sheet()).conditions.stabilization).toBe("DEAD");
  });
});
describe("fadiga, rolagens oficiais e PE", () => {
  it("mostra alvo base e modificado; lista persistida só é configurável pelo GM vinculado", async () => {
    const { owner: a, gm, campaign: camp } = await campaign();
    await a.send("/conditions", { fatigue: 2, version: 1 });
    let s = await a.sheet();
    expect(s.skills.find((k) => k.key === "luta")).toMatchObject({
      baseTarget: 11,
      target: 7,
      fatiguePenalty: -4,
    });
    expect(s.skills.find((k) => k.key === "fortitude")).toMatchObject({
      baseTarget: 11,
      target: 11,
      fatiguePenalty: 0,
    });
    expect(
      (
        await a.send("/fatigue-policy", {
          version: camp.version,
          physicalSkillKeys: ["fortitude"],
        })
      ).status,
    ).toBe(403);
    const response = await gm.agent
      .patch("/api/characters/" + a.id + "/fatigue-policy")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", gm.csrf)
      .send({
        operationId: randomUUID(),
        version: camp.version,
        physicalSkillKeys: ["fortitude"],
      });
    expect(response.status).toBe(200);
    s = await a.sheet();
    expect(s.skills.find((k) => k.key === "fortitude")!.target).toBe(7);
    expect(s.skills.find((k) => k.key === "luta")!.target).toBe(11);
    expect(s.physicalSkillsConfirmed).toBe(true);
  });
  it("rola todos os dados no servidor e rejeita resultados arbitrários e expressão inválida", async () => {
    const a = await player();
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      const r = await roll(a, { expression: "3d" + sides });
      expect(r.status).toBe(200);
      expect(r.body.roll.results).toHaveLength(3);
      expect(
        r.body.roll.results.every(
          (v: number) => Number.isInteger(v) && v >= 1 && v <= sides,
        ),
      ).toBe(true);
      expect(r.body.roll.total).toBe(
        r.body.roll.results.reduce((a: number, b: number) => a + b, 0),
      );
    }
    expect((await roll(a, { expression: "1000d20" })).status).toBe(400);
    expect((await roll(a, { expression: "1d20", results: [1] })).status).toBe(
      400,
    );
    expect(
      (await roll(a, { skillKey: "luta", fatigueOverride: false })).status,
    ).toBe(403);
  });
  it("bônus PE é transacional, não duplica por clique e natural 20 continua falha", async () => {
    const a = await player();
    const r = await roll(a, { skillKey: "luta" });
    expect(r.status).toBe(200);
    const rollId = r.body.roll.id;
    await db.diceRoll.update({
      where: { id: rollId },
      data: {
        results: [20],
        initialResults: [20],
        total: 20,
        outcome: "FAILURE",
      },
    });
    const operationId = randomUUID(),
      body = { operationId, version: 1, action: "BONUS" };
    const results = await Promise.all([
      a.send("/rolls/" + rollId + "/effort", body, "post"),
      a.send("/rolls/" + rollId + "/effort", body, "post"),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[0]!.body.roll.outcome).toBe("FAILURE");
    expect((await a.sheet()).resources[2]!.current).toBe(3);
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/effort",
          { version: 2, action: "RETRY" },
          "post",
        )
      ).status,
    ).toBe(409);
  });
  it("repetição exige pedido e autorização contextual de GM; cobra 2 PE uma única vez", async () => {
    const { owner: a, gm } = await campaign();
    const r = await roll(a, { skillKey: "fortitude" });
    const rollId = r.body.roll.id;
    await db.diceRoll.update({
      where: { id: rollId },
      data: {
        results: [20],
        initialResults: [20],
        total: 20,
        outcome: "FAILURE",
      },
    });
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/effort",
          { version: 1, action: "RETRY" },
          "post",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/effort",
          { version: 1, action: "REQUEST_RETRY" },
          "post",
        )
      ).status,
    ).toBe(200);
    const auth = await gm.agent
      .post("/api/characters/" + a.id + "/rolls/" + rollId + "/authorize-retry")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", gm.csrf)
      .send({
        operationId: randomUUID(),
        version: 2,
        category: "RESISTANCE",
        reason: "Teste de resistência confirmado pelo mestre.",
      });
    expect(auth.status).toBe(200);
    const attempt = await a.send(
      "/rolls/" + rollId + "/effort",
      { version: 3, action: "RETRY" },
      "post",
    );
    expect(attempt.status).toBe(200);
    expect(attempt.body.roll.effortMode).toBe("RETRY");
    expect((await a.sheet()).resources[2]!.current).toBe(2);
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/effort",
          { version: 4, action: "BONUS" },
          "post",
        )
      ).status,
    ).toBe(409);
  });
  it("rejeita PE insuficiente e encerra teste anterior quando outro é criado", async () => {
    const a = await player();
    await a.send("/resources", {
      key: "PE",
      mode: "SET",
      value: 0,
      version: 1,
    });
    const first = await roll(a, { skillKey: "luta" });
    expect(
      (
        await a.send(
          "/rolls/" + first.body.roll.id + "/effort",
          { version: 1, action: "BONUS" },
          "post",
        )
      ).status,
    ).toBe(400);
    await roll(a, { expression: "1d6" });
    expect(
      (
        await a.send(
          "/rolls/" + first.body.roll.id + "/effort",
          { version: 1, action: "ACCEPT" },
          "post",
        )
      ).status,
    ).toBe(409);
  });
});

describe("fronteiras entre objetos e campanhas", () => {
  it("item/ferimento de outra ficha não é editável; mesmo UUID não muda alvo de exclusão; rota legada respeita arquivo", async () => {
    const a = await player(),
      b = await player();
    const first = await a.send("/inventory", item, "post"),
      second = await a.send(
        "/inventory",
        { ...item, name: "Segundo objeto" },
        "post",
      );
    expect(
      (
        await b.send("/inventory/" + first.body.id, {
          ...item,
          name: "Intrusão",
          version: 1,
        })
      ).status,
    ).toBe(404);
    const injury = await a.send(
      "/injuries",
      {
        description: "Lesão privada",
        location: "Braço",
        consequences: "",
        status: "ACTIVE",
      },
      "post",
    );
    expect(
      (
        await b.send("/injuries/" + injury.body.id, {
          description: "Intrusão",
          location: "",
          consequences: "",
          status: "RESOLVED",
          version: 1,
        })
      ).status,
    ).toBe(404);
    const body = { operationId: randomUUID(), version: 1 };
    expect(
      (await a.send("/inventory/" + first.body.id, body, "delete")).status,
    ).toBe(200);
    expect(
      (await a.send("/inventory/" + second.body.id, body, "delete")).status,
    ).toBe(409);
    expect((await a.sheet()).inventory).toHaveLength(1);
    const before = await a.sheet();
    await db.character.update({
      where: { id: a.id },
      data: { status: "ARCHIVED" },
    });
    expect(
      (
        await a.agent
          .patch("/api/characters/" + a.id)
          .set("Origin", c.APP_ORIGIN)
          .set("X-CSRF-Token", a.csrf)
          .send({
            name: "Alteração indevida",
            concept: "",
            version: before.version,
          })
      ).status,
    ).toBe(409);
  });
  it("GM decide fadiga contextual e autorização de repetição perde validade com remoção do vínculo", async () => {
    const { owner: a, gm, campaign: camp } = await campaign();
    await a.send("/conditions", { fatigue: 2, version: 1 });
    const contextual = await gm.agent
      .post("/api/dice/roll")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", gm.csrf)
      .send({
        characterId: a.id,
        operationId: randomUUID(),
        skillKey: "fortitude",
        fatigueOverride: true,
      });
    expect(contextual.status).toBe(200);
    expect(contextual.body.roll).toMatchObject({
      baseTarget: 11,
      fatiguePenalty: -4,
      target: 7,
    });
    const rolled = await roll(a, { skillKey: "fortitude" });
    const rollId = rolled.body.roll.id;
    await db.diceRoll.update({
      where: { id: rollId },
      data: {
        results: [20],
        initialResults: [20],
        total: 20,
        outcome: "FAILURE",
      },
    });
    await a.send(
      "/rolls/" + rollId + "/effort",
      { version: 1, action: "REQUEST_RETRY" },
      "post",
    );
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/authorize-retry",
          {
            version: 2,
            category: "RESISTANCE",
            reason: "Autorização própria indevida.",
          },
          "post",
        )
      ).status,
    ).toBe(403);
    const authorized = await gm.agent
      .post("/api/characters/" + a.id + "/rolls/" + rollId + "/authorize-retry")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", gm.csrf)
      .send({
        operationId: randomUUID(),
        version: 2,
        category: "RESISTANCE",
        reason: "Teste confirmado pelo mestre sintético.",
      });
    expect(authorized.status).toBe(200);
    await db.campaignMember.deleteMany({
      where: { campaignId: camp.id, userId: gm.user.id },
    });
    expect(
      (
        await a.send(
          "/rolls/" + rollId + "/effort",
          { version: 3, action: "RETRY" },
          "post",
        )
      ).status,
    ).toBe(403);
    expect((await a.sheet()).resources[2]!.current).toBe(4);
  });
});

it("reverte operação que faria a ocupação ultrapassar a precisão, preservando leitura da ficha", async () => {
  const a = await player();
  await db.inventoryItem.createMany({
    data: Array.from({ length: 90 }, (_, i) => ({
      characterId: a.id,
      name: "Lote sintético " + i,
      quantity: 1000000,
      slotsPerUnit: 999999.99,
    })),
  });
  const before = await a.sheet();
  expect(Number.isFinite(before.inventoryUsage)).toBe(true);
  const response = await a.send(
    "/inventory",
    { ...item, quantity: 1000000, slotsPerUnit: 999999.99 },
    "post",
  );
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe("INVENTORY_PRECISION");
  expect((await a.sheet()).inventory).toHaveLength(90);
});

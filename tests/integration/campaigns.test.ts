import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { config } from "dotenv";
import { randomUUID, randomBytes } from "node:crypto";
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
  throw new Error("Banco dedicado de teste obrigatório.");
const c = loadConfig(),
  db = createDb(c),
  prefix = "c3_" + randomBytes(4).toString("hex"),
  names: string[] = [];
let serial = 0;
let app: ReturnType<typeof createApp>;
const pass = "senha sintetica para campanhas 2026";
const valid = { AGI: 2, FOR: 1, INT: 1, PRE: 1, VIG: 3 };
async function actor(role: "PLAYER" | "GM" | "ADMIN" = "PLAYER") {
  const agent = request.agent(app);
  const csrf = (await agent.get("/api/auth/csrf")).body.csrfToken;
  const username = prefix + "_" + ++serial;
  names.push(username);
  const signup = await agent
    .post("/api/auth/register")
    .set("Origin", c.APP_ORIGIN)
    .set("X-CSRF-Token", csrf)
    .send({
      username,
      password: pass,
      confirmPassword: pass,
      characterName: "Ficha " + serial,
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
  const send = (
    path: string,
    body: object,
    method = "POST",
    headers: Record<string, string> = {},
  ) => {
    const test =
      method === "PATCH"
        ? agent.patch("/api" + path)
        : method === "DELETE"
          ? agent.delete("/api" + path)
          : agent.post("/api" + path);
    return test
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", csrf)
      .set(headers)
      .send({ operationId: randomUUID(), ...body });
  };
  return {
    agent,
    user,
    id,
    username,
    csrf,
    codes: signup.body.recoveryCodes as string[],
    send,
    sheet: async (gm = false) =>
      (
        await agent
          .get("/api/characters/" + id + "/sheet")
          .set(gm ? { "X-View-Context": "gm" } : {})
      ).body.sheet,
  };
}
async function create(
  gm: Awaited<ReturnType<typeof actor>>,
  name = "Campanha sintética",
  sharing = true,
) {
  const r = await gm.send("/campaigns", {
    name,
    description: "Descrição do grupo",
    notices: "Aviso público",
    status: "ACTIVE",
    shareSheets: sharing,
  });
  expect(r.status).toBe(201);
  return r.body.campaign as { id: string; version: number };
}
async function invite(
  gm: Awaited<ReturnType<typeof actor>>,
  campaignId: string,
  maxUses = 5,
) {
  const r = await gm.send("/campaigns/" + campaignId + "/invites", {
    expiresInHours: 24,
    maxUses,
  });
  expect(r.status).toBe(201);
  return r.body as { code: string; invite: { id: string; version: number } };
}
async function accept(
  gm: Awaited<ReturnType<typeof actor>>,
  player: Awaited<ReturnType<typeof actor>>,
  campaignId: string,
  code: string,
) {
  expect(
    (await player.send("/campaign-memberships/join", { code })).status,
  ).toBe(200);
  const m = await db.campaignMember.findUniqueOrThrow({
    where: { campaignId_userId: { campaignId, userId: player.user.id } },
  });
  expect(
    (
      await gm.send(
        "/campaigns/" + campaignId + "/members/" + player.user.id,
        {
          version: m.version,
          decision: "ACCEPT",
          reason: "Participante conhecido confirmado.",
        },
        "PATCH",
      )
    ).status,
  ).toBe(200);
}
async function party() {
  const gm = await actor("GM"),
    owner = await actor(),
    peer = await actor();
  const camp = await create(gm);
  const i = await invite(gm, camp.id);
  await accept(gm, owner, camp.id, i.code);
  await accept(gm, peer, camp.id, i.code);
  const s = await owner.sheet();
  expect(
    (
      await owner.send("/campaigns/" + camp.id + "/characters", {
        characterId: owner.id,
        version: s.version,
      })
    ).status,
  ).toBe(200);
  return { gm, owner, peer, camp };
}
async function prepareApproved(
  gm: Awaited<ReturnType<typeof actor>>,
  owner: Awaited<ReturnType<typeof actor>>,
) {
  let s = await owner.sheet();
  await owner.send(
    "/characters/" + owner.id + "/attributes",
    { attributes: valid, version: s.attributesVersion },
    "PATCH",
  );
  await owner.send(
    "/characters/" + owner.id + "/skills",
    {
      trained: ["luta", "atletismo", "fortitude", "vontade"],
      version: s.skillsVersion,
    },
    "PATCH",
  );
  s = await owner.sheet();
  expect(
    (
      await owner.send("/characters/" + owner.id + "/submit", {
        version: s.version,
      })
    ).status,
  ).toBe(200);
  s = await owner.sheet();
  expect(
    (
      await gm.send("/characters/" + owner.id + "/approval", {
        version: s.version,
        decision: "APPROVE",
        comment: "Distribuição conferida pelo mestre.",
      })
    ).status,
  ).toBe(200);
  return owner.sheet();
}
async function proof(
  admin: Awaited<ReturnType<typeof actor>>,
  strong = false,
  index = 0,
) {
  const response = await admin.agent
    .post("/api/admin/reauth")
    .set("Origin", c.APP_ORIGIN)
    .set("X-CSRF-Token", admin.csrf)
    .send({
      password: pass,
      ...(strong ? { recoveryCode: admin.codes[index] } : {}),
    });
  expect(response.status).toBe(200);
  return { "X-Admin-Authorization": response.body.token as string };
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
describe("campanhas, convites e vínculos", () => {
  it("PLAYER não cria campanha nem injeta papel; conta habilitada cria campanha com GM no escopo", async () => {
    const player = await actor();
    expect(
      (await player.send("/campaigns", { name: "Sem permissão" })).status,
    ).toBe(403);
    const gm = await actor("GM");
    const camp = await create(gm);
    expect(
      (
        await db.campaignMember.findUniqueOrThrow({
          where: {
            campaignId_userId: { campaignId: camp.id, userId: gm.user.id },
          },
        })
      ).role,
    ).toBe("GM");
    expect(
      (
        await player.send("/campaign-memberships/join", {
          code: "x".repeat(43),
          role: "GM",
        })
      ).status,
    ).toBe(400);
  });
  it("convite cria pedido PLAYER, não libera dados antes de aceite e não armazena código em claro", async () => {
    const gm = await actor("GM"),
      player = await actor();
    const camp = await create(gm);
    const i = await invite(gm, camp.id);
    const joined = await player.send("/campaign-memberships/join", {
      code: i.code,
    });
    expect(joined.body.status).toBe("PENDING");
    const pending = await player.agent.get("/api/campaigns/" + camp.id);
    expect(pending.body.pending).toBe(true);
    expect(JSON.stringify(pending.body)).not.toContain("Descrição do grupo");
    expect(
      (await player.agent.get("/api/campaigns/" + camp.id + "/manage")).status,
    ).toBe(403);
    expect(
      (
        await db.campaignMember.findUniqueOrThrow({
          where: {
            campaignId_userId: { campaignId: camp.id, userId: player.user.id },
          },
        })
      ).role,
    ).toBe("PLAYER");
    const records = await db.managementOperation.findMany({
      where: { actorId: gm.user.id },
    });
    expect(JSON.stringify(records)).not.toContain(i.code);
    expect(
      (
        await db.campaignInvite.findUniqueOrThrow({
          where: { id: i.invite.id },
        })
      ).codeHash,
    ).not.toBe(i.code);
  });
  it("limite de uso é atômico e convites inválidos/expirados/revogados não funcionam", async () => {
    const gm = await actor("GM"),
      a = await actor(),
      b = await actor();
    const camp = await create(gm);
    const one = await invite(gm, camp.id, 1);
    const results = await Promise.all([
      a.send("/campaign-memberships/join", { code: one.code }),
      b.send("/campaign-memberships/join", { code: one.code }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(
      (
        await db.campaignInvite.findUniqueOrThrow({
          where: { id: one.invite.id },
        })
      ).useCount,
    ).toBe(1);
    const expired = await invite(gm, camp.id);
    await db.campaignInvite.update({
      where: { id: expired.invite.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      (await b.send("/campaign-memberships/join", { code: expired.code }))
        .status,
    ).toBe(400);
    const revoked = await invite(gm, camp.id);
    expect(
      (
        await gm.send(
          "/campaigns/" + camp.id + "/invites/" + revoked.invite.id,
          { version: 1 },
          "DELETE",
        )
      ).status,
    ).toBe(200);
    expect(
      (await b.send("/campaign-memberships/join", { code: revoked.code }))
        .status,
    ).toBe(400);
    expect(
      (
        await b.send("/campaign-memberships/join", {
          code: "invalido".repeat(5),
        })
      ).status,
    ).toBe(400);
  });
  it("participação aceita permite vincular ficha; remoção preserva conta/ficha e revoga leitura do GM", async () => {
    const { gm, owner, camp } = await party();
    let s = await owner.sheet();
    expect(s.id).toBe(owner.id);
    const member = await db.campaignMember.findUniqueOrThrow({
      where: {
        campaignId_userId: { campaignId: camp.id, userId: owner.user.id },
      },
    });
    expect(
      (
        await gm.send(
          "/campaigns/" + camp.id + "/members/" + owner.user.id,
          {
            version: member.version,
            decision: "REMOVE",
            reason: "Jogador saiu da campanha.",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect(
      (await db.character.findUniqueOrThrow({ where: { id: owner.id } }))
        .campaignId,
    ).toBeNull();
    expect(await db.user.count({ where: { id: owner.user.id } })).toBe(1);
    expect(
      (await owner.agent.get("/api/characters/" + owner.id + "/sheet")).status,
    ).toBe(200);
    expect(
      (await gm.agent.get("/api/characters/" + owner.id + "/sheet")).status,
    ).toBe(404);
  });
  it("mestre não administra campanha alheia nem move ficha de outro grupo", async () => {
    const { gm, owner, camp } = await party();
    const stranger = await actor("GM");
    const other = await create(stranger, "Outro grupo");
    expect(
      (await stranger.agent.get("/api/campaigns/" + camp.id + "/manage"))
        .status,
    ).toBe(404);
    expect(
      (
        await stranger.send("/campaigns/" + other.id + "/characters", {
          characterId: owner.id,
          version: (await owner.sheet()).version,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await stranger.send("/characters/" + owner.id + "/approval", {
          version: (await owner.sheet()).version,
          decision: "APPROVE",
          comment: "Indevido.",
        })
      ).status,
    ).toBe(404);
  });
  it("configuração e notas GM têm versão; nova instância da API recupera dados", async () => {
    const gm = await actor("GM");
    const camp = await create(gm);
    expect(
      (
        await gm.send(
          "/campaigns/" + camp.id + "/gm-notes",
          { gmNotes: "Segredo persistente do mestre", version: 1 },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await gm.send(
          "/campaigns/" + camp.id + "/gm-notes",
          { gmNotes: "Sobrescrita antiga", version: 1 },
          "PATCH",
        )
      ).status,
    ).toBe(409);
    const fresh = createApp(db, c);
    const cookies = (await gm.agent.get("/api/auth/me")).headers["set-cookie"];
    const saved = await db.campaign.findUniqueOrThrow({
      where: { id: camp.id },
    });
    expect(saved.gmNotes).toBe("Segredo persistente do mestre");
    expect(
      (await gm.agent.get("/api/campaigns/" + camp.id)).body.campaign,
    ).not.toHaveProperty("gmNotes");
    expect(
      (await gm.agent.get("/api/campaigns/" + camp.id + "/manage")).body
        .campaign.gmNotes,
    ).toBe(saved.gmNotes);
  });
});
describe("privacidade e fichas compartilhadas", () => {
  it("compartilhamento exige opt-in duplo e entrega só campos públicos; colega não escreve", async () => {
    const { gm, owner, peer, camp } = await party();
    let s = await owner.sheet();
    expect(
      (
        await peer.agent.get(
          "/api/campaigns/" + camp.id + "/characters/" + owner.id + "/shared",
        )
      ).status,
    ).toBe(404);
    await owner.send(
      "/characters/" + owner.id + "/identity",
      {
        ...s.identity,
        concept: "SEGREDO_CONCEITO",
        backstory: "SEGREDO_HISTORIA",
        personalNotes: "SEGREDO_PESSOAL",
        appearance: "Aparência pública",
        version: s.identityVersion,
      },
      "PATCH",
    );
    await owner.send("/characters/" + owner.id + "/inventory", {
      name: "Objeto",
      quantity: 1,
      slotsPerUnit: 1,
      description: "Descrição pública",
      notes: "SEGREDO_ITEM",
      equipment: false,
      type: "",
      damage: "",
    });
    s = await owner.sheet();
    await owner.send(
      "/characters/" + owner.id + "/sharing",
      {
        version: s.sharing.version,
        sharingEnabled: true,
        publicFields: ["appearance"],
      },
      "PATCH",
    );
    const shared = await peer.agent.get(
      "/api/campaigns/" + camp.id + "/characters/" + owner.id + "/shared",
    );
    expect(shared.status).toBe(200);
    const body = JSON.stringify(shared.body);
    for (const secret of [
      "SEGREDO_CONCEITO",
      "SEGREDO_HISTORIA",
      "SEGREDO_PESSOAL",
      "SEGREDO_ITEM",
    ])
      expect(body).not.toContain(secret);
    expect(shared.body.character.narratives.appearance).toBe(
      "Aparência pública",
    );
    expect(shared.body.character).not.toHaveProperty("personalNotes");
    expect(
      (
        await peer.send(
          "/characters/" + owner.id + "/resources",
          { key: "PV", mode: "SET", value: 0, version: 1 },
          "PATCH",
        )
      ).status,
    ).toBe(404);
    expect(
      (await peer.agent.get("/api/characters/" + owner.id + "/history")).status,
    ).toBe(404);
    const current = await db.campaign.findUniqueOrThrow({
      where: { id: camp.id },
    });
    await gm.send(
      "/campaigns/" + camp.id,
      {
        name: current.name,
        description: "",
        notices: "",
        shareSheets: false,
        status: "ACTIVE",
        version: current.version,
      },
      "PATCH",
    );
    expect(
      (
        await peer.agent.get(
          "/api/campaigns/" + camp.id + "/characters/" + owner.id + "/shared",
        )
      ).status,
    ).toBe(404);
  });
  it("GM não recebe PRIVATE; GM_ONLY só aparece no contexto explícito, nunca para dono/colega/admin comum", async () => {
    const { gm, owner, peer, camp } = await party();
    const admin = await actor("ADMIN");
    let s = await owner.sheet();
    await owner.send(
      "/characters/" + owner.id + "/identity",
      {
        ...s.identity,
        personalNotes: "PRIVADO_DONO",
        backstory: "HISTORIA_PRIVADA",
        version: s.identityVersion,
      },
      "PATCH",
    );
    const privateNote = await owner.send("/characters/" + owner.id + "/notes", {
      title: "Pessoal",
      body: "NOTA_PRIVADA",
      visibility: "PRIVATE",
    });
    expect(privateNote.status).toBe(200);
    const note = await gm.send(
      "/characters/" + owner.id + "/notes",
      { title: "Revelação", body: "SPOILER_MESTRE", visibility: "GM_ONLY" },
      "POST",
      { "X-View-Context": "gm" },
    );
    expect(note.status).toBe(200);
    const gmSheet = await gm.agent
      .get("/api/characters/" + owner.id + "/sheet")
      .set("X-View-Context", "gm");
    expect(JSON.stringify(gmSheet.body)).not.toContain("PRIVADO_DONO");
    expect(JSON.stringify(gmSheet.body)).not.toContain("HISTORIA_PRIVADA");
    const ordinary = await gm.agent.get(
      "/api/characters/" + owner.id + "/notes",
    );
    expect(JSON.stringify(ordinary.body)).not.toContain("SPOILER_MESTRE");
    const explicit = await gm.agent
      .get("/api/characters/" + owner.id + "/notes")
      .set("X-View-Context", "gm");
    expect(JSON.stringify(explicit.body)).toContain("SPOILER_MESTRE");
    expect(JSON.stringify(explicit.body)).not.toContain("NOTA_PRIVADA");
    for (const user of [owner, peer, admin]) {
      const response = await user.agent
        .get("/api/characters/" + owner.id + "/notes")
        .set("X-View-Context", "gm");
      expect(JSON.stringify(response.body)).not.toContain("SPOILER_MESTRE");
    }
    expect(
      JSON.stringify(
        (await owner.agent.get("/api/characters/" + owner.id + "/history"))
          .body,
      ),
    ).not.toContain("SPOILER_MESTRE");
    expect(
      JSON.stringify(
        (
          await gm.agent
            .get("/api/characters/" + owner.id + "/history")
            .set("X-View-Context", "gm")
        ).body,
      ),
    ).not.toContain("PRIVADO_DONO");
    expect(
      (
        await owner.send(
          "/characters/" + owner.id + "/notes/" + note.body.id,
          {
            title: "Roubar",
            body: "Exposição",
            visibility: "PUBLIC",
            version: 1,
          },
          "PATCH",
        )
      ).status,
    ).toBe(404);
    expect(
      JSON.stringify((await admin.agent.get("/api/admin/campaigns")).body),
    ).not.toContain("SPOILER_MESTRE");
    expect(
      JSON.stringify((await admin.agent.get("/api/admin/audit")).body),
    ).not.toContain("SPOILER_MESTRE");
  });
  it("notas e logs GM_ONLY não viajam para o mestre de outra campanha", async () => {
    const { gm, owner, camp } = await party();
    const otherGM = await actor("GM"),
      other = await create(otherGM, "Novo grupo");
    const note = await gm.send(
      "/characters/" + owner.id + "/notes",
      {
        title: "Segredo antigo",
        body: "SOMENTE_CAMPANHA_ORIGEM",
        visibility: "GM_ONLY",
      },
      "POST",
      { "X-View-Context": "gm" },
    );
    expect(note.status).toBe(200);
    await owner.send(
      "/campaigns/" + camp.id + "/characters",
      { characterId: owner.id, version: (await owner.sheet()).version },
      "DELETE",
    );
    const i = await invite(otherGM, other.id);
    await accept(otherGM, owner, other.id, i.code);
    await owner.send("/campaigns/" + other.id + "/characters", {
      characterId: owner.id,
      version: (await owner.sheet()).version,
    });
    const notes = await otherGM.agent
      .get("/api/characters/" + owner.id + "/notes")
      .set("X-View-Context", "gm");
    expect(JSON.stringify(notes.body)).not.toContain("SOMENTE_CAMPANHA_ORIGEM");
    const history = await otherGM.agent
      .get("/api/characters/" + owner.id + "/history")
      .set("X-View-Context", "gm");
    expect(JSON.stringify(history.body)).not.toContain(
      "SOMENTE_CAMPANHA_ORIGEM",
    );
    expect(
      (
        await otherGM.send(
          "/characters/" + owner.id + "/notes/" + note.body.id,
          {
            title: "Indevido",
            body: "Indevido",
            visibility: "GM_ONLY",
            version: 1,
          },
          "PATCH",
          { "X-View-Context": "gm" },
        )
      ).status,
    ).toBe(404);
    expect(
      JSON.stringify(
        (await gm.agent.get("/api/campaigns/" + camp.id + "/scoped-notes"))
          .body,
      ),
    ).toContain("SOMENTE_CAMPANHA_ORIGEM");
  });
});
describe("aprovações e solicitações mecânicas", () => {
  it("aprova ficha válida com decisão auditada e jogador continua sem edição mecânica direta", async () => {
    const { gm, owner, camp } = await party();
    const s = await prepareApproved(gm, owner);
    expect(s.status).toBe("APPROVED");
    expect(
      (
        await owner.send(
          "/characters/" + owner.id + "/attributes",
          { attributes: valid, version: s.attributesVersion },
          "PATCH",
        )
      ).status,
    ).toBe(409);
    expect(
      await db.characterAuditLog.count({
        where: { characterId: owner.id, action: "CHARACTER_APPROVED" },
      }),
    ).toBe(1);
    expect(
      await db.notification.count({ where: { userId: owner.user.id } }),
    ).toBeGreaterThan(0);
  });
  it("mestre só corrige mecânica protegida com justificativa; pedido aprovado aplica uma vez", async () => {
    const { gm, owner } = await party();
    let s = await prepareApproved(gm, owner);
    expect(
      (
        await gm.send(
          "/characters/" + owner.id + "/attributes",
          { attributes: valid, version: s.attributesVersion },
          "PATCH",
        )
      ).status,
    ).toBe(409);
    const proposed = { AGI: 1, FOR: 2, INT: 1, PRE: 1, VIG: 3 };
    const r = await owner.send("/characters/" + owner.id + "/change-requests", {
      version: s.attributesVersion,
      reason: "Revisão da distribuição inicial.",
      change: { kind: "ATTRIBUTES", attributes: proposed },
    });
    expect(r.status).toBe(200);
    await owner.send(
      "/characters/" + owner.id + "/resources",
      { key: "PV", mode: "ADJUST", value: -1, version: s.resources[0].version },
      "PATCH",
    );
    const path =
      "/characters/" +
      owner.id +
      "/change-requests/" +
      r.body.request.id +
      "/review";
    const reviews = await Promise.all([
      gm.send(path, {
        version: 1,
        decision: "APPROVE",
        comment: "Alteração conferida e autorizada.",
      }),
      gm.send(path, {
        version: 1,
        decision: "APPROVE",
        comment: "Alteração conferida e autorizada.",
      }),
    ]);
    expect(reviews.map((x) => x.status).sort()).toEqual([200, 409]);
    s = await owner.sheet();
    expect(s.attributes).toEqual(proposed);
    expect(s.status).toBe("APPROVED");
    expect(
      await db.characterAuditLog.count({
        where: { characterId: owner.id, action: "CHANGE_APPROVED" },
      }),
    ).toBe(1);
  });
  it("pedido obsoleto conflita sem aplicar; rejeição mantém ficha e comunica comentário", async () => {
    const { gm, owner } = await party();
    let s = await prepareApproved(gm, owner);
    const proposed = { AGI: 1, FOR: 2, INT: 1, PRE: 1, VIG: 3 };
    const request = await owner.send(
      "/characters/" + owner.id + "/change-requests",
      {
        version: s.attributesVersion,
        reason: "Pedido com versão de referência.",
        change: { kind: "ATTRIBUTES", attributes: proposed },
      },
    );
    expect(
      (
        await gm.send(
          "/characters/" + owner.id + "/attributes",
          {
            attributes: { AGI: 1, FOR: 1, INT: 2, PRE: 1, VIG: 3 },
            version: s.attributesVersion,
            reason: "Correção mecânica justificada.",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    const path =
      "/characters/" +
      owner.id +
      "/change-requests/" +
      request.body.request.id +
      "/review";
    expect(
      (
        await gm.send(path, {
          version: 1,
          decision: "APPROVE",
          comment: "Esta proposta ficou obsoleta.",
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await gm.send(path, {
          version: 1,
          decision: "REJECT",
          comment: "Solicite novamente com valores atuais.",
        })
      ).status,
    ).toBe(200);
    expect((await owner.sheet()).attributes).toEqual({
      AGI: 1,
      FOR: 1,
      INT: 2,
      PRE: 1,
      VIG: 3,
    });
    const rows = (
      await owner.agent.get("/api/characters/" + owner.id + "/change-requests")
    ).body.requests;
    expect(rows[0]).toMatchObject({
      status: "REJECTED",
      reviewComment: "Solicite novamente com valores atuais.",
    });
  });
});
describe("administração, reforço de identidade e notificações", () => {
  it("ADMIN pode jogar; painel comum não dá acesso universal e jogador não promove a própria conta", async () => {
    const admin = await actor("ADMIN"),
      player = await actor();
    expect((await admin.sheet()).id).toBe(admin.id);
    expect(
      (await admin.agent.get("/api/characters/" + player.id + "/sheet")).status,
    ).toBe(404);
    expect((await player.agent.get("/api/admin/users")).status).toBe(403);
    expect(
      (
        await player.send(
          "/admin/users/" + player.user.id + "/role",
          {
            role: "ADMIN",
            confirmation: player.username,
            reason: "Tentativa de escalada.",
            version: 1,
          },
          "PATCH",
        )
      ).status,
    ).toBe(403);
    const listed = await admin.agent.get("/api/admin/users");
    expect(listed.status).toBe(200);
    expect(JSON.stringify(listed.body)).not.toMatch(
      /passwordHash|recoveryCodes|tokenHash/,
    );
  });
  it("desativação exige confirmação recente, revoga sessões, preserva fichas e é reversível", async () => {
    const admin = await actor("ADMIN"),
      player = await actor();
    const path = "/admin/users/" + player.user.id + "/account";
    expect(
      (
        await admin.send(
          path,
          { disabled: true, version: 1, reason: "Conta sendo moderada." },
          "PATCH",
        )
      ).status,
    ).toBe(403);
    const headers = await proof(admin);
    expect(
      (
        await admin.send(
          path,
          { disabled: true, version: 1, reason: "Conta sendo moderada." },
          "PATCH",
          headers,
        )
      ).status,
    ).toBe(200);
    expect((await player.agent.get("/api/auth/me")).status).toBe(401);
    expect(
      await db.character.count({ where: { ownerId: player.user.id } }),
    ).toBe(1);
    expect(
      (
        await admin.send(
          path,
          {
            disabled: false,
            version: 2,
            reason: "Conta verificada novamente.",
          },
          "PATCH",
          headers,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.send(
          path,
          {
            disabled: false,
            version: 2,
            reason: "Conta verificada novamente.",
          },
          "PATCH",
          await proof(admin),
        )
      ).status,
    ).toBe(200);
    const login = await player.agent
      .post("/api/auth/login")
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", player.csrf)
      .send({ username: player.username, password: pass });
    expect(login.status).toBe(200);
  });
  it("novos ADMIN exigem senha+código único+confirmação do destino; auto remoção bloqueada", async () => {
    const admin = await actor("ADMIN"),
      player = await actor();
    const path = "/admin/users/" + player.user.id + "/role";
    const input = {
      version: 1,
      role: "ADMIN",
      confirmation: player.username,
      reason: "Novo operador administrativo autorizado.",
    };
    expect(
      (await admin.send(path, input, "PATCH", await proof(admin))).status,
    ).toBe(403);
    const strong = await proof(admin, true);
    expect((await admin.send(path, input, "PATCH", strong)).status).toBe(200);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: player.user.id } })).role,
    ).toBe("ADMIN");
    expect(
      (
        await admin.send(
          "/admin/users/" + admin.user.id + "/role",
          {
            version: 1,
            role: "PLAYER",
            confirmation: admin.username,
            reason: "Tentativa de remover a si próprio.",
          },
          "PATCH",
          await proof(admin, true, 1),
        )
      ).status,
    ).toBe(409);
    const stored = await db.adminAuthorization.findMany({
      where: { userId: admin.user.id },
    });
    expect(JSON.stringify(stored)).not.toContain(
      strong["X-Admin-Authorization"],
    );
  });
  it("configurações globais têm versão e não expõem segredos; cadastro fechado é rejeitado", async () => {
    const admin = await actor("ADMIN");
    const settings = await db.platformSettings.findUniqueOrThrow({
      where: { id: "global" },
    });
    try {
      expect(
        (
          await admin.send(
            "/admin/settings",
            {
              version: settings.version,
              registrationOpen: false,
              campaignCreationEnabled: true,
              reason: "Fechamento temporário para manutenção.",
            },
            "PATCH",
            await proof(admin),
          )
        ).status,
      ).toBe(200);
      const publicSettings = await admin.agent.get("/api/settings/public");
      expect(publicSettings.body.registrationOpen).toBe(false);
      expect(
        JSON.stringify((await admin.agent.get("/api/admin/settings")).body),
      ).not.toMatch(/DATABASE_URL|CSRF_SECRET|passwordHash/);
      const outsider = request.agent(app);
      const csrf = (await outsider.get("/api/auth/csrf")).body.csrfToken;
      const name = prefix + "_" + ++serial;
      names.push(name);
      expect(
        (
          await outsider
            .post("/api/auth/register")
            .set("Origin", c.APP_ORIGIN)
            .set("X-CSRF-Token", csrf)
            .send({ username: name, password: pass, confirmPassword: pass })
        ).status,
      ).toBe(403);
    } finally {
      await db.platformSettings.update({
        where: { id: "global" },
        data: {
          registrationOpen: true,
          campaignCreationEnabled: true,
          version: { increment: 1 },
        },
      });
    }
  });
  it("notificações só são consultadas/marcadas pelo destinatário", async () => {
    const { gm, owner, peer, camp } = await party();
    const list = await gm.agent.get("/api/notifications");
    expect(list.status).toBe(200);
    const id = list.body.notifications[0].id as string;
    const attempt = await peer.agent
      .patch("/api/notifications/" + id)
      .set("Origin", c.APP_ORIGIN)
      .set("X-CSRF-Token", peer.csrf)
      .send({});
    expect(attempt.status).toBe(404);
    expect(
      (
        await gm.agent
          .patch("/api/notifications/" + id)
          .set("Origin", c.APP_ORIGIN)
          .set("X-CSRF-Token", gm.csrf)
          .send({})
      ).status,
    ).toBe(204);
  });
});

describe("preservação privada e autorizações efêmeras", () => {
  it("editar identificação como GM preserva campos privados e rejeita escrita privada", async () => {
    const { gm, owner } = await party();
    const original = await owner.sheet();
    expect(
      (
        await owner.send(
          "/characters/" + owner.id + "/identity",
          {
            ...original.identity,
            version: original.identityVersion,
            personalNotes: "SEGREDO_PRESERVADO",
            backstory: "HISTORIA_PRESERVADA",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    const loaded = (
      await gm.agent
        .get("/api/characters/" + owner.id + "/sheet")
        .set("X-View-Context", "gm")
    ).body.sheet;
    expect(loaded.identity.personalNotes).toBe("");
    expect(
      (
        await gm.send(
          "/characters/" + owner.id + "/identity",
          {
            ...loaded.identity,
            nickname: "Corrigido pelo GM",
            version: loaded.identityVersion,
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    const after = await owner.sheet();
    expect(after.identity).toMatchObject({
      nickname: "Corrigido pelo GM",
      personalNotes: "SEGREDO_PRESERVADO",
      backstory: "HISTORIA_PRESERVADA",
    });
    expect(
      (
        await gm.send(
          "/characters/" + owner.id + "/identity",
          {
            ...loaded.identity,
            personalNotes: "Invasão",
            version: after.identityVersion,
          },
          "PATCH",
        )
      ).status,
    ).toBe(403);
    expect((await owner.sheet()).identity.personalNotes).toBe(
      "SEGREDO_PRESERVADO",
    );
  });
  it("repetir criação de convite não duplica uso nem persiste o código no resultado idempotente", async () => {
    const gm = await actor("GM"),
      camp = await create(gm),
      operationId = randomUUID();
    const input = { operationId, expiresInHours: 24, maxUses: 2 };
    const path = "/campaigns/" + camp.id + "/invites";
    const first = await gm.send(path, input),
      again = await gm.send(path, input);
    expect(first.status).toBe(201);
    expect(again.status).toBe(201);
    expect(again.body.invite.id).toBe(first.body.invite.id);
    expect(again.body.code).toBeUndefined();
    expect(
      await db.campaignInvite.count({ where: { campaignId: camp.id } }),
    ).toBe(1);
    const ledger = await db.managementOperation.findUniqueOrThrow({
      where: { actorId_operationId: { actorId: gm.user.id, operationId } },
    });
    expect(JSON.stringify(ledger.result)).not.toContain(first.body.code);
  });
  it("autorização administrativa expirada ou de outra sessão é recusada", async () => {
    const admin = await actor("ADMIN"),
      player = await actor();
    const headers = await proof(admin),
      path = "/admin/users/" + player.user.id + "/account";
    const second = request.agent(app),
      csrf = (await second.get("/api/auth/csrf")).body.csrfToken;
    expect(
      (
        await second
          .post("/api/auth/login")
          .set("Origin", c.APP_ORIGIN)
          .set("X-CSRF-Token", csrf)
          .send({ username: admin.username, password: pass })
      ).status,
    ).toBe(200);
    expect(
      (
        await second
          .patch("/api" + path)
          .set("Origin", c.APP_ORIGIN)
          .set("X-CSRF-Token", csrf)
          .set(headers)
          .send({
            operationId: randomUUID(),
            version: 1,
            disabled: true,
            reason: "Sessão distinta não autorizada.",
          })
      ).status,
    ).toBe(403);
    await db.adminAuthorization.updateMany({
      where: { userId: admin.user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      (
        await admin.send(
          path,
          { version: 1, disabled: true, reason: "Autorização já expirada." },
          "PATCH",
          headers,
        )
      ).status,
    ).toBe(403);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: player.user.id } }))
        .disabledAt,
    ).toBeNull();
  });
});

it("administrador não remove o último GM ativo de uma campanha", async () => {
  const admin = await actor("ADMIN"),
    gm = await actor("GM"),
    camp = await create(gm);
  const m = await db.campaignMember.findUniqueOrThrow({
    where: { campaignId_userId: { campaignId: camp.id, userId: gm.user.id } },
  });
  expect(
    (
      await admin.send(
        "/admin/campaigns/" + camp.id + "/members/" + gm.user.id + "/role",
        {
          role: "PLAYER",
          version: m.version,
          reason: "Tentativa de retirar único mestre.",
        },
        "PATCH",
        await proof(admin),
      )
    ).status,
  ).toBe(409);
  expect(
    (await db.campaignMember.findUniqueOrThrow({ where: { id: m.id } })).role,
  ).toBe("GM");
});

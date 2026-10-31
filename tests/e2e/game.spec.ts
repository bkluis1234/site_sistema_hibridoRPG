import {
  test,
  expect,
  devices,
  type Browser,
  type BrowserContext,
  type TestInfo,
  type Page,
} from "@playwright/test";
import { config } from "dotenv";
import { randomBytes, randomUUID } from "node:crypto";
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
  throw new Error("Banco de teste obrigatório.");
const db = createDb(loadConfig()),
  names: string[] = [],
  contexts: BrowserContext[] = [],
  password = "frase de teste longa para sobreviventes";
async function person(
  browser: Browser,
  info: TestInfo,
  role: "PLAYER" | "GM" | "ADMIN",
  name: string,
) {
  const context = await browser.newContext({
    ...devices[info.project.name === "mobile" ? "Pixel 7" : "Desktop Chrome"],
    baseURL: "http://localhost:5173",
  });
  contexts.push(context);
  const username = "e4_" + randomBytes(6).toString("hex");
  names.push(username);
  const csrf = (await (await context.request.get("/api/auth/csrf")).json())
    .csrfToken;
  const r = await context.request.post("/api/auth/register", {
    headers: { Origin: "http://localhost:5173", "X-CSRF-Token": csrf },
    data: {
      username,
      password,
      confirmPassword: password,
      characterName: name,
    },
  });
  expect(r.status()).toBe(201);
  const registration = await r.json();
  if (role !== "PLAYER")
    await db.user.update({
      where: { id: registration.user.id },
      data: {
        role: role === "ADMIN" ? "ADMIN" : "PLAYER",
        canCreateCampaigns: true,
      },
    });
  const id = (await (await context.request.get("/api/characters")).json())
    .characters[0].id as string;
  const send = async (
    path: string,
    data: object,
    method = "POST",
    gm = false,
  ) => {
    const token = (await context.cookies()).find(
      (c) => c.name === "hibrido-csrf",
    )!.value;
    return context.request.fetch("/api" + path, {
      method,
      headers: {
        Origin: "http://localhost:5173",
        "X-CSRF-Token": token,
        ...(gm ? { "X-View-Context": "gm" } : {}),
      },
      data: { operationId: randomUUID(), ...data },
    });
  };
  return {
    context,
    page: await context.newPage(),
    username,
    userId: registration.user.id,
    id,
    send,
  };
}
async function group(browser: Browser, info: TestInfo) {
  const gm = await person(browser, info, "GM", "Marcus de teste"),
    owner = await person(browser, info, "PLAYER", "Helena da Vigília"),
    peer = await person(browser, info, "ADMIN", "Caio Observador");
  const c = await gm.send("/campaigns", {
    name: "Os Últimos Sinais",
    status: "ACTIVE",
    shareSheets: true,
  });
  expect(c.status()).toBe(201);
  const campaignId = (await c.json()).campaign.id as string;
  const invite = await gm.send("/campaigns/" + campaignId + "/invites", {
    expiresInHours: 24,
    maxUses: 3,
  });
  const code = (await invite.json()).code;
  for (const p of [owner, peer]) {
    expect(
      (await p.send("/campaign-memberships/join", { code })).status(),
    ).toBe(200);
    expect(
      (
        await gm.send(
          "/campaigns/" + campaignId + "/members/" + p.userId,
          {
            version: 1,
            decision: "ACCEPT",
            reason: "Participante confirmado no teste.",
          },
          "PATCH",
        )
      ).status(),
    ).toBe(200);
    const ch = await db.character.findUniqueOrThrow({ where: { id: p.id } });
    expect(
      (
        await p.send("/campaigns/" + campaignId + "/characters", {
          characterId: p.id,
          version: ch.version,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await p.send(
          "/characters/" + p.id + "/sharing",
          { version: 1, sharingEnabled: true, publicFields: [] },
          "PATCH",
        )
      ).status(),
    ).toBe(200);
  }
  return { gm, owner, peer, campaignId };
}
async function tab(page: Page, info: TestInfo, name: string) {
  if (info.project.name === "mobile")
    await page
      .getByRole("navigation", { name: "Abas do modo sessão" })
      .getByRole("button", { name, exact: true })
      .click();
}
async function createAndStart(
  gm: Awaited<ReturnType<typeof person>>,
  campaignId: string,
) {
  const r = await gm.send("/campaigns/" + campaignId + "/sessions", {
    title: "Conexão de teste",
  });
  expect(r.status()).toBe(201);
  const sessionId = (await r.json()).session.id as string;
  expect(
    (
      await gm.send("/sessions/" + sessionId + "/start", {
        version: 1,
        reason: "Início para ensaio.",
      })
    ).status(),
  ).toBe(200);
  return sessionId;
}
async function enter(
  p: Awaited<ReturnType<typeof person>>,
  campaignId: string,
  sessionId: string,
) {
  await p.page.goto("/campaigns/" + campaignId + "/sessions/" + sessionId);
  await p.page
    .getByLabel("Minha ficha para esta sessão", { exact: true })
    .selectOption(p.id);
  await p.page
    .getByRole("button", { name: "Entrar na sessão", exact: true })
    .click();
  await expect(p.page.locator(".session-quick-resources")).toBeVisible();
}
test.afterEach(async () => {
  for (const c of contexts.splice(0)) await c.close();
});
test.afterAll(async () => {
  await cleanupUsers(db, names);
  await db.$disconnect();
});

test("sala multiusuário compartilha rolagens e recursos, protege diário GM e encerra com resumo", async ({
  browser,
}, info) => {
  test.setTimeout(120000);
  const { gm, owner, peer, campaignId } = await group(browser, info),
    p = gm.page,
    o = owner.page,
    v = peer.page,
    errors: string[] = [];
  for (const page of [p, o, v])
    page.on("pageerror", (e) => errors.push(e.message));
  await p.goto("/campaigns/" + campaignId + "/sessions?mode=gm");
  await p.getByRole("button", { name: "Agendar sessão", exact: true }).click();
  await p
    .getByLabel("Nome da sessão", { exact: true })
    .fill("Vigília na estação");
  await p.getByRole("button", { name: "Criar sessão agendada" }).click();
  await expect(
    p.getByRole("heading", { name: "Vigília na estação." }),
  ).toBeVisible();
  const sessionId = new URL(p.url()).pathname.split("/").at(-1)!;
  const path = "/sessions/" + sessionId;
  await p.getByRole("button", { name: "Iniciar sessão", exact: true }).click();
  await p
    .getByLabel("Justificativa pública da sessão")
    .fill("A mesa está pronta para começar.");
  await p
    .getByRole("button", { name: "Confirmar início", exact: true })
    .click();
  await expect(p.locator(".session-room-heading .session-state")).toHaveText(
    "Em andamento",
  );
  await enter(owner, campaignId, sessionId);
  await enter(peer, campaignId, sessionId);
  await expect(o.getByTestId("session-connection")).toContainText("ao vivo");
  await expect(v.getByTestId("session-connection")).toContainText("ao vivo");
  await tab(o, info, "Dados");
  await o.getByLabel("Dado da sessão", { exact: true }).selectOption("6");
  await o.getByRole("button", { name: "Rolar dados oficiais" }).click();
  await expect(o.getByTestId("session-roll")).toHaveCount(1);
  await tab(v, info, "Dados");
  await expect(v.getByTestId("session-roll")).toHaveCount(1, {
    timeout: 10000,
  });
  await o
    .getByLabel("Visibilidade da rolagem", { exact: true })
    .selectOption("PRIVATE");
  await o.getByRole("button", { name: "Rolar dados oficiais" }).click();
  await expect(o.getByTestId("session-roll")).toHaveCount(2);
  const visible = (
    await (await peer.context.request.get("/api" + path + "/rolls")).json()
  ).rolls;
  expect(visible).toHaveLength(1);
  await p.getByLabel("Ficha em foco do mestre").selectOption(owner.id);
  await expect(p.locator(".session-quick-resources .pv span")).toHaveText(
    "12/12",
  );
  await o
    .getByRole("button", { name: "Ajustar menos um PV na sessão" })
    .click();
  await expect(o.locator(".session-quick-resources .pv span")).toHaveText(
    "11/12",
  );
  await expect(p.locator(".session-quick-resources .pv span")).toHaveText(
    "11/12",
    { timeout: 10000 },
  );
  await tab(o, info, "Minha ficha");
  await o
    .locator(".session-survival-tabs")
    .getByRole("button", { name: "Condições", exact: true })
    .click();
  await o.getByRole("button", { name: "Fadiga nível 2", exact: true }).click();
  await expect(
    o.getByRole("button", { name: "Fadiga nível 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await tab(v, info, "Grupo");
  await expect(
    v.locator(".session-roster").filter({ hasText: "Helena da Vigília" }),
  ).toContainText("Fadiga 2", { timeout: 10000 });
  await tab(p, info, "Anotações");
  await p.getByRole("button", { name: "Nova anotação", exact: true }).click();
  await p
    .getByLabel("Título da anotação", { exact: true })
    .fill("Preparação reservada");
  await p
    .getByLabel("Conteúdo da anotação", { exact: true })
    .fill("SEGREDO_DA_ESTACAO_GM_ONLY");
  await p.getByRole("button", { name: "Salvar anotação", exact: true }).click();
  await expect(
    p
      .locator(".session-notes")
      .getByText("SEGREDO_DA_ESTACAO_GM_ONLY", { exact: true }),
  ).toBeVisible();
  await tab(o, info, "Anotações");
  await o.getByRole("button", { name: "Nova anotação", exact: true }).click();
  await o
    .getByLabel("Título da anotação", { exact: true })
    .fill("Meu diário pessoal");
  await o
    .getByLabel("Conteúdo da anotação", { exact: true })
    .fill("MEMORIA_PRIVADA_HELENA");
  await o.getByRole("button", { name: "Salvar anotação", exact: true }).click();
  await expect(
    o
      .locator(".session-notes")
      .getByText("MEMORIA_PRIVADA_HELENA", { exact: true }),
  ).toBeVisible();
  await tab(v, info, "Anotações");
  await expect(
    v.getByText("SEGREDO_DA_ESTACAO_GM_ONLY", { exact: true }),
  ).toHaveCount(0);
  await expect(
    v.getByText("MEMORIA_PRIVADA_HELENA", { exact: true }),
  ).toHaveCount(0);
  expect(
    JSON.stringify(
      await (await peer.context.request.get("/api" + path + "/notes")).json(),
    ),
  ).not.toMatch(/SEGREDO_DA_ESTACAO|MEMORIA_PRIVADA/);
  await p.getByRole("link", { name: "Modo jogador", exact: true }).click();
  await tab(p, info, "Anotações");
  await expect(
    p
      .locator(".session-notes")
      .getByText("SEGREDO_DA_ESTACAO_GM_ONLY", { exact: true }),
  ).toHaveCount(0);
  await p.getByRole("link", { name: "Abrir contexto de mestre" }).click();
  await p.getByRole("button", { name: "Pausar sessão", exact: true }).click();
  await p
    .getByLabel("Justificativa pública da sessão")
    .fill("Intervalo breve registrado.");
  await p
    .getByRole("button", { name: "Confirmar alteração de estado" })
    .click();
  await expect(p.locator(".session-room-heading .session-state")).toHaveText(
    "Pausada",
  );
  await expect(o.locator(".session-room-heading .session-state")).toHaveText(
    "Pausada",
    { timeout: 10000 },
  );
  await p.getByRole("button", { name: "Retomar sessão", exact: true }).click();
  await p
    .getByLabel("Justificativa pública da sessão")
    .fill("Todos retornaram à mesa.");
  await p
    .getByRole("button", { name: "Confirmar alteração de estado" })
    .click();
  await expect(p.locator(".session-room-heading .session-state")).toHaveText(
    "Em andamento",
  );
  await p.getByRole("button", { name: "Encerrar sessão", exact: true }).click();
  await p
    .getByLabel("Justificativa pública da sessão")
    .fill("Sessão encerrada, registros conferidos.");
  await p
    .getByRole("button", { name: "Confirmar encerramento", exact: true })
    .click();
  await expect(p.locator(".session-room-heading .session-state")).toHaveText(
    "Encerrada",
  );
  await tab(v, info, "Eventos");
  await expect(
    v.getByRole("heading", { name: "Resumo registrado", exact: true }),
  ).toBeVisible({ timeout: 10000 });
  expect(
    JSON.stringify(
      await (await peer.context.request.get("/api" + path + "/summary")).json(),
    ),
  ).not.toMatch(/SEGREDO_DA_ESTACAO|MEMORIA_PRIVADA/);
  for (const page of [p, o, v])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  await v.screenshot({
    path: info.outputPath("sessao-compartilhada.png"),
    fullPage: true,
  });
  await p.screenshot({
    path: info.outputPath("sala-mestre.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("perda de conexão não confirma salvamento; reconexão e fallback recuperam estado MySQL", async ({
  browser,
}, info) => {
  test.setTimeout(90000);
  const { gm, owner, peer, campaignId } = await group(browser, info),
    sessionId = await createAndStart(gm, campaignId),
    path = "/sessions/" + sessionId,
    p = owner.page;
  await enter(owner, campaignId, sessionId);
  await expect(p.getByTestId("session-connection")).toContainText("ao vivo");
  await owner.context.setOffline(true);
  await expect(p.getByTestId("session-connection")).toContainText(
    "Sem conexão",
  );
  await p
    .getByRole("button", { name: "Ajustar menos um PV na sessão" })
    .click();
  await expect(p.getByRole("alert")).toContainText("Sem conexão");
  expect(
    (
      await db.characterResource.findUniqueOrThrow({
        where: { characterId_key: { characterId: owner.id, key: "PV" } },
      })
    ).current,
  ).toBe(12);
  const pv = await db.characterResource.findUniqueOrThrow({
    where: { characterId_key: { characterId: owner.id, key: "PV" } },
  });
  expect(
    (
      await gm.send(
        path + "/resources",
        {
          characterId: owner.id,
          key: "PV",
          mode: "ADJUST",
          value: -2,
          event: "DAMAGE",
          version: pv.version,
        },
        "PATCH",
        true,
      )
    ).status(),
  ).toBe(200);
  await owner.context.setOffline(false);
  await expect(p.getByTestId("session-connection")).toContainText("ao vivo", {
    timeout: 15000,
  });
  await expect(p.locator(".session-quick-resources .pv span")).toHaveText(
    "10/12",
    { timeout: 10000 },
  );
  await owner.context.route("**/api/sessions/*/stream?**", (route) =>
    route.abort(),
  );
  await p.reload();
  await expect(p.getByTestId("session-connection")).toContainText(
    /periódica|Reconectando/,
    { timeout: 20000 },
  );
  const current = await db.characterResource.findUniqueOrThrow({
    where: { characterId_key: { characterId: owner.id, key: "PV" } },
  });
  expect(
    (
      await gm.send(
        path + "/resources",
        {
          characterId: owner.id,
          key: "PV",
          mode: "ADJUST",
          value: -1,
          event: "DAMAGE",
          version: current.version,
        },
        "PATCH",
        true,
      )
    ).status(),
  ).toBe(200);
  await expect(p.locator(".session-quick-resources .pv span")).toHaveText(
    "9/12",
    { timeout: 25000 },
  );
  await p.getByRole("checkbox", { name: "Silenciar avisos da sessão" }).check();
  await expect(p.locator(".session-toast")).toHaveCount(0);
  await owner.context.unroute("**/api/sessions/*/stream?**");
  await p.reload();
  await expect(p.getByTestId("session-connection")).toContainText("ao vivo", {
    timeout: 15000,
  });
  await p.screenshot({
    path: info.outputPath("reconexao-recursos.png"),
    fullPage: true,
  });
});

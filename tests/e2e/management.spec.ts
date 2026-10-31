import {
  test,
  expect,
  devices,
  type Browser,
  type BrowserContext,
  type TestInfo,
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
  throw new Error("Somente banco de teste.");
const db = createDb(loadConfig());
const names: string[] = [];
const contexts: BrowserContext[] = [];
const password = "frase sintetica para gerenciar campanhas";
async function person(
  browser: Browser,
  info: TestInfo,
  role: "PLAYER" | "GM" | "ADMIN",
  characterName: string,
) {
  const context = await browser.newContext({
    ...devices[info.project.name === "mobile" ? "Pixel 7" : "Desktop Chrome"],
    baseURL: "http://localhost:5173",
  });
  contexts.push(context);
  const username = "e3_" + randomBytes(6).toString("hex");
  names.push(username);
  const csrf = (await (await context.request.get("/api/auth/csrf")).json())
    .csrfToken;
  const registered = await context.request.post("/api/auth/register", {
    headers: { Origin: "http://localhost:5173", "X-CSRF-Token": csrf },
    data: { username, password, confirmPassword: password, characterName },
  });
  expect(registered.status()).toBe(201);
  const registration = await registered.json();
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
  const send = async (path: string, data: object, method = "POST") => {
    const token = (await context.cookies()).find(
      (c) => c.name === "hibrido-csrf",
    )!.value;
    return context.request.fetch("/api" + path, {
      method,
      headers: { Origin: "http://localhost:5173", "X-CSRF-Token": token },
      data: { operationId: randomUUID(), ...data },
    });
  };
  return {
    context,
    page: await context.newPage(),
    username,
    userId: registration.user.id,
    codes: registration.recoveryCodes as string[],
    id,
    send,
  };
}
test.afterEach(async () => {
  for (const c of contexts.splice(0)) await c.close();
});
test.afterAll(async () => {
  await cleanupUsers(db, names);
  await db.$disconnect();
});
test("mestre cria campanha, aceita jogadores, aprova ficha e alteração; colega recebe somente leitura", async ({
  browser,
}, info) => {
  test.setTimeout(90000);
  const gm = await person(browser, info, "GM", "Marcus sintético"),
    owner = await person(browser, info, "PLAYER", "Lia do Arquivo"),
    peer = await person(browser, info, "PLAYER", "Colega do grupo");
  const p = gm.page,
    o = owner.page,
    v = peer.page;
  const errors: string[] = [];
  for (const page of [p, o, v])
    page.on("pageerror", (e) => errors.push(e.message));
  await p.goto("/campaigns");
  await p.getByRole("button", { name: "Criar campanha", exact: true }).click();
  await p.getByLabel("Nome da campanha", { exact: true }).fill("Véu da Cidade");
  await p
    .getByRole("checkbox", {
      name: "Permitir fichas compartilhadas entre participantes",
    })
    .check();
  await p
    .getByRole("button", { name: "Criar e abrir painel do mestre" })
    .click();
  await expect(
    p.getByRole("heading", { name: "Véu da Cidade." }),
  ).toBeVisible();
  const campaignId = new URL(p.url()).pathname.split("/")[2]!;
  await p.getByRole("button", { name: "Notas do mestre", exact: true }).click();
  await p
    .getByLabel("Segredos da campanha (GM_ONLY)")
    .fill("SEGREDO_GM_NAO_PUBLICO");
  await p.getByRole("button", { name: "Salvar notas do mestre" }).click();
  await expect(
    p.getByText("Operação confirmada.", { exact: true }),
  ).toBeVisible();
  await p.getByRole("link", { name: "Modo jogador", exact: true }).click();
  await expect(
    p.getByText("SEGREDO_GM_NAO_PUBLICO", { exact: true }),
  ).toHaveCount(0);
  expect(
    JSON.stringify(
      await (
        await gm.context.request.get("/api/campaigns/" + campaignId)
      ).json(),
    ),
  ).not.toContain("SEGREDO_GM_NAO_PUBLICO");
  await p.getByRole("link", { name: "Abrir painel do mestre" }).click();
  await p.getByRole("button", { name: "Convites", exact: true }).click();
  await p.getByRole("button", { name: "Gerar convite de jogador" }).click();
  const code = await p.getByTestId("campaign-invite-code").innerText();
  await o.goto("/campaigns");
  await o.getByLabel("Código de convite da campanha").fill(code);
  await o.getByRole("button", { name: "Solicitar participação" }).click();
  await expect(
    o.getByRole("heading", { name: "Sua participação aguarda o mestre." }),
  ).toBeVisible();
  await p.reload();
  await p.getByRole("button", { name: "Jogadores", exact: true }).click();
  await p
    .getByRole("button", { name: "Aceitar " + owner.username, exact: true })
    .click();
  await p
    .getByLabel("Justificativa da decisão")
    .fill("Jogadora confirmada para o grupo.");
  await p.getByRole("button", { name: "Confirmar decisão" }).click();
  await expect(
    p.getByRole("button", { name: "Aceitar " + owner.username, exact: true }),
  ).toHaveCount(0);
  expect(
    (await peer.send("/campaign-memberships/join", { code })).status(),
  ).toBe(200);
  const pending = await db.campaignMember.findUniqueOrThrow({
    where: { campaignId_userId: { campaignId, userId: peer.userId } },
  });
  expect(
    (
      await gm.send(
        "/campaigns/" + campaignId + "/members/" + peer.userId,
        {
          version: pending.version,
          decision: "ACCEPT",
          reason: "Colega confirmado.",
        },
        "PATCH",
      )
    ).status(),
  ).toBe(200);
  await o.reload();
  await o.getByRole("button", { name: "Personagens", exact: true }).click();
  await o.getByLabel("Personagem para vincular").selectOption(owner.id);
  await o.getByRole("button", { name: "Vincular ficha" }).click();
  await expect(o.getByRole("link", { name: /Lia do Arquivo/ })).toBeVisible();
  await o.getByRole("link", { name: /Lia do Arquivo/ }).click();
  await o
    .getByText("Histórico, aparência e outros detalhes", { exact: true })
    .click();
  await o
    .getByLabel("Observações pessoais", { exact: true })
    .fill("PRIVADO_DA_JOGADORA");
  await o
    .getByLabel("Aparência", { exact: true })
    .fill("Capa escura, mãos enfaixadas.");
  await expect(
    o.getByText("Persistência confirmada", { exact: true }),
  ).toBeVisible();
  await o.getByRole("button", { name: "Aumentar Vigor", exact: true }).click();
  await o.getByRole("button", { name: "Aumentar Vigor", exact: true }).click();
  await o
    .getByRole("button", { name: "Aumentar Agilidade", exact: true })
    .click();
  await o
    .getByRole("button", { name: "Salvar atributos", exact: true })
    .click();
  await expect(
    o.getByRole("button", { name: "Salvar atributos", exact: true }),
  ).toBeDisabled();
  await o.getByRole("button", { name: "Perícias", exact: true }).click();
  for (const skill of ["Luta", "Atletismo", "Fortitude", "Vontade"])
    await o
      .getByRole("checkbox", { name: "Treinar " + skill, exact: true })
      .check();
  await o.getByRole("button", { name: "Salvar treinamentos" }).click();
  await expect(
    o.getByRole("button", { name: "Salvar treinamentos" }),
  ).toBeDisabled();
  await o
    .getByRole("button", { name: "Privacidade e notas", exact: true })
    .click();
  await o
    .getByRole("checkbox", { name: "Compartilhar minha ficha com a campanha" })
    .check();
  await o
    .getByRole("checkbox", { name: "Aparência público para o grupo" })
    .check();
  await o.getByRole("button", { name: "Salvar compartilhamento" }).click();
  await expect(
    o.getByText("Alteração confirmada pelo servidor.", { exact: true }),
  ).toBeVisible();
  await o.getByRole("button", { name: "Finalizar criação" }).click();
  await o.getByRole("button", { name: "Validar e enviar" }).click();
  await expect(
    o.getByText("Aguardando aprovação", { exact: true }),
  ).toBeVisible();
  await p.goto("/campaigns/" + campaignId + "/gm");
  await p.getByRole("button", { name: "Solicitações", exact: true }).click();
  await p
    .getByLabel("Comentário da decisão")
    .fill("Ficha válida conferida pelo mestre.");
  await p
    .getByRole("button", { name: "Aprovar Lia do Arquivo", exact: true })
    .click();
  await expect(
    p.getByRole("button", { name: "Aprovar Lia do Arquivo", exact: true }),
  ).toHaveCount(0);
  await o.reload();
  await expect(o.getByText("Aprovada", { exact: true })).toBeVisible();
  await o
    .getByRole("button", { name: "Solicitar alteração", exact: true })
    .click();
  await o.getByLabel("Novo atributo AGI").fill("1");
  await o.getByLabel("Novo atributo FOR").fill("2");
  await o
    .getByLabel("Justificativa da alteração")
    .fill("Revisão da distribuição autorizada para este personagem.");
  await o
    .getByRole("button", { name: "Enviar solicitação de alteração" })
    .click();
  await expect(o.getByText("Pendente", { exact: true })).toBeVisible();
  await p.reload();
  await p.getByRole("button", { name: "Solicitações", exact: true }).click();
  await p
    .getByLabel("Comentário da decisão")
    .fill("Nova distribuição aprovada e registrada.");
  await p
    .getByRole("button", { name: "Aprovar alteração", exact: true })
    .click();
  await expect(
    p.getByRole("button", { name: "Aprovar alteração", exact: true }),
  ).toHaveCount(0);
  await p.goto("/campaigns/" + campaignId + "/gm/characters/" + owner.id);
  await expect(p.getByText("PRIVADO_DA_JOGADORA", { exact: true })).toHaveCount(
    0,
  );
  await p.getByRole("button", { name: "Reduzir PV", exact: true }).click();
  await expect(
    p.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("11 / 16");
  await p
    .getByRole("button", { name: "Privacidade e notas", exact: true })
    .click();
  await p.getByRole("button", { name: "Nova nota", exact: true }).click();
  await p.getByLabel("Título da nota").fill("Pista reservada");
  await p.getByLabel("Conteúdo da nota").fill("SPOILER_DA_FICHA_GM_ONLY");
  await p.getByRole("button", { name: "Salvar nota", exact: true }).click();
  await expect(
    p.getByText("SPOILER_DA_FICHA_GM_ONLY", { exact: true }),
  ).toBeVisible();
  await v.goto("/campaigns/" + campaignId);
  await v.getByRole("link", { name: /Lia do Arquivo/ }).click();
  await expect(
    v.getByText(
      "Somente leitura. Esta resposta contém apenas os dados compartilhados.",
    ),
  ).toBeVisible();
  await expect(
    v.getByText("Capa escura, mãos enfaixadas.", { exact: true }),
  ).toBeVisible();
  await expect(v.getByRole("button", { name: "Reduzir PV" })).toHaveCount(0);
  await expect(v.getByText("PRIVADO_DA_JOGADORA", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    v.getByText("SPOILER_DA_FICHA_GM_ONLY", { exact: true }),
  ).toHaveCount(0);
  const shared = await peer.context.request.get(
    "/api/campaigns/" + campaignId + "/characters/" + owner.id + "/shared",
  );
  expect(JSON.stringify(await shared.json())).not.toMatch(
    /PRIVADO_DA_JOGADORA|SPOILER_DA_FICHA_GM_ONLY|SEGREDO_GM_NAO_PUBLICO/,
  );
  await o.reload();
  await expect(
    o
      .locator(".sheet-attribute")
      .filter({ has: o.getByRole("heading", { name: "FOR", exact: true }) })
      .locator(".attribute-value strong"),
  ).toHaveText("2");
  await expect(
    o.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("11 / 16");
  expect(
    await v.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await v.screenshot({
    path: info.outputPath("ficha-compartilhada.png"),
    fullPage: true,
  });
  await p.goto("/campaigns/" + campaignId + "/gm");
  await expect(
    p.getByRole("heading", { name: "Véu da Cidade." }),
  ).toBeVisible();
  await expect(p.getByRole("link", { name: /Lia do Arquivo/ })).toBeVisible();
  await p.screenshot({
    path: info.outputPath("painel-mestre.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("ADMIN gerencia conta com senha, promove com código único e continua com ficha própria", async ({
  browser,
}, info) => {
  test.setTimeout(60000);
  const admin = await person(browser, info, "ADMIN", "Ficha do administrador"),
    player = await person(browser, info, "PLAYER", "Ficha preservada");
  const p = admin.page;
  await p.goto("/admin");
  await p
    .getByLabel("Pesquisar usuário", { exact: true })
    .fill(player.username);
  await p
    .getByRole("button", { name: "Habilitar criação de campanhas" })
    .click();
  await p
    .getByLabel("Justificativa administrativa")
    .fill("Conta autorizada a criar campanhas.");
  await p
    .getByLabel("Sua senha administrativa", { exact: true })
    .fill(password);
  await p
    .getByRole("button", { name: "Confirmar operação administrativa" })
    .click();
  await expect(
    p.getByRole("button", { name: "Revogar criação de campanhas" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Desativar conta", exact: true }).click();
  await p
    .getByLabel("Justificativa administrativa")
    .fill("Desativação de teste confirmada.");
  await p
    .getByLabel("Sua senha administrativa", { exact: true })
    .fill(password);
  await p
    .getByRole("button", { name: "Confirmar operação administrativa" })
    .click();
  await expect(
    p.getByRole("button", { name: "Reativar conta", exact: true }),
  ).toBeVisible();
  expect((await player.context.request.get("/api/auth/me")).status()).toBe(401);
  expect(await db.character.count({ where: { id: player.id } })).toBe(1);
  await p.getByRole("button", { name: "Reativar conta", exact: true }).click();
  await p
    .getByLabel("Justificativa administrativa")
    .fill("Reativação de teste confirmada.");
  await p
    .getByLabel("Sua senha administrativa", { exact: true })
    .fill(password);
  await p
    .getByRole("button", { name: "Confirmar operação administrativa" })
    .click();
  await expect(
    p.getByRole("button", { name: "Desativar conta", exact: true }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Papéis", exact: true }).click();
  await p.getByRole("button", { name: "Conceder ADMIN", exact: true }).click();
  await p
    .getByLabel("Justificativa administrativa")
    .fill("Operador adicional devidamente autorizado.");
  await p
    .getByLabel("Sua senha administrativa", { exact: true })
    .fill(password);
  await p
    .getByLabel("Código de recuperação administrativo", { exact: true })
    .fill(admin.codes[0]!);
  await p.getByLabel("Confirme o login de destino").fill(player.username);
  await p
    .getByRole("button", { name: "Confirmar operação administrativa" })
    .click();
  await expect(
    p.getByRole("button", { name: "Remover ADMIN", exact: true }),
  ).toBeVisible();
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: player.userId } })).role,
  ).toBe("ADMIN");
  await p.getByRole("link", { name: "Voltar ao modo jogador" }).click();
  await p.getByRole("link", { name: /Ficha do administrador/ }).click();
  await expect(p.getByLabel("Nome do personagem", { exact: true })).toHaveValue(
    "Ficha do administrador",
  );
  await p.goto("/admin");
  await p.getByRole("button", { name: "Auditoria", exact: true }).click();
  await expect(p.locator(".audit-list")).toContainText(
    "Papel da conta alterado",
  );
  await p.screenshot({
    path: info.outputPath("administracao.png"),
    fullPage: true,
  });
});

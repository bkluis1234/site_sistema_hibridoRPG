import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
test("ficha completa: atributos, treino, fadiga, inventário único, condições, dados e histórico", async ({
  page,
}, testInfo) => {
  const username = "e2e_" + randomBytes(6).toString("hex"),
    password = "frase segura para sessao completa";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/register");
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page.getByLabel("Personagem inicial (opcional)").fill("Helena Vale");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByLabel("Guardei meus códigos em um local seguro.").check();
  await page.getByRole("button", { name: "Acessar o arquivo" }).click();
  await page.getByRole("link", { name: /Helena Vale/ }).click();
  await expect(
    page.getByRole("heading", { name: "Ficha de personagem" }),
  ).toBeVisible();
  await page.getByLabel("Apelido", { exact: true }).fill("Eco");
  await expect(
    page.getByText("Persistência confirmada", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar Vigor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar Vigor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar Agilidade", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar atributos", exact: true })
    .click();
  await expect(
    page.getByText("Alteração confirmada pelo servidor.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Perícias", exact: true }).click();
  for (const skill of ["Luta", "Acrobacia", "Reflexos", "Fortitude"])
    await page
      .getByRole("checkbox", { name: "Treinar " + skill, exact: true })
      .check();
  await page.getByRole("button", { name: "Salvar treinamentos" }).click();
  await expect(
    page.getByRole("button", { name: "Salvar treinamentos" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Condições", exact: true }).click();
  await page.getByRole("button", { name: "Fadiga nível 2" }).click();
  await expect(
    page.getByRole("button", { name: "Fadiga nível 2" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("checkbox", { name: "Sangramento ativo" }).check();
  await expect(
    page.getByRole("checkbox", { name: "Sangramento ativo" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Registrar ferimento" }).click();
  await page.getByLabel("Descrição do ferimento").fill("Corte no antebraço");
  await page.getByLabel("Localização", { exact: true }).fill("Braço esquerdo");
  await page
    .getByLabel("Consequências", { exact: true })
    .fill("Dor; sem penalidade automática");
  await page.getByRole("button", { name: "Salvar ferimento" }).click();
  await expect(
    page.getByRole("heading", { name: "Corte no antebraço" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Perícias", exact: true }).click();
  const luta = page
    .locator(".sheet-skill")
    .filter({ has: page.getByText("Luta", { exact: true }) });
  await expect(luta.locator(".skill-target")).toHaveText("9");
  await expect(luta).toContainText("Base 13 · fadiga -4");
  const fortitude = page
    .locator(".sheet-skill")
    .filter({ has: page.getByText("Fortitude", { exact: true }) });
  await expect(fortitude.locator(".skill-target")).toHaveText("19");
  await page.getByRole("button", { name: "Rolar Luta", exact: true }).click();
  await expect(page.locator(".roll-result").first()).toContainText("Alvo 9");
  await expect(page.locator(".roll-result").first()).toContainText(
    "Base 13 · Fadiga -4",
  );
  await page.getByRole("button", { name: "Aceitar resultado" }).click();
  await expect(
    page.getByRole("button", { name: "Aceitar resultado" }),
  ).toHaveCount(0);
  await page.getByLabel("Quantidade de dados").fill("2");
  await page.getByLabel("Tipo de dado").selectOption("6");
  await page.getByRole("button", { name: "Rolar dados", exact: true }).click();
  await expect(page.locator(".roll-result").first()).toContainText("2d6");
  await expect(
    page.locator(".roll-result").first().locator(".roll-numbers"),
  ).toContainText("=");
  await page.getByRole("button", { name: "Inventário", exact: true }).click();
  await page
    .getByRole("button", { name: "Adicionar item", exact: true })
    .click();
  await page.getByLabel("Nome do item", { exact: true }).fill("Lanterna");
  await page.getByLabel("Quantidade", { exact: true }).fill("2");
  await page.getByLabel("Espaços por unidade", { exact: true }).fill("1");
  await page
    .getByRole("checkbox", { name: "Mostrar também em armas e equipamentos" })
    .check();
  await page.getByLabel("Tipo do equipamento").fill("Ferramenta");
  await page.getByRole("button", { name: "Salvar item", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lanterna", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar quantidade de Lanterna" })
    .click();
  await expect(
    page.locator(".inventory-capacity").filter({ visible: true }).first(),
  ).toContainText("3 / 5");
  await page.getByRole("button", { name: "Equipamentos", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lanterna", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".inventory-capacity").filter({ visible: true }).first(),
  ).toContainText("3 / 5");
  await page.reload();
  await page.getByRole("button", { name: "Resumo", exact: true }).click();
  await expect(page.getByLabel("Apelido", { exact: true })).toHaveValue("Eco");
  await page.getByText("Ajustar PV", { exact: true }).click();
  await page.getByLabel("Quantidade para PV").fill("8");
  await page.getByLabel("Tipo de evento de PV").selectOption("SINGLE_ATTACK");
  await page.getByRole("button", { name: "Reduzir 8", exact: true }).click();
  await expect(
    page.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("4 / 16");
  await expect(
    page
      .locator(".sheet-notice")
      .filter({ hasText: "Dano de ataque único atingiu metade" }),
  ).toBeVisible();
  await page.getByLabel("Valor atual de PV").fill("0");
  await page
    .locator(".resource-control.pv")
    .getByRole("button", { name: "Confirmar valor" })
    .click();
  await expect(
    page.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("0 / 16");
  await page.getByRole("button", { name: "Condições", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Registrar sucesso crítico" })
      .click();
    await expect(page.locator(".critical-count").first()).toContainText(
      `Sucessos ${i + 1}/3`,
    );
  }
  await expect(page.getByText("Estabilizado", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.locator(".audit-list")).toContainText("Recurso alterado");
  await expect(page.locator(".audit-list")).toContainText(username);
  await page.getByRole("button", { name: "Resumo", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("ficha-parte2.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Finalizar criação" }).click();
  await page.getByRole("button", { name: "Validar e enviar" }).click();
  await expect(
    page.getByText("Aguardando aprovação", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reabrir rascunho" }).click();
  await expect(page.getByText("Rascunho", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("autosave e recurso simultâneos compartilham a inicialização CSRF", async ({
  page,
}) => {
  const username = "e2e_" + randomBytes(6).toString("hex");
  const csrf = await page.request.get("/api/auth/csrf");
  const token = (await csrf.json()).csrfToken;
  const register = await page.request.post("/api/auth/register", {
    headers: { Origin: "http://localhost:5173", "X-CSRF-Token": token },
    data: {
      username,
      password: "frase segura para concorrencia",
      confirmPassword: "frase segura para concorrencia",
      characterName: "Concorrência segura",
    },
  });
  expect(register.status()).toBe(201);
  const id = (await (await page.request.get("/api/characters")).json())
    .characters[0].id;
  await page.goto("/characters/" + id);
  await page.getByLabel("Apelido", { exact: true }).fill("Texto simultâneo");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let csrfRequests = 0;
  await page.route("**/api/auth/csrf", async (route) => {
    csrfRequests++;
    await gate;
    await route.continue();
  });
  await expect.poll(() => csrfRequests).toBe(1);
  await page.getByRole("button", { name: "Reduzir PV", exact: true }).click();
  release();
  await expect(page.locator(".save-status")).toHaveText(
    "Persistência confirmada",
  );
  await expect(
    page.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("11 / 12");
  expect(csrfRequests).toBe(1);
  await page.reload();
  await expect(page.getByLabel("Apelido", { exact: true })).toHaveValue(
    "Texto simultâneo",
  );
  await expect(
    page.locator(".resource-control.pv .resource-number strong"),
  ).toHaveText("11 / 12");
});

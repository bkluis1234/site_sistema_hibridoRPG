import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
const widths = [320, 375, 390, 430, 768, 1024, 1440];
test("Origem: tutoriais persistentes e formulários acessíveis nas sete larguras", async ({
  page,
}) => {
  const username = "e5_" + randomBytes(6).toString("hex");
  const password = "frase sintetica para tutorial seguro";
  await page.goto("/register");
  await expect(page).toHaveTitle(/Origem/);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('input:not([type="hidden"])')
        .evaluateAll((inputs) =>
          inputs.every((input) =>
            Boolean((input as HTMLInputElement).labels?.length),
          ),
        ),
    ).toBe(true);
  }
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByLabel("Guardei meus códigos em um local seguro.").check();
  await page.getByRole("button", { name: "Acessar o arquivo" }).click();
  await page.goto("/help");
  await expect(
    page.getByRole("heading", { name: "Central de ajuda." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir leitura: Guia do jogador" })
    .click();
  await expect(
    page.getByRole("button", { name: "Marcar como não lido: Guia do jogador" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Marcar como não lido: Guia do jogador" }),
  ).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Ir para o conteúdo" }),
  ).toBeFocused();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => /token|password|session/i.test(k)),
    ),
  ).toBe(false);
});

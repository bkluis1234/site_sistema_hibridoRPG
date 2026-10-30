import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
test("cadastro, recuperação, ficha persistida e logout em desktop/celular", async ({
  page,
}, testInfo) => {
  const username = "e2e_" + randomBytes(6).toString("hex");
  const password = "frase muito segura para e2e";
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("login.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Criar uma conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Deixe sua marca." }),
  ).toBeVisible();
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page
    .getByLabel("Personagem inicial (opcional)")
    .fill("Sobrevivente de teste");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Guarde sua saída de emergência." }),
  ).toBeVisible();
  const code = await page.locator(".recovery-grid code").first().innerText();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar códigos" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "hibrido-codigos-recuperacao.txt",
  );
  await page.getByLabel("Guardei meus códigos em um local seguro.").check();
  await page.getByRole("button", { name: "Acessar o arquivo" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu próximo capítulo." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: /Sobrevivente de teste/ }).click();
  await page
    .getByLabel("Conceito e história")
    .fill("Persistência validada no navegador.");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toHaveText("Persistência confirmada");
  await page.reload();
  await expect(page.getByLabel("Conceito e história")).toHaveValue(
    "Persistência validada no navegador.",
  );
  await page.screenshot({
    path: testInfo.outputPath("ficha.png"),
    fullPage: true,
  });
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByRole("link", { name: "Recuperar acesso" }).click();
  await expect(
    page.getByRole("heading", { name: "Encontre o caminho." }),
  ).toBeVisible();
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page.getByLabel("Código de recuperação").fill(code);
  await page
    .getByLabel("Nova senha", { exact: true })
    .fill("nova frase de senha segura");
  await page
    .getByLabel("Confirme a nova senha")
    .fill("nova frase de senha segura");
  await page.getByRole("button", { name: "Redefinir senha" }).click();
  await expect(
    page.getByRole("heading", { name: "Senha alterada" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Entrar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta." }),
  ).toBeVisible();
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("nova frase de senha segura");
  await page.getByRole("button", { name: "Entrar no arquivo" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu próximo capítulo." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("falha de rede preserva texto e não confirma salvamento", async ({
  page,
}) => {
  const username = "e2e_" + randomBytes(6).toString("hex");
  const password = "frase muito segura para e2e";
  await page.goto("/register");
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page
    .getByLabel("Personagem inicial (opcional)")
    .fill("Rede indisponível");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByLabel("Guardei meus códigos em um local seguro.").check();
  await page.getByRole("button", { name: "Acessar o arquivo" }).click();
  await page.getByRole("link", { name: /Rede indisponível/ }).click();
  await page
    .getByLabel("Conceito e história")
    .fill("Este texto precisa ser preservado.");
  await page.route("**/api/characters/**", (route) =>
    route.request().method() === "PATCH"
      ? route.abort("failed")
      : route.continue(),
  );
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toHaveText("Falha ao salvar");
  await expect(page.getByLabel("Conceito e história")).toHaveValue(
    "Este texto precisa ser preservado.",
  );
  await expect(page.getByText("Persistência confirmada")).toHaveCount(0);
});

test("conflito mantém texto local e carrega versão atual só quando solicitado", async ({
  page,
}) => {
  const username = "e2e_" + randomBytes(6).toString("hex");
  const password = "frase muito segura para e2e";
  await page.goto("/register");
  await page.getByLabel("Nome de usuário", { exact: true }).fill(username);
  await page
    .getByLabel("Personagem inicial (opcional)")
    .fill("Versões concorrentes");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByLabel("Guardei meus códigos em um local seguro.").check();
  await page.getByRole("button", { name: "Acessar o arquivo" }).click();
  await page.getByRole("link", { name: /Versões concorrentes/ }).click();
  await page.getByLabel("Conceito e história").fill("Minha alteração local.");
  const id = page.url().split("/").at(-1)!;
  const csrf = (await page.context().cookies()).find(
    (c) => c.name === "hibrido-csrf",
  )!.value;
  const remote = await page.request.patch("/api/characters/" + id, {
    headers: { Origin: "http://localhost:5173", "X-CSRF-Token": csrf },
    data: {
      name: "Outra versão",
      concept: "Alteração no segundo dispositivo.",
      version: 1,
    },
  });
  expect(remote.status()).toBe(200);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toHaveText("Conflito entre versões");
  await expect(page.getByLabel("Conceito e história")).toHaveValue(
    "Minha alteração local.",
  );
  await expect(page.getByLabel("Cópia das alterações locais")).toContainText(
    "Minha alteração local.",
  );
  await page
    .getByRole("button", { name: "Carregar versão do servidor" })
    .click();
  await expect(page.getByLabel("Conceito e história")).toHaveValue(
    "Alteração no segundo dispositivo.",
  );
  await expect(page.getByLabel("Nome do personagem")).toHaveValue(
    "Outra versão",
  );
});

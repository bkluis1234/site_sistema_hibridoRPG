import { describe, it, expect } from "vitest";
import {
  issueCsrf,
  validCsrf,
  randomToken,
  tokenHash,
  hashPassword,
  verifyPassword,
  publicUser,
} from "../../apps/api/src/security.js";
import {
  registerSchema,
  usernameSchema,
  characterUpdateSchema,
} from "../../packages/shared/src/index.js";
import { loadConfig } from "../../apps/api/src/config.js";
import {
  requireMechanics,
  RULES_IMPLEMENTED,
} from "../../packages/rpg-rules/src/index.js";
const secret = "a".repeat(64);
describe("credenciais e sessão", () => {
  it("usa Argon2id com sal independente e não aceita senha incorreta", async () => {
    const hash = await hashPassword("frase de senha longa");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, "frase de senha longa")).toBe(true);
    expect(await verifyPassword(hash, "incorreta")).toBe(false);
    expect(await hashPassword("frase de senha longa")).not.toBe(hash);
  });
  it("gera segredos de 256 bits e representações estáveis", () => {
    const a = randomToken();
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
    expect(randomToken()).not.toBe(a);
    expect(tokenHash(a)).toHaveLength(64);
    expect(tokenHash(a)).toBe(tokenHash(a));
  });
  it("projeta somente os dados públicos", () => {
    expect(
      publicUser({
        id: "a",
        username: "b",
        role: "ADMIN",
        canCreateCampaigns: true,
      }),
    ).toEqual({
      id: "a",
      username: "b",
      role: "ADMIN",
      canCreateCampaigns: true,
    });
  });
});
describe("CSRF", () => {
  it("aceita somente a assinatura correta e cabeçalho igual ao cookie", () => {
    const csrf = issueCsrf(secret);
    expect(validCsrf(csrf, csrf, secret)).toBe(true);
    expect(validCsrf(csrf, csrf, "b".repeat(64))).toBe(false);
    expect(validCsrf(csrf, issueCsrf(secret), secret)).toBe(false);
  });
  it.each([undefined, "", "x.y", "x.y.z", 22, "a".repeat(200)])(
    "rejeita token malformado %s",
    (token) => expect(validCsrf(token, token, secret)).toBe(false),
  );
});
describe("contratos compartilhados", () => {
  it("normaliza login sem alterar nome do personagem", () => {
    expect(usernameSchema.parse(" Marcus_26 ")).toBe("marcus_26");
  });
  it("rejeita campos de privilégios e senhas diferentes/curtas", () => {
    const input = {
      username: "player",
      password: "uma senha comprida",
      confirmPassword: "uma senha comprida",
    };
    expect(registerSchema.safeParse({ ...input, role: "ADMIN" }).success).toBe(
      false,
    );
    expect(
      registerSchema.safeParse({ ...input, canCreateCampaigns: true }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...input, confirmPassword: "diferente" })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...input,
        password: "curta",
        confirmPassword: "curta",
      }).success,
    ).toBe(false);
  });
  it("permite cadastro sem email e sem personagem", () =>
    expect(
      registerSchema.safeParse({
        username: "player",
        password: "uma senha comprida",
        confirmPassword: "uma senha comprida",
      }).success,
    ).toBe(true));
  it("exige versão e impede alteração mecânica por atualização de identidade", () => {
    expect(
      characterUpdateSchema.safeParse({ name: "Nome", concept: "", version: 1 })
        .success,
    ).toBe(true);
    expect(
      characterUpdateSchema.safeParse({ name: "Nome", concept: "", version: 0 })
        .success,
    ).toBe(false);
    expect(
      characterUpdateSchema.safeParse({
        name: "Nome",
        concept: "",
        version: 1,
        status: "APPROVED",
      }).success,
    ).toBe(false);
  });
});
describe("configuração e regras", () => {
  const base = {
    DATABASE_URL: "mysql://user:pass@localhost:3306/hibrido",
    CSRF_SECRET: secret,
  };
  it("falha sem segredos obrigatórios e não inclui valores no erro", () => {
    expect(() => loadConfig({})).toThrow("Configuração inválida");
    expect(() =>
      loadConfig({ ...base, CSRF_SECRET: "secret-invalido" }),
    ).toThrow("CSRF_SECRET");
  });
  it("recusa produção sem TLS e HTTPS", () =>
    expect(() => loadConfig({ ...base, NODE_ENV: "production" })).toThrow(
      "Produção exige",
    ));
  it("valida a configuração segura de produção", () =>
    expect(
      loadConfig({
        ...base,
        NODE_ENV: "production",
        APP_ORIGIN: "https://rpg.example.com",
        DATABASE_SSL: "true",
      }).NODE_ENV,
    ).toBe("production"));
  it("recusa origem com caminho", () =>
    expect(() =>
      loadConfig({ ...base, APP_ORIGIN: "https://rpg.example.com/" }),
    ).toThrow("APP_ORIGIN"));
  it("não inventa regras antes da homologação", () => {
    expect(RULES_IMPLEMENTED).toBe(false);
    expect(() => requireMechanics()).toThrow("MANUAL_REQUIRED");
  });
});

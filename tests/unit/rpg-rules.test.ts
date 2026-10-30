import { describe, it, expect } from "vitest";
import * as r from "../../packages/rpg-rules/src/index.js";
const valid = { AGI: 2, FOR: 1, INT: 1, PRE: 1, VIG: 3 };
describe("atributos 2.6", () => {
  it("aceita oito pontos, inclusive um zero; rascunho pode estar incompleto", () => {
    expect(r.validateAttributes(valid, true).valid).toBe(true);
    expect(
      r.validateAttributes({ AGI: 0, FOR: 2, INT: 2, PRE: 1, VIG: 3 }, true)
        .valid,
    ).toBe(true);
    expect(r.validateAttributes(r.DEFAULT_ATTRIBUTES).valid).toBe(true);
    expect(r.validateAttributes(r.DEFAULT_ATTRIBUTES, true).valid).toBe(false);
    expect(r.calculateAvailablePoints(r.DEFAULT_ATTRIBUTES)).toBe(3);
  });
  it.each([
    { ...valid, AGI: 4 },
    { ...valid, AGI: -1 },
    { ...valid, AGI: 1.5 },
    { ...valid, AGI: 3 },
    { AGI: 0, FOR: 0, INT: 2, PRE: 3, VIG: 3 },
  ])("rejeita limite, excesso, fração e mais de um zero %j", (a) =>
    expect(r.validateAttributes(a, true).valid).toBe(false),
  );
});
describe("recursos e inventário", () => {
  it.each([0, 1, 2, 3])("deriva os máximos para atributo %d", (v) => {
    expect(r.calculateMaxPV(v)).toBe(10 + 2 * v);
    expect(r.calculateMaxSAN(v)).toBe(10 + 2 * v);
    expect(r.calculateMaxPE(v)).toBe(3 + v);
    expect(r.calculateInventoryCapacity(v)).toBe(v === 0 ? 2 : v * 5);
  });
  it("limita recursos ao intervalo e exige inteiros", () => {
    expect(r.validateResource(0, 12)).toBe(true);
    expect(r.validateResource(12, 12)).toBe(true);
    expect(r.validateResource(13, 12)).toBe(false);
    expect(r.validateResource(-1, 12)).toBe(false);
    expect(r.validateResource(1.5, 12)).toBe(false);
  });
  it("soma quantidade × espaços com precisão decimal", () => {
    expect(
      r.calculateInventoryUsage([
        { quantity: 3, slotsPerUnit: 0.1 },
        { quantity: 1, slotsPerUnit: 0.2 },
      ]),
    ).toBe(0.5);
    expect(r.calculateInventoryUsage([{ quantity: 0, slotsPerUnit: 3 }])).toBe(
      0,
    );
  });
  it.each([
    { quantity: -1, slotsPerUnit: 1 },
    { quantity: 1.2, slotsPerUnit: 1 },
    { quantity: 1, slotsPerUnit: -1 },
    { quantity: 1, slotsPerUnit: NaN },
  ])("rejeita inventário inválido %j", (item) =>
    expect(() => r.calculateInventoryUsage([item])).toThrow(),
  );
});
describe("perícias e fadiga", () => {
  it.each([0, 1, 2, 3])("reproduz tabela de alvo para atributo %d", (v) => {
    expect(r.calculateSkillTarget(v, false)).toBe(8 + 3 * v);
    expect(r.calculateSkillTarget(v, true)).toBe(10 + 3 * v);
  });
  it("exige quatro treinadas na finalização e rejeita duplicatas", () => {
    expect(r.validateTrainedSkills(r.SKILL_KEYS.slice(0, 4), true).valid).toBe(
      true,
    );
    expect(r.validateTrainedSkills(r.SKILL_KEYS.slice(0, 5)).valid).toBe(false);
    expect(r.validateTrainedSkills(["luta", "luta"]).valid).toBe(false);
    expect(r.validateTrainedSkills(["luta"]).valid).toBe(true);
    expect(r.validateTrainedSkills(["luta"], true).valid).toBe(false);
  });
  it.each([0, 1, 2, 3])("fadiga %d diminui só o alvo afetado", (level) => {
    expect(r.fatiguePenalty(level)).toBe(-2 * level);
    expect(r.calculateSkillTarget(2, true, level, true)).toBe(16 - 2 * level);
    expect(r.calculateSkillTarget(2, true, level, false)).toBe(16);
  });
  it("bônus respeita alvo 19 e 20 natural sempre falha", () => {
    expect(r.calculateSkillTarget(3, true, 0, true, true)).toBe(19);
    expect(r.resolveSkillCheck(20, 99)).toBe("FAILURE");
    expect(r.resolveSkillCheck(13, 13)).toBe("SUCCESS");
    expect(r.resolveSkillCheck(14, 13)).toBe("FAILURE");
  });
});
describe("condições e eventos", () => {
  it.each([
    [0, 0, "UNSTABLE"],
    [3, 0, "STABLE"],
    [0, 3, "DEAD"],
    [3, 3, "DEAD"],
  ] as const)("resolve %d sucessos e %d falhas", (s, f, expected) =>
    expect(r.stabilization(s, f)).toBe(expected),
  );
  it("alerta de ferimento depende do evento de ataque único", () => {
    expect(r.seriousInjuryAlert(6, 12, "SINGLE_ATTACK")).toBe(true);
    expect(r.seriousInjuryAlert(5, 12, "SINGLE_ATTACK")).toBe(false);
    expect(r.seriousInjuryAlert(9, 12, "ADJUSTMENT")).toBe(false);
  });
  it("rejeita contadores e fadiga fora do intervalo", () => {
    expect(() => r.stabilization(4, 0)).toThrow();
    expect(() => r.fatiguePenalty(4)).toThrow();
  });
});

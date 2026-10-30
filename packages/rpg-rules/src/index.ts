/** Regras explicitamente fornecidas na Parte 2; conferência com manual completo pendente. */
export const RULESET_VERSION = "2.6";
export const RULES_IMPLEMENTED = true;
export const RULES_SOURCE = "Prompt Parte 2 e ficha oficial, 30/10/2026";
export const ATTRIBUTE_KEYS = ["AGI", "FOR", "INT", "PRE", "VIG"] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type Attributes = Record<AttributeKey, number>;
export const DEFAULT_ATTRIBUTES: Attributes = {
  AGI: 1,
  FOR: 1,
  INT: 1,
  PRE: 1,
  VIG: 1,
};
export const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  AGI: "Agilidade",
  FOR: "Força",
  INT: "Intelecto",
  PRE: "Presença",
  VIG: "Vigor",
};
export const SKILLS = [
  ["atletismo", "Atletismo", "FOR"],
  ["acrobacia", "Acrobacia", "AGI"],
  ["crime", "Crime", "AGI"],
  ["diplomacia", "Diplomacia", "PRE"],
  ["fortitude", "Fortitude", "VIG"],
  ["furtividade", "Furtividade", "AGI"],
  ["iniciativa", "Iniciativa", "AGI"],
  ["intimidacao", "Intimidação", "PRE"],
  ["intuicao", "Intuição", "PRE"],
  ["investigacao", "Investigação", "INT"],
  ["luta", "Luta", "FOR"],
  ["medicina", "Medicina", "INT"],
  ["ocultismo", "Ocultismo", "INT"],
  ["percepcao", "Percepção", "PRE"],
  ["pilotagem", "Pilotagem", "AGI"],
  ["pontaria", "Pontaria", "AGI"],
  ["profissao", "Profissão", "INT"],
  ["reflexos", "Reflexos", "AGI"],
  ["religiao", "Religião", "PRE"],
  ["sobrevivencia", "Sobrevivência", "INT"],
  ["vontade", "Vontade", "PRE"],
] as const;
export type SkillKey = (typeof SKILLS)[number][0];
export const SKILL_KEYS = SKILLS.map((s) => s[0]);
export function requireMechanics(version = RULESET_VERSION): void {
  if (version !== RULESET_VERSION)
    throw new Error("Versão de regras não suportada.");
}
function attribute(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 3)
    throw new Error("Atributo deve estar entre 0 e 3.");
  return value;
}
export function calculateAvailablePoints(a: Attributes) {
  return 8 - ATTRIBUTE_KEYS.reduce((sum, k) => sum + a[k], 0);
}
export function validateAttributes(a: Attributes, final = false) {
  const errors: string[] = [];
  if (
    ATTRIBUTE_KEYS.some((k) => !Number.isInteger(a[k]) || a[k] < 0 || a[k] > 3)
  )
    errors.push("Cada atributo deve ser um inteiro de 0 a 3.");
  if (ATTRIBUTE_KEYS.filter((k) => a[k] === 0).length > 1)
    errors.push("Somente um atributo pode ser reduzido a zero na criação.");
  const remaining = calculateAvailablePoints(a);
  if (remaining < 0) errors.push("A distribuição ultrapassa os oito pontos.");
  if (final && remaining !== 0)
    errors.push("Distribua todos os pontos: a soma deve ser oito.");
  return { valid: !errors.length, errors, remaining };
}
export const calculateMaxPV = (vig: number) => 10 + 2 * attribute(vig);
export const calculateMaxSAN = (pre: number) => 10 + 2 * attribute(pre);
export const calculateMaxPE = (pre: number) => 3 + attribute(pre);
export function calculateMaxima(a: Attributes) {
  return {
    PV: calculateMaxPV(a.VIG),
    SAN: calculateMaxSAN(a.PRE),
    PE: calculateMaxPE(a.PRE),
  };
}
export const calculateInventoryCapacity = (strength: number) =>
  attribute(strength) === 0 ? 2 : strength * 5;
export function calculateInventoryUsage(
  items: { quantity: number; slotsPerUnit: number }[],
) {
  let cents = 0;
  for (const i of items) {
    if (
      !Number.isInteger(i.quantity) ||
      i.quantity < 0 ||
      !Number.isFinite(i.slotsPerUnit) ||
      i.slotsPerUnit < 0 ||
      Math.abs(i.slotsPerUnit * 100 - Math.round(i.slotsPerUnit * 100)) > 1e-6
    )
      throw new Error("Quantidade ou espaços inválidos.");
    cents += i.quantity * Math.round(i.slotsPerUnit * 100);
    if (!Number.isSafeInteger(cents))
      throw new Error("Inventário excede precisão suportada.");
  }
  return cents / 100;
}
export function validateTrainedSkills(
  trained: readonly string[],
  final = false,
) {
  const valid =
    trained.length <= 4 &&
    new Set(trained).size === trained.length &&
    trained.every((k) => SKILL_KEYS.includes(k as SkillKey)) &&
    (!final || trained.length === 4);
  return { valid, count: trained.length };
}
export function fatiguePenalty(level: number) {
  if (!Number.isInteger(level) || level < 0 || level > 3)
    throw new Error("Fadiga deve ser de 0 a 3.");
  return -2 * level;
}
export function calculateSkillTarget(
  value: number,
  trained: boolean,
  fatigue = 0,
  physical = false,
  effortBonus = false,
) {
  const target =
    8 +
    3 * attribute(value) +
    (trained ? 2 : 0) +
    (physical ? fatiguePenalty(fatigue) : 0) +
    (effortBonus ? 2 : 0);
  return Math.min(19, target);
}
export function resolveSkillCheck(result: number, target: number) {
  if (
    !Number.isInteger(result) ||
    result < 1 ||
    result > 20 ||
    !Number.isFinite(target)
  )
    throw new Error("Teste inválido.");
  return result !== 20 && result <= Math.min(target, 19)
    ? "SUCCESS"
    : "FAILURE";
}
export function validateResource(current: number, maximum: number) {
  return Number.isInteger(current) && current >= 0 && current <= maximum;
}
export function stabilization(successes: number, failures: number) {
  if (
    ![successes, failures].every((v) => Number.isInteger(v) && v >= 0 && v <= 3)
  )
    throw new Error("Contadores devem ser de 0 a 3.");
  return failures === 3 ? "DEAD" : successes === 3 ? "STABLE" : "UNSTABLE";
}
export const seriousInjuryAlert = (
  damage: number,
  maxPV: number,
  event: string,
) => event === "SINGLE_ATTACK" && damage >= maxPV / 2;

export const DEFAULT_PHYSICAL_SKILLS: SkillKey[] = [
  "atletismo",
  "acrobacia",
  "furtividade",
  "luta",
  "reflexos",
];

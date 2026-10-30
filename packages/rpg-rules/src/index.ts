/** Sem fórmulas até receber o Manual Híbrido 2.6 e casos de referência do mestre. */
export const RULESET_VERSION = "2.6";
export const RULES_IMPLEMENTED = false;
export function requireMechanics(): never {
  throw new Error("MANUAL_REQUIRED: regras mecânicas ainda não homologadas.");
}

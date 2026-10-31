import { randomInt } from "node:crypto";
// Motor único para fichas e sala: valida limites também fora dos contratos HTTP.
export function rollExpression(expression: string): number[] {
  if (!/^(?:[1-9]|[1-9][0-9]|100)d(?:4|6|8|10|12|20|100)$/.test(expression))
    throw new Error("Expressão de dados inválida.");
  const [count, sides] = expression.split("d").map(Number) as [number, number];
  return Array.from({ length: count }, () => randomInt(1, sides + 1));
}

import { describe, it, expect } from "vitest";
import {
  nextGameStatus,
  connectionPresence,
} from "../../packages/rpg-rules/src/game.js";
import { rollExpression } from "../../apps/api/src/dice-engine.js";
import { gameRollSchema } from "../../packages/shared/src/game.js";
import { randomUUID } from "node:crypto";
describe("ciclo de vida de jogo", () => {
  it.each([
    ["SCHEDULED", "start", "ACTIVE"],
    ["SCHEDULED", "cancel", "CANCELLED"],
    ["ACTIVE", "pause", "PAUSED"],
    ["PAUSED", "resume", "ACTIVE"],
    ["ACTIVE", "finish", "FINISHED"],
    ["PAUSED", "finish", "FINISHED"],
  ])("%s → %s", (state, action, next) =>
    expect(nextGameStatus(state!, action!)).toBe(next),
  );
  it.each(["FINISHED", "CANCELLED", "INVALID"])(
    "estado %s não reabre nem inicia por engano",
    (state) => {
      for (const action of ["start", "resume", "pause", "finish"])
        expect(nextGameStatus(state, action)).toBeNull();
    },
  );
  it("não retoma uma sessão agendada nem inicia outra já ativa", () => {
    expect(nextGameStatus("SCHEDULED", "resume")).toBeNull();
    expect(nextGameStatus("ACTIVE", "start")).toBeNull();
  });
});
describe("presença aproximada por múltiplas abas", () => {
  const now = new Date("2026-10-31T00:00:00Z");
  it("aba visível recente vence aba ausente e não duplica pessoa", () =>
    expect(
      connectionPresence(
        [
          { lastSeenAt: now, away: true },
          { lastSeenAt: now, away: false },
        ],
        now,
      ),
    ).toBe("ONLINE"));
  it("expira online em 45 s e presença em 90 s", () => {
    expect(
      connectionPresence(
        [{ lastSeenAt: new Date(+now - 45000), away: false }],
        now,
      ),
    ).toBe("AWAY");
    expect(
      connectionPresence(
        [{ lastSeenAt: new Date(+now - 90000), away: false }],
        now,
      ),
    ).toBe("OFFLINE");
    expect(connectionPresence([], now)).toBe("OFFLINE");
  });
});
describe("motor oficial único", () => {
  it.each([4, 6, 8, 10, 12, 20, 100])(
    "gera 100d%i com limites reais e sem resultado cliente",
    (sides) => {
      const results = rollExpression("100d" + sides);
      expect(results).toHaveLength(100);
      expect(
        results.every((n) => Number.isInteger(n) && n >= 1 && n <= sides),
      ).toBe(true);
    },
  );
  it.each([
    "0d20",
    "101d6",
    "1d3",
    "-1d20",
    "2d6+3",
    "999999999d100",
    "1d20; DROP TABLE users",
  ])("rejeita expressão abusiva %s", (expression) =>
    expect(() => rollExpression(expression)).toThrow(),
  );
  it("contrato rejeita resultado e sucesso fabricados", () => {
    expect(
      gameRollSchema.safeParse({
        operationId: randomUUID(),
        characterId: randomUUID(),
        expression: "1d20",
        visibility: "PUBLIC",
        results: [1],
        outcome: "SUCCESS",
      }).success,
    ).toBe(false);
  });
});

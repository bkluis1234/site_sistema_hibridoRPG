import { it, expect } from "vitest";
import { SignalMeasurements } from "../../scripts/signal-measurements.js";
it("reconcilia sinal recebido antes de registrar a resposta HTTP", () => {
  const m = new SignalMeasurements();
  m.receive("event", "a", 150);
  expect(m.latencies).toEqual([]);
  m.publish("event", 100, ["a", "b"]);
  m.receive("event", "b", 170);
  expect(m.latencies).toEqual([50, 70]);
});
it("não mascara um cliente ausente com entrega duplicada", () => {
  const m = new SignalMeasurements();
  m.publish("event", 100, ["a", "b"]);
  m.receive("event", "a", 130);
  m.receive("event", "a", 140);
  m.publish("event", 100, ["a", "b"]);
  expect(m.latencies).toEqual([30]);
  expect(m.missingDeliveries).toEqual([{ eventId: "event", clientId: "b" }]);
});
it("cliente inesperado e evento de preparação não compensam entrega ausente", () => {
  const m = new SignalMeasurements();
  m.receive("setup", "a", 80);
  m.receive("event", "unexpected", 120);
  m.receive("event", "a", 140);
  m.publish("event", 100, ["a", "b"]);
  expect(m.latencies).toEqual([40]);
  expect(m.missingDeliveries).toEqual([{ eventId: "event", clientId: "b" }]);
});
it("identifica perdas por evento mesmo quando outro evento chega completo", () => {
  const m = new SignalMeasurements();
  m.publish("first", 100, ["a", "b"]);
  m.publish("second", 200, ["a", "b"]);
  m.receive("first", "a", 130);
  m.receive("second", "a", 240);
  m.receive("second", "b", 250);
  expect(m.latencies).toHaveLength(3);
  expect(m.missingDeliveries).toEqual([{ eventId: "first", clientId: "b" }]);
});

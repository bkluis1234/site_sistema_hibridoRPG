import { it, expect } from "vitest";
import { SignalMeasurements } from "../../scripts/signal-measurements.js";
it("reconcilia sinal recebido antes de registrar a resposta HTTP", () => {
  const m = new SignalMeasurements();
  m.receive("event", "a", 150);
  expect(m.latencies).toEqual([]);
  m.publish("event", 100);
  m.receive("event", "b", 170);
  expect(m.latencies).toEqual([50, 70]);
});
it("não mascara um cliente ausente com entrega duplicada", () => {
  const m = new SignalMeasurements();
  m.publish("event", 100);
  m.receive("event", "a", 130);
  m.receive("event", "a", 140);
  m.publish("event", 100);
  expect(m.latencies).toEqual([30]);
});

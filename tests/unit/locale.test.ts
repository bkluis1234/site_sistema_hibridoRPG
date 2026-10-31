import { it, expect } from "vitest";
import { formatDate, label } from "../../apps/web/src/locale.js";
it("usa data e horário de Brasília mesmo quando a data UTC é outra", () => {
  expect(formatDate("2026-11-01T01:30:00Z", "date")).toBe("31/10/2026");
  expect(formatDate("2026-11-01T01:30:00Z", "time")).toBe("22:30");
  expect(formatDate("inválida")).toBe("Data indisponível");
});
it("distingue aprovação pendente e papel administrativo em português", () => {
  expect(label("PENDING_APPROVAL")).toBe("Aguardando aprovação");
  expect(label("ADMIN")).toBe("Administrador");
});

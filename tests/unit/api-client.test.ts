import { it, expect, vi, afterEach } from "vitest";
import { api } from "../../apps/web/src/api.js";
afterEach(() => vi.unstubAllGlobals());
it("página temporária de inicialização não é tratada como resposta válida da API", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response("<html>Iniciando</html>", { status: 200 }),
      ),
  );
  await expect(api("/auth/me")).rejects.toMatchObject({
    status: 503,
    code: "INVALID_RESPONSE",
  });
});

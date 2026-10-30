export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
let csrfToken: string | null = null;
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  if (!["GET", "HEAD"].includes(method)) {
    if (!csrfToken) {
      const response = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new ApiError(
          response.status,
          "CSRF_UNAVAILABLE",
          "Não foi possível iniciar uma sessão segura.",
        );
      csrfToken = (await response.json()).csrfToken;
    }
    headers.set("X-CSRF-Token", csrfToken!);
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      ...init,
      method,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Sem conexão com o servidor. Seus dados ainda não foram salvos.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (body?.error?.code === "CSRF_INVALID") csrfToken = null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? "Não foi possível concluir a operação.",
    );
  }
  return body as T;
}

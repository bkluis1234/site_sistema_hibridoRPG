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
let csrfPromise: Promise<string> | null = null;
async function getCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfPromise)
    csrfPromise = (async () => {
      let response: Response;
      try {
        response = await fetch("/api/auth/csrf", {
          credentials: "same-origin",
        });
      } catch {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Sem conexão para iniciar uma sessão segura.",
        );
      }
      if (!response.ok)
        throw new ApiError(
          response.status,
          "CSRF_UNAVAILABLE",
          "Não foi possível iniciar uma sessão segura.",
        );
      const data = await response.json();
      if (typeof data.csrfToken !== "string")
        throw new ApiError(
          503,
          "CSRF_UNAVAILABLE",
          "Resposta de segurança inválida.",
        );
      csrfToken = data.csrfToken;
      return data.csrfToken as string;
    })().finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  if (!["GET", "HEAD"].includes(method)) {
    headers.set("X-CSRF-Token", await getCsrf());
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

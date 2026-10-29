import { browserApiUrl, getAccessToken, hasSessionHint, refreshSession } from "@/features/auth/session";
import { ApiError, readProblem } from "./client";

interface BrowserRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Envia o access token; em 401 renova uma vez (single-flight) e repete (arquivo 16 §5). */
  auth?: boolean;
}

/** Chamada do navegador para a API (áreas logadas — ADR-F03). Lança ApiError em respostas não-2xx. */
export async function apiRequest<T = void>(path: string, options: BrowserRequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  if (auth && !getAccessToken() && hasSessionHint()) {
    await refreshSession();
  }

  const send = () =>
    fetch(`${browserApiUrl()}${path}`, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(auth && getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await send();
  if (response.status === 401 && auth && (await refreshSession())) {
    response = await send();
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }

  const hasJson = response.headers.get("content-type")?.includes("json");
  return (hasJson ? await response.json() : undefined) as T;
}

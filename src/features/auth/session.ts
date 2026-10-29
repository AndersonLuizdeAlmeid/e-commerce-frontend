import type { components } from "@/shared/api/schema";

export type SessionResponse = components["schemas"]["SessionResponse"];
export type SessionUser = components["schemas"]["SessionUserResponse"];

/**
 * Sessão no navegador (arquivo 16 §5): access token só em memória (nunca localStorage); o refresh token fica no
 * cookie HttpOnly da API. O localStorage guarda apenas uma "dica" de que houve login, para visitantes anônimos não
 * dispararem um /refresh a cada página.
 */
const SESSION_HINT_KEY = "ecommerce:has-session";

let accessToken: string | null = null;
let refreshing: Promise<SessionResponse | null> | null = null;

export function browserApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(session: SessionResponse): void {
  accessToken = session.accessToken;
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  } catch {
    // modo privado ou storage bloqueado: só perde a otimização
  }
}

export function clearSession(): void {
  accessToken = null;
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // idem
  }
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Renova a sessão pelo cookie. Single-flight: várias chamadas simultâneas compartilham o mesmo request, porque dois
 * refresh com o mesmo token seriam tratados pela API como reuso e derrubariam a sessão (RF-003 CA2).
 */
export function refreshSession(): Promise<SessionResponse | null> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<SessionResponse | null> {
  try {
    const response = await fetch(`${browserApiUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "ecommerce-web" },
    });
    if (!response.ok) {
      clearSession();
      return null;
    }
    const session = (await response.json()) as SessionResponse;
    setSession(session);
    return session;
  } catch {
    return null;
  }
}

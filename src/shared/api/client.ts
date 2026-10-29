/** Formato de erro da API (RFC 9457 — specs/13-validacao-e-erros.md). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
  [extension: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null,
  ) {
    super(problem?.title ?? `Erro ${status} ao chamar a API`);
    this.name = "ApiError";
  }
}

interface ServerFetchOptions {
  /** Segundos até o Next.js revalidar o dado (ISR). */
  revalidate?: number;
  tags?: string[];
}

function apiBaseUrl(): string {
  const url = process.env.API_INTERNAL_URL;
  if (!url) {
    throw new Error("API_INTERNAL_URL não configurada.");
  }
  return url;
}

/**
 * Chamada crua feita pelo servidor Next.js. Não segue redirects: quem chama decide o que fazer com
 * 301/410 (specs/24-seo.md, SEO-02).
 */
export function serverFetch(path: string, options: ServerFetchOptions = {}): Promise<Response> {
  return fetch(`${apiBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
      // Partição própria no rate limiter: o servidor da loja chama a API por todos os visitantes (specs/11 §3).
      ...(process.env.API_INTERNAL_KEY ? { "X-Internal-Key": process.env.API_INTERNAL_KEY } : {}),
    },
    redirect: "manual",
    next: { revalidate: options.revalidate, tags: options.tags },
  });
}

export async function readProblem(response: Response): Promise<ProblemDetails | null> {
  return response.headers.get("content-type")?.includes("json") ? ((await response.json()) as ProblemDetails) : null;
}

/** GET feito pelo servidor Next.js (Server Components). Lança ApiError em respostas não-2xx. */
export async function serverGet<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const response = await serverFetch(path, options);

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }

  return (await response.json()) as T;
}

/** Monta a query string repetindo a chave para arrays (`colors=a&colors=b`), como a API espera. */
export function toQueryString(params: Record<string, string | number | readonly string[] | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

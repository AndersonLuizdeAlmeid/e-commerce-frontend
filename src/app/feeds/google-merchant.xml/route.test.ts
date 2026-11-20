import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /feeds/google-merchant.xml", () => {
  beforeEach(() => {
    vi.stubEnv("API_INTERNAL_URL", "http://api.teste");
    vi.stubEnv("API_INTERNAL_KEY", "chave-interna");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("repassa o XML da API com cache de 1 h e as tags do catálogo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<rss/>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<rss/>");
    expect(response.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { next: { revalidate: number; tags: string[] } }];
    expect(url).toBe("http://api.teste/api/v1/feeds/google-merchant.xml");
    expect(init.next).toEqual({ revalidate: 3600, tags: ["products", "categories", "collections"] });
    expect((init.headers as Record<string, string>)["X-Internal-Key"]).toBe("chave-interna");
  });

  it("devolve 503 em vez de um feed vazio quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("600");
  });
});

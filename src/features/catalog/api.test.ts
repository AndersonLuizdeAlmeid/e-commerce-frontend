import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/client";
import { getCategoryBySlug, getProductBySlug, getProducts, slugFromLocation } from "./api";

function jsonResponse(status: number, body: unknown, contentType = "application/json", headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": contentType, ...headers } });
}

beforeEach(() => vi.stubEnv("API_INTERNAL_URL", "http://api.teste"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getCategoryBySlug", () => {
  it("retorna a categoria quando a API responde 200", async () => {
    const category = { id: "1", name: "Camisetas", slug: "camisetas", description: "", seo: { title: "Camisetas", description: "" } };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, category));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCategoryBySlug("camisetas")).resolves.toEqual(category);
    expect(fetchMock).toHaveBeenCalledWith("http://api.teste/api/v1/catalog/categories/camisetas", expect.anything());
  });

  it("retorna null quando a API responde 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(404, { code: "Catalog.CategoryNotFound" }, "application/problem+json")),
    );

    await expect(getCategoryBySlug("nao-existe")).resolves.toBeNull();
  });

  it("propaga outros erros como ApiError com o ProblemDetails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { title: "Erro inesperado" }, "application/problem+json")));

    const error = await getCategoryBySlug("camisetas").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem?.title).toBe("Erro inesperado");
  });
});

describe("getProducts", () => {
  it("repete a chave para filtros múltiplos e omite os vazios", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [], page: 1, pageSize: 24, totalItems: 0, totalPages: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    await getProducts({ page: 1, category: "camisetas", colors: ["preto", "azul"], sizes: [], sort: "price:asc" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.teste/api/v1/catalog/products?page=1&category=camisetas&colors=preto&colors=azul&sort=price%3Aasc",
      expect.anything(),
    );
  });
});

describe("getProductBySlug (SEO-02)", () => {
  it("não segue redirect e devolve o slug novo", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 301, headers: { location: "/api/v1/catalog/products/camiseta-basica" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getProductBySlug("camiseta-antiga")).resolves.toEqual({ kind: "moved", slug: "camiseta-basica" });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: "manual" }));
  });

  it("410 vira 'gone' com a categoria para redirecionar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(410, { code: "Catalog.ProductUnavailable", categorySlug: "camisetas" }, "application/problem+json")),
    );

    await expect(getProductBySlug("fora-de-linha")).resolves.toEqual({ kind: "gone", categorySlug: "camisetas" });
  });

  it("404 vira 'not-found'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, { code: "Catalog.ProductNotFound" }, "application/problem+json")));

    await expect(getProductBySlug("nao-existe")).resolves.toEqual({ kind: "not-found" });
  });

  it("extrai o slug do Location absoluto ou relativo", () => {
    expect(slugFromLocation("https://api.loja.com/api/v1/catalog/products/bon%C3%A9")).toBe("boné");
    expect(slugFromLocation(null)).toBeNull();
  });
});

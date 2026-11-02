import { describe, expect, it } from "vitest";
import {
  buildListingHref,
  hasRefinements,
  listingCanonical,
  parseListingParams,
  toProductListQuery,
  visiblePages,
} from "./listing-params";

describe("parâmetros da listagem", () => {
  it("lê página, filtros repetidos, preço com vírgula e ordenação", () => {
    const state = parseListingParams({
      pagina: "2",
      cor: ["preto", "azul-marinho", "preto"],
      tamanho: "M",
      preco_min: "49,90",
      ordem: "menor-preco",
    });

    expect(state).toEqual({
      page: 2,
      colors: ["preto", "azul-marinho"],
      sizes: ["M"],
      minPrice: 49.9,
      maxPrice: undefined,
      sort: "menor-preco",
    });
  });

  it("troca valores inválidos pelo padrão em vez de quebrar", () => {
    const state = parseListingParams({ pagina: "-3", preco_max: "abc", ordem: "estoque" });

    expect(state.page).toBe(1);
    expect(state.maxPrice).toBeUndefined();
    expect(state.sort).toBe("novidades");
  });

  it("traduz para a query da API", () => {
    const query = toProductListQuery(parseListingParams({ ordem: "maior-preco", cor: "preto" }), { category: "camisetas" });

    expect(query).toMatchObject({ category: "camisetas", page: 1, pageSize: 24, colors: ["preto"], sort: "price:desc" });
  });

  it("só considera refinamento filtros e ordenação, não a página (SEO-04)", () => {
    expect(hasRefinements(parseListingParams({ pagina: "3" }))).toBe(false);
    expect(hasRefinements(parseListingParams({ tamanho: "G" }))).toBe(true);
    expect(hasRefinements(parseListingParams({ ordem: "nome" }))).toBe(true);
  });

  it("monta links preservando filtros e omitindo o padrão", () => {
    const state = parseListingParams({ cor: "preto", pagina: "2" });

    expect(buildListingHref("/categoria/camisetas", state, { page: 3 })).toBe("/categoria/camisetas?cor=preto&pagina=3");
    expect(buildListingHref("/categoria/camisetas", state, { page: 1, colors: [] })).toBe("/categoria/camisetas");
    expect(buildListingHref("/busca", state, { page: 1 }, { q: "boné" })).toBe("/busca?q=bon%C3%A9&cor=preto");
  });

  it("canonical próprio por página, sem filtros (SEO-11)", () => {
    expect(listingCanonical("/categoria/camisetas", 1)).toBe("/categoria/camisetas");
    expect(listingCanonical("/categoria/camisetas", 4)).toBe("/categoria/camisetas?pagina=4");
  });

  it("pagina com primeira, última e vizinhas da atual", () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(visiblePages(6, 12)).toEqual([1, null, 4, 5, 6, 7, 8, null, 12]);
  });
});

describe("categoria na coleção (RF-024)", () => {
  it("lê, conta como refinamento e volta para a URL", () => {
    const state = parseListingParams({ categoria: "aneis" });

    expect(state.category).toBe("aneis");
    expect(hasRefinements(state)).toBe(true);
    expect(buildListingHref("/colecao/eles", state)).toBe("/colecao/eles?categoria=aneis");
  });

  it("vazio é o mesmo que todas: o formulário manda categoria= na opção Todas", () => {
    const state = parseListingParams({ categoria: "" });

    expect(state.category).toBeUndefined();
    expect(hasRefinements(state)).toBe(false);
  });

  it("vai para a API junto com a coleção", () => {
    const state = parseListingParams({ categoria: "aneis" });

    expect(toProductListQuery(state, { collection: "eles", category: state.category })).toMatchObject({ collection: "eles", category: "aneis" });
  });
});

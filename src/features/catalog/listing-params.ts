import type { ProductListQuery } from "./api";

/**
 * Parâmetros das páginas de listagem em português (specs/24-seo.md, SEO-11):
 * `?pagina=2&cor=preto&cor=azul-marinho&tamanho=M&preco_min=50&preco_max=200&ordem=menor-preco`.
 */
export type SearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS = [
  { value: "novidades", label: "Novidades", api: "createdAt:desc" },
  { value: "menor-preco", label: "Menor preço", api: "price:asc" },
  { value: "maior-preco", label: "Maior preço", api: "price:desc" },
  { value: "nome", label: "Nome (A–Z)", api: "name:asc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortValue = "novidades";
export const LISTING_PAGE_SIZE = 24;

export interface ListingState {
  page: number;
  colors: string[];
  sizes: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortValue;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
}

function first(value: string | string[] | undefined): string | undefined {
  return all(value)[0];
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const price = Number(value.replace(",", "."));
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

/** Lê a URL tolerando lixo: valor inválido vira o padrão, nunca erro. */
export function parseListingParams(params: SearchParams): ListingState {
  const page = Number.parseInt(first(params.pagina) ?? "1", 10);
  const sort = first(params.ordem);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    colors: [...new Set(all(params.cor))],
    sizes: [...new Set(all(params.tamanho))],
    minPrice: parsePrice(first(params.preco_min)),
    maxPrice: parsePrice(first(params.preco_max)),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortValue) : DEFAULT_SORT,
  };
}

export function toProductListQuery(state: ListingState, extra: Pick<ProductListQuery, "category" | "search"> = {}): ProductListQuery {
  return {
    ...extra,
    page: state.page,
    pageSize: LISTING_PAGE_SIZE,
    colors: state.colors,
    sizes: state.sizes,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    sort: SORT_OPTIONS.find((option) => option.value === state.sort)?.api,
  };
}

/** Filtros ou ordenação aplicados: a página vira `noindex,follow` (SEO-04). */
export function hasRefinements(state: ListingState): boolean {
  return (
    state.colors.length > 0 ||
    state.sizes.length > 0 ||
    state.minPrice !== undefined ||
    state.maxPrice !== undefined ||
    state.sort !== DEFAULT_SORT
  );
}

/** Link para a mesma listagem com outra página/filtros; omite o que está no padrão. */
export function buildListingHref(
  basePath: string,
  state: ListingState,
  overrides: Partial<ListingState> = {},
  extra: Record<string, string | undefined> = {},
): string {
  const next = { ...state, ...overrides };
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(extra)) {
    if (value) {
      search.append(key, value);
    }
  }
  next.colors.forEach((color) => search.append("cor", color));
  next.sizes.forEach((size) => search.append("tamanho", size));
  if (next.minPrice !== undefined) {
    search.append("preco_min", String(next.minPrice));
  }
  if (next.maxPrice !== undefined) {
    search.append("preco_max", String(next.maxPrice));
  }
  if (next.sort !== DEFAULT_SORT) {
    search.append("ordem", next.sort);
  }
  if (next.page > 1) {
    search.append("pagina", String(next.page));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Canonical da listagem: própria por página (SEO-11), sem filtros nem ordenação (SEO-04). */
export function listingCanonical(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?pagina=${page}` : basePath;
}

/** Primeira, última e até duas vizinhas da atual; `null` marca um salto ("…"). */
export function visiblePages(current: number, total: number): (number | null)[] {
  const wanted = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous !== undefined && page - previous > 1 ? [null, page] : [page];
  });
}


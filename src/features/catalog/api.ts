import { ApiError, readProblem, serverFetch, serverGet, toQueryString } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";

type Schemas = components["schemas"];

export type CategorySummary = Schemas["CategorySummaryResponse"];
export type CategoryDetails = Schemas["CategoryDetailsResponse"];
export type ProductSummary = Schemas["ProductSummaryResponse"];
export type ProductPage = Schemas["PagedResponseOfProductSummaryResponse"];
export type ProductDetails = Schemas["ProductDetailsResponse"];
export type ProductVariant = Schemas["ProductVariantResponse"];
export type ProductImage = Schemas["ProductImageResponse"];
export type Color = Schemas["ColorResponse"];
export type Size = Schemas["SizeResponse"];
export type CatalogFilters = Schemas["CatalogFiltersResponse"];
export type Sitemap = Schemas["SitemapResponse"];
export type CollectionSummary = Schemas["CollectionSummaryResponse"];
export type CollectionDetails = Schemas["CollectionDetailsResponse"];
export type Showcase = Schemas["ShowcaseResponse"];

/** Tema das cartelas da coleção (specs/26 §2.2): "Graphite" é o grafite com folha prateada. */
export type CardTheme = "Ivory" | "Graphite";

// TTLs alinhados ao HybridCache da API (specs/12-cache.md §3); a revalidação sob demanda vem com o admin.
const CATEGORIES_REVALIDATE_SECONDS = 300;
const PRODUCT_LIST_REVALIDATE_SECONDS = 120;
const PRODUCT_REVALIDATE_SECONDS = 600;
const FILTERS_REVALIDATE_SECONDS = 600;
const SITEMAP_REVALIDATE_SECONDS = 3600;
const SHOWCASE_REVALIDATE_SECONDS = 300;

export function getCategories(): Promise<CategorySummary[]> {
  return serverGet<CategorySummary[]>("/api/v1/catalog/categories", {
    revalidate: CATEGORIES_REVALIDATE_SECONDS,
    tags: ["categories"],
  });
}

/** Retorna null quando a categoria não existe ou está inativa (a página responde 404). */
export async function getCategoryBySlug(slug: string): Promise<CategoryDetails | null> {
  try {
    return await serverGet<CategoryDetails>(`/api/v1/catalog/categories/${encodeURIComponent(slug)}`, {
      revalidate: CATEGORIES_REVALIDATE_SECONDS,
      tags: ["categories", `category:${slug}`],
    });
  } catch (error) {
    // 301: a página descobre o slug novo em findMovedCategorySlug.
    if (error instanceof ApiError && (error.status === 404 || error.status === 301 || error.status === 308)) {
      return null;
    }
    throw error;
  }
}

/** RN-025: slug atual de uma categoria que mudou de endereço; null quando a categoria não existe mesmo. */
export async function findMovedCategorySlug(slug: string): Promise<string | null> {
  const response = await serverFetch(`/api/v1/catalog/categories/${encodeURIComponent(slug)}`, {
    revalidate: CATEGORIES_REVALIDATE_SECONDS,
    tags: ["categories", `category:${slug}`],
  });
  return response.status === 301 || response.status === 308 ? slugFromLocation(response.headers.get("location")) : null;
}

export function getCollections(): Promise<CollectionSummary[]> {
  return serverGet<CollectionSummary[]>("/api/v1/catalog/collections", {
    revalidate: CATEGORIES_REVALIDATE_SECONDS,
    tags: ["collections"],
  });
}

/** Retorna null quando a coleção não existe ou está inativa (RF-024 CA2: a página responde 404). */
export async function getCollectionBySlug(slug: string): Promise<CollectionDetails | null> {
  try {
    return await serverGet<CollectionDetails>(`/api/v1/catalog/collections/${encodeURIComponent(slug)}`, {
      revalidate: CATEGORIES_REVALIDATE_SECONDS,
      tags: ["collections", `collection:${slug}`],
    });
  } catch (error) {
    // 301: a página descobre o slug novo em findMovedCollectionSlug.
    if (error instanceof ApiError && (error.status === 404 || error.status === 301 || error.status === 308)) {
      return null;
    }
    throw error;
  }
}

/** RF-024 CA4: slug atual de uma coleção que mudou de endereço; null quando ela não existe mesmo. */
export async function findMovedCollectionSlug(slug: string): Promise<string | null> {
  const response = await serverFetch(`/api/v1/catalog/collections/${encodeURIComponent(slug)}`, {
    revalidate: CATEGORIES_REVALIDATE_SECONDS,
    tags: ["collections", `collection:${slug}`],
  });
  return response.status === 301 || response.status === 308 ? slugFromLocation(response.headers.get("location")) : null;
}

/** RF-025: peça em destaque e ocasião vigente. Revalidada pelo admin; o TTL faz a ocasião virar sozinha no dia certo. */
export function getShowcase(): Promise<Showcase> {
  return serverGet<Showcase>("/api/v1/catalog/showcase", {
    revalidate: SHOWCASE_REVALIDATE_SECONDS,
    tags: ["showcase", "products", "categories"],
  });
}

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  collection?: string;
  search?: string;
  colors?: readonly string[];
  sizes?: readonly string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export function getProducts(query: ProductListQuery): Promise<ProductPage> {
  const queryString = toQueryString({
    page: query.page,
    pageSize: query.pageSize,
    category: query.category,
    collection: query.collection,
    search: query.search,
    colors: query.colors,
    sizes: query.sizes,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
  });

  return serverGet<ProductPage>(`/api/v1/catalog/products${queryString}`, {
    revalidate: PRODUCT_LIST_REVALIDATE_SECONDS,
    tags: ["products"],
  });
}

export type ProductLookup =
  | { kind: "found"; product: ProductDetails }
  | { kind: "moved"; slug: string }
  | { kind: "gone"; categorySlug: string | null }
  | { kind: "not-found" };

/** Resolve o slug como a API (SEO-02): 200 produto, 301 slug antigo, 410 fora da loja, 404 inexistente. */
export async function getProductBySlug(slug: string): Promise<ProductLookup> {
  const response = await serverFetch(`/api/v1/catalog/products/${encodeURIComponent(slug)}`, {
    revalidate: PRODUCT_REVALIDATE_SECONDS,
    tags: ["products", `product:${slug}`],
  });

  if (response.ok) {
    return { kind: "found", product: (await response.json()) as ProductDetails };
  }

  if (response.status === 301 || response.status === 308) {
    const newSlug = slugFromLocation(response.headers.get("location"));
    if (newSlug) {
      return { kind: "moved", slug: newSlug };
    }
  }

  if (response.status === 410) {
    const problem = await readProblem(response);
    const categorySlug = typeof problem?.categorySlug === "string" ? problem.categorySlug : null;
    return { kind: "gone", categorySlug };
  }

  if (response.status === 404) {
    return { kind: "not-found" };
  }

  throw new ApiError(response.status, await readProblem(response));
}

/** "/api/v1/catalog/products/camiseta-basica" → "camiseta-basica" */
export function slugFromLocation(location: string | null): string | null {
  if (!location) {
    return null;
  }
  const path = new URL(location, "http://api.local").pathname;
  const last = path.split("/").filter(Boolean).at(-1);
  return last ? decodeURIComponent(last) : null;
}

export function getCatalogFilters(category?: string, collection?: string): Promise<CatalogFilters> {
  return serverGet<CatalogFilters>(`/api/v1/catalog/filters${toQueryString({ category, collection })}`, {
    revalidate: FILTERS_REVALIDATE_SECONDS,
    tags: ["products"],
  });
}

export function getSitemap(): Promise<Sitemap> {
  return serverGet<Sitemap>("/api/v1/catalog/sitemap", {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: ["products", "categories", "collections"],
  });
}

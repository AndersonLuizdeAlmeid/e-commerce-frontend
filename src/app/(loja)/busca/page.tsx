import type { Metadata } from "next";
import { getCatalogFilters, getProducts } from "@/features/catalog/api";
import { ListingFilters } from "@/features/catalog/components/ListingFilters";
import { Pagination } from "@/features/catalog/components/Pagination";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { parseListingParams, toProductListQuery, type SearchParams } from "@/features/catalog/listing-params";
import { SearchForm } from "@/shared/ui/SearchForm";

const SEARCH_MAX_LENGTH = 100;

// Busca: SSR e fora do índice para não gerar conteúdo duplicado (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Busca",
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await searchParams;
  const rawTerm = Array.isArray(query.q) ? query.q[0] : query.q;
  const term = rawTerm?.trim().slice(0, SEARCH_MAX_LENGTH) ?? "";

  if (!term) {
    return (
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Buscar produtos</h1>
        <div className="mt-6">
          <SearchForm />
        </div>
      </section>
    );
  }

  const state = parseListingParams(query);
  const [products, filters] = await Promise.all([
    getProducts(toProductListQuery(state, { search: term })),
    getCatalogFilters(),
  ]);

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Resultados para “{term}”</h1>
      <p className="mt-2 text-sm text-muted">
        {products.totalItems === 1 ? "1 produto encontrado" : `${products.totalItems} produtos encontrados`}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Filtros">
          <ListingFilters action="/busca" filters={filters} state={state} hidden={{ q: term }} />
        </aside>
        <div>
          <ProductGrid products={products.items} emptyMessage="Nenhum produto encontrado. Tente outro termo." />
          <Pagination basePath="/busca" state={state} totalPages={products.totalPages} extra={{ q: term }} />
        </div>
      </div>
    </section>
  );
}

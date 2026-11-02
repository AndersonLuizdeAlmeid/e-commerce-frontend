import type { Metadata } from "next";
import { getCatalogFilters, getProducts } from "@/features/catalog/api";
import { ListingFilters } from "@/features/catalog/components/ListingFilters";
import { ListingLayout } from "@/features/catalog/components/ListingLayout";
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
      <section className="mx-auto w-full max-w-xl px-4 py-16">
        <h1 className="font-display text-4xl leading-tight">Buscar peças</h1>
        <div className="mt-8">
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
    <ListingLayout
      heading={
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
          Resultados para “{term}”
        </h1>
      }
      intro={
        <p className="numeros mt-3 text-sm text-vitrine-texto">
          {products.totalItems === 1 ? "1 peça encontrada" : `${products.totalItems} peças encontradas`}
        </p>
      }
      filters={(idPrefix) => <ListingFilters action="/busca" filters={filters} state={state} hidden={{ q: term }} idPrefix={idPrefix} />}
    >
      <ProductGrid
        besideFilters
        products={products.items}
        emptyMessage="Nenhuma peça encontrada para essa busca."
        emptyAction={{ href: "/", label: "Ver as novidades" }}
      />
      <Pagination basePath="/busca" state={state} totalPages={products.totalPages} extra={{ q: term }} />
    </ListingLayout>
  );
}

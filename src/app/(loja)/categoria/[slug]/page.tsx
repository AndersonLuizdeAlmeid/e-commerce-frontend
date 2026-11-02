import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogFilters, getCategoryBySlug, getProducts } from "@/features/catalog/api";
import { Breadcrumb } from "@/features/catalog/components/Breadcrumb";
import { ListingFilters } from "@/features/catalog/components/ListingFilters";
import { ListingLayout } from "@/features/catalog/components/ListingLayout";
import { Pagination } from "@/features/catalog/components/Pagination";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { breadcrumbJsonLd } from "@/features/catalog/json-ld";
import {
  hasRefinements,
  listingCanonical,
  parseListingParams,
  toProductListQuery,
  type SearchParams,
} from "@/features/catalog/listing-params";
import { resolveVariantLabels } from "@/features/catalog/variant-labels";
import { absoluteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/JsonLd";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

// Os filtros vêm da query string, então a página é renderizada a cada request;
// os dados continuam em cache (fetch com revalidate + HybridCache na API).
export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return {};
  }

  const state = parseListingParams(query);
  const basePath = `/categoria/${category.slug}`;
  const title = state.page > 1 ? `${category.seo.title} — página ${state.page}` : category.seo.title;

  return {
    title,
    description: category.seo.description,
    alternates: { canonical: listingCanonical(basePath, state.page) },
    // SEO-04: filtros e ordenação não são indexados, mas os links seguem rastreáveis.
    robots: hasRefinements(state) ? { index: false, follow: true } : undefined,
    openGraph: { title: category.seo.title, description: category.seo.description, url: basePath },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound(); // O layout já trata slug antigo e inexistente; aqui é a categoria sair entre os dois.
  }

  const state = parseListingParams(query);
  const basePath = `/categoria/${category.slug}`;
  const [products, filters] = await Promise.all([
    getProducts(toProductListQuery(state, { category: category.slug })),
    getCatalogFilters(category.slug),
  ]);
  const labels = resolveVariantLabels(category);

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: absoluteUrl("/") },
          { name: category.name, url: absoluteUrl(basePath) },
        ])}
      />

      <ListingLayout
        heading={
          <>
            <Breadcrumb items={[{ name: "Início", href: "/" }, { name: category.name }]} />
            <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.02em] sm:text-6xl">{category.name}</h1>
          </>
        }
        intro={
          <>
            {category.description && <p className="mt-3 max-w-2xl text-vitrine-texto">{category.description}</p>}
            <p className="numeros mt-4 text-sm text-vitrine-texto">
              {products.totalItems === 1 ? "1 peça" : `${products.totalItems} peças`}
            </p>
          </>
        }
        filters={(idPrefix) => <ListingFilters action={basePath} filters={filters} state={state} idPrefix={idPrefix} labels={labels} />}
      >
        <ProductGrid
          besideFilters
          products={products.items}
          emptyMessage="Nenhuma peça com esses filtros."
          emptyAction={hasRefinements(state) ? { href: basePath, label: "Limpar filtros" } : { href: "/", label: "Ver as novidades" }}
        />
        <Pagination basePath={basePath} state={state} totalPages={products.totalPages} />
      </ListingLayout>
    </article>
  );
}

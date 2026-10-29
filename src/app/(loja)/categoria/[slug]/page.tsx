import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogFilters, getCategoryBySlug, getProducts } from "@/features/catalog/api";
import { ListingFilters } from "@/features/catalog/components/ListingFilters";
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
    notFound();
  }

  const state = parseListingParams(query);
  const basePath = `/categoria/${category.slug}`;
  const [products, filters] = await Promise.all([
    getProducts(toProductListQuery(state, { category: category.slug })),
    getCatalogFilters(category.slug),
  ]);

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: absoluteUrl("/") },
          { name: category.name, url: absoluteUrl(basePath) },
        ])}
      />

      <nav aria-label="Trilha de navegação" className="text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{category.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-muted">{category.description}</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Filtros">
          <ListingFilters action={basePath} filters={filters} state={state} />
        </aside>

        <section aria-label="Produtos">
          <p className="mb-6 text-sm text-muted">
            {products.totalItems === 1 ? "1 produto" : `${products.totalItems} produtos`}
          </p>
          <ProductGrid
            products={products.items}
            emptyMessage="Nenhum produto encontrado com esses filtros. Tente limpar algum deles."
          />
          <Pagination basePath={basePath} state={state} totalPages={products.totalPages} />
        </section>
      </div>
    </article>
  );
}

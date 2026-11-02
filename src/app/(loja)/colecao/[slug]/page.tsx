import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCatalogFilters, getCollectionBySlug, getProducts, type CardTheme } from "@/features/catalog/api";
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
import { absoluteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/JsonLd";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

// Como a categoria: os filtros vêm da query string e os dados continuam em cache (RF-024 CA3).
export async function generateMetadata({ params, searchParams }: CollectionPageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    return {};
  }

  const state = parseListingParams(query);
  const basePath = `/colecao/${collection.slug}`;
  const title = state.page > 1 ? `${collection.seo.title} — página ${state.page}` : collection.seo.title;

  return {
    title,
    description: collection.seo.description,
    alternates: { canonical: listingCanonical(basePath, state.page) },
    robots: hasRefinements(state) ? { index: false, follow: true } : undefined,
    openGraph: { title: collection.seo.title, description: collection.seo.description, url: basePath },
  };
}

/** Coleção (specs/26 §4.2): a mesma vitrine da categoria, com a categoria como primeiro filtro. */
export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    notFound(); // O layout já trata slug antigo e inexistente; aqui é a coleção sair entre os dois.
  }

  const state = parseListingParams(query);
  const basePath = `/colecao/${collection.slug}`;
  const [products, filters] = await Promise.all([
    getProducts(toProductListQuery(state, { collection: collection.slug, category: state.category })),
    getCatalogFilters(undefined, collection.slug),
  ]);

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: absoluteUrl("/") },
          { name: collection.name, url: absoluteUrl(basePath) },
        ])}
      />

      <ListingLayout
        heading={
          <>
            <Breadcrumb items={[{ name: "Início", href: "/" }, { name: collection.name }]} />
            <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.02em] sm:text-6xl">{collection.name}</h1>
          </>
        }
        intro={
          <>
            {collection.imageUrl && (
              <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-[3px] bg-vitrine-funda sm:aspect-[3/1]">
                <Image src={collection.imageUrl} alt="" fill priority sizes="(min-width: 1152px) 1120px, 100vw" className="object-cover" />
              </div>
            )}
            {collection.description && <p className="mt-3 max-w-2xl text-vitrine-texto">{collection.description}</p>}
            <p className="numeros mt-4 text-sm text-vitrine-texto">
              {products.totalItems === 1 ? "1 peça" : `${products.totalItems} peças`}
            </p>
          </>
        }
        filters={(idPrefix) => <ListingFilters action={basePath} filters={filters} state={state} idPrefix={idPrefix} categories={filters.categories} />}
      >
        <ProductGrid
          besideFilters
          products={products.items}
          tema={collection.cardTheme as CardTheme}
          emptyMessage={hasRefinements(state) ? "Nenhuma peça com esses filtros." : "Esta coleção ainda não tem peças na loja."}
          emptyAction={hasRefinements(state) ? { href: basePath, label: "Limpar filtros" } : { href: "/", label: "Ver as novidades" }}
        />
        <Pagination basePath={basePath} state={state} totalPages={products.totalPages} />
      </ListingLayout>
    </article>
  );
}

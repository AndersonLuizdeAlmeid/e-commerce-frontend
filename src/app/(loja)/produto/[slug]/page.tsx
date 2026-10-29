import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug, type ProductDetails } from "@/features/catalog/api";
import { ProductPurchase, ProductPurchaseFromUrl } from "@/features/catalog/components/ProductPurchase";
import { breadcrumbJsonLd, productJsonLd } from "@/features/catalog/json-ld";
import { absoluteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/JsonLd";

export const revalidate = 600;

// Nenhuma página gerada no build: cada produto é renderizado no primeiro acesso e depois cacheado (ISR).
export function generateStaticParams() {
  return [];
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await getProductBySlug(slug);
  if (lookup.kind !== "found") {
    return {};
  }

  const { product } = lookup;
  const path = `/produto/${product.slug}`;
  const image = product.images[0];

  return {
    title: product.seo.title,
    description: product.seo.description,
    // SEO-04: cor/tamanho não geram URL indexável própria.
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: product.seo.title,
      description: product.seo.description,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.seo.title, description: product.seo.description },
    // SEO-07: preço no compartilhamento (WhatsApp/Facebook leem product:price:*).
    other: {
      "product:price:amount": product.priceFrom.toFixed(2),
      "product:price:currency": "BRL",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const lookup = await getProductBySlug(slug);

  // SEO-02: slug antigo → redirect permanente; produto fora da loja → redirect permanente para a categoria.
  if (lookup.kind === "moved") {
    permanentRedirect(`/produto/${lookup.slug}`);
  }
  if (lookup.kind === "gone") {
    permanentRedirect(lookup.categorySlug ? `/categoria/${lookup.categorySlug}` : "/");
  }
  if (lookup.kind === "not-found") {
    notFound();
  }

  const { product } = lookup;
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: ProductDetails }) {
  const productUrl = absoluteUrl(`/produto/${product.slug}`);

  return (
    <article>
      <JsonLd
        data={[
          productJsonLd(product, productUrl),
          breadcrumbJsonLd([
            { name: "Início", url: absoluteUrl("/") },
            { name: product.category.name, url: absoluteUrl(`/categoria/${product.category.slug}`) },
            { name: product.name, url: productUrl },
          ]),
        ]}
      />

      <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/categoria/${product.category.slug}`} className="hover:text-brand">
          {product.category.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{product.name}</span>
      </nav>

      {/* O HTML do servidor (ISR) já traz a seleção padrão; no navegador a versão que lê ?cor=&tamanho= assume. */}
      <Suspense fallback={<ProductPurchase product={product} />}>
        <ProductPurchaseFromUrl product={product} />
      </Suspense>
    </article>
  );
}

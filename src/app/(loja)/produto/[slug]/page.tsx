import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug, type ProductDetails } from "@/features/catalog/api";
import { Breadcrumb } from "@/features/catalog/components/Breadcrumb";
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
    <article className="vitrine flex-1">
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

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <Breadcrumb
          items={[
            { name: "Início", href: "/" },
            { name: product.category.name, href: `/categoria/${product.category.slug}` },
            { name: product.name },
          ]}
        />

        <div className="mt-6">
          {/* O HTML do servidor (ISR) já traz a seleção padrão; no navegador a versão que lê ?cor=&tamanho= assume. */}
          <Suspense fallback={<ProductPurchase product={product} />}>
            <ProductPurchaseFromUrl product={product} />
          </Suspense>
        </div>
      </div>
    </article>
  );
}

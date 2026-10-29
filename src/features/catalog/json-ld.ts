import type { ProductDetails } from "./api";
import { imagesForColor, selectionSearch, variantLabel } from "./variant-selection";

/** Dados estruturados schema.org (specs/24-seo.md, SEO-05). */
type JsonLd = Record<string, unknown>;

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

export function productJsonLd(product: ProductDetails, productUrl: string): JsonLd {
  const base = {
    "@context": "https://schema.org",
    name: product.name,
    description: product.seo.description || product.description,
    url: productUrl,
  };

  const variants = product.variants.map((variant) => {
    const images = imagesForColor(product, variant.colorId).map((image) => image.url);
    const label = variantLabel(product, variant);
    const color = product.colors.find((item) => item.id === variant.colorId)?.name;
    const size = product.sizes.find((item) => item.id === variant.sizeId)?.name;
    const url = productUrl + selectionSearch(product, { colorId: variant.colorId, sizeId: variant.sizeId });

    return {
      "@type": "Product",
      sku: variant.sku,
      ...(variant.gtin ? { gtin: variant.gtin } : {}),
      name: label ? `${product.name} ${label}` : product.name,
      ...(color ? { color } : {}),
      ...(size ? { size } : {}),
      ...(images.length > 0 ? { image: images } : {}),
      offers: {
        "@type": "Offer",
        url,
        price: variant.price.toFixed(2),
        priceCurrency: "BRL",
        availability: variant.available ? IN_STOCK : OUT_OF_STOCK,
        itemCondition: "https://schema.org/NewCondition",
      },
    };
  });

  const single = variants.length === 1 && product.colors.length === 0 && product.sizes.length === 0 ? variants[0] : undefined;
  if (single) {
    const { "@type": type, ...rest } = single;
    return { ...base, "@type": type, ...rest, url: productUrl };
  }

  const variesBy = [
    ...(product.colors.length > 0 ? ["https://schema.org/color"] : []),
    ...(product.sizes.length > 0 ? ["https://schema.org/size"] : []),
  ];

  return {
    ...base,
    "@type": "ProductGroup",
    productGroupID: product.id,
    variesBy,
    hasVariant: variants,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationJsonLd(siteUrl: string, name: string): JsonLd {
  return { "@context": "https://schema.org", "@type": "Organization", name, url: siteUrl };
}

/** `SearchAction` aponta para a busca (SSR, noindex). */
export function websiteJsonLd(siteUrl: string, name: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/busca?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

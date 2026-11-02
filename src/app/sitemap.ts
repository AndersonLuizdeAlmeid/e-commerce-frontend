import type { MetadataRoute } from "next";
import { getSitemap } from "@/features/catalog/api";
import { absoluteUrl } from "@/shared/lib/site";

// SEO-06: categorias, coleções (RF-024 CA3) e produtos visíveis, lastmod = updated_at da API.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, collections, products } = await getSitemap();

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/categoria/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...collections.map((collection) => ({
      url: absoluteUrl(`/colecao/${collection.slug}`),
      lastModified: collection.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/produto/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

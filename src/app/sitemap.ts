import type { MetadataRoute } from "next";
import { getSitemap } from "@/features/catalog/api";
import { absoluteUrl } from "@/shared/lib/site";

// SEO-06: categorias e produtos visíveis, lastmod = updated_at da API.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, products } = await getSitemap();

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/categoria/${category.slug}`),
      lastModified: category.updatedAt,
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

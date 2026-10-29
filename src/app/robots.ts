import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/lib/site";

// SEO-06: áreas logadas e busca fora do rastreamento.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/conta", "/checkout", "/admin", "/busca", "/carrinho"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

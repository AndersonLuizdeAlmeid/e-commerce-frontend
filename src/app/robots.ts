import type { MetadataRoute } from "next";
import { isStaging, robotsRules } from "@/shared/lib/environment";
import { absoluteUrl } from "@/shared/lib/site";

// SEO-06: áreas logadas e busca fora do rastreamento; no staging, nada (entrega 6 §3, P13).
export default function robots(): MetadataRoute.Robots {
  const staging = isStaging();
  return {
    rules: robotsRules(staging),
    ...(staging ? {} : { sitemap: absoluteUrl("/sitemap.xml") }),
  };
}

import type { MetadataRoute } from "next";

// Ambiente da imagem (entrega 6 §3, P13). `NEXT_PUBLIC_ENV=staging` é a loja de homologação: fechada pelo Cloudflare
// Access e nunca indexada. Fixado no build, como os outros NEXT_PUBLIC_*.

export function isStaging(value: string | undefined = process.env.NEXT_PUBLIC_ENV): boolean {
  return value?.trim().toLowerCase() === "staging";
}

/** Áreas logadas e busca fora do rastreamento (SEO-06); no staging, nada é rastreado. */
export function robotsRules(staging: boolean): MetadataRoute.Robots["rules"] {
  return staging
    ? [{ userAgent: "*", disallow: "/" }]
    : [{ userAgent: "*", allow: "/", disallow: ["/conta", "/checkout", "/admin", "/busca", "/carrinho"] }];
}

/** No staging, todas as respostas (páginas, imagens, feed) dizem aos buscadores para não indexar. */
export function stagingHeaders(staging: boolean): { source: string; headers: { key: string; value: string }[] }[] {
  return staging ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }] : [];
}

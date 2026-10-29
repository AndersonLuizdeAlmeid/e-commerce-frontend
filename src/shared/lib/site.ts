export const SITE_NAME = "Loja";

/** URL pública da loja, sem barra no final (canonical, Open Graph, sitemap, JSON-LD). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

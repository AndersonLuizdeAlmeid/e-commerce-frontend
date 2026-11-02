export const SITE_NAME = "MO Acessórios";
export const SITE_SLOGAN = "Estilo que completa você";

/** Canais que a loja já usa (PRODUCT.md). O número pode ser trocado por ambiente sem novo build da página. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5551997553649";
export const INSTAGRAM_URL = "https://www.instagram.com/momodaeacessorios/";

/** Garantia confirmada pela loja em 29/10/2026 (specs/26 §8.1, D-F07). */
export const WARRANTY_TEXT = "Garantia de até 6 meses no banho, com o uso correto.";

/** URL pública da loja, sem barra no final (canonical, Open Graph, sitemap, JSON-LD). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Conversa no WhatsApp com a mensagem já escrita (specs/26 §2.4). Nunca leva dados pessoais. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

import { serverFetch } from "@/shared/api/client";

/**
 * Feed do Google Merchant Center no domínio da loja (SEO-14, entrega 6 fatia 6.6). O XML é montado pela API; aqui
 * ele só é repassado, guardado por 1 h e apagado pela mesma revalidação do catálogo (tags de produtos e categorias).
 * Dinâmico de propósito: o build da imagem roda contra a API falsa, e o feed não pode nascer com dados dela.
 */
export const dynamic = "force-dynamic";

const ONE_HOUR = 3600;

export async function GET(): Promise<Response> {
  const response = await serverFetch("/api/v1/feeds/google-merchant.xml", {
    revalidate: ONE_HOUR,
    tags: ["products", "categories", "collections"],
  });

  if (!response.ok) {
    // O Merchant Center tenta de novo depois; melhor 503 do que um feed vazio que tiraria as peças do Google.
    return new Response("Feed indisponível no momento.", { status: 503, headers: { "Retry-After": "600" } });
  }

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${ONE_HOUR}`,
    },
  });
}

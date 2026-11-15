import type { ProductDetails } from "@/features/catalog/api";
import { apiRequest } from "@/shared/api/browser-client";

const pedidos = new Map<string, Promise<ProductDetails>>();

/** Grade e fotos da peça, buscadas uma vez por visita: a peça que vira na grade só pesa quando alguém a toca. */
export function buscarDetalhes(slug: string): Promise<ProductDetails> {
  let pedido = pedidos.get(slug);
  if (!pedido) {
    pedido = apiRequest<ProductDetails>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`);
    pedido.catch(() => pedidos.delete(slug));
    pedidos.set(slug, pedido);
  }
  return pedido;
}

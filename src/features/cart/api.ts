import { apiRequest } from "@/shared/api/browser-client";
import type { CartLine } from "./local-cart";

// Sacola (arquivo 07 §6). Tipos escritos à mão até o próximo `npm run gen:api` com a API rodando.

export type CartItemStatus = "Available" | "InsufficientStock" | "OutOfStock" | "Unavailable";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  colorName: string | null;
  sizeName: string | null;
  variantLabels: { color: string; size: string };
  imageUrl: string | null;
  imageAlt: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  status: CartItemStatus;
  availableQuantity: number | null;
}

export interface CartView {
  items: CartItem[];
  subtotal: number;
}

export const cartApi = {
  get: () => apiRequest<CartView>("/api/v1/cart", { auth: true }),
  add: (variantId: string, quantity: number) => apiRequest<CartView>("/api/v1/cart/items", { method: "POST", body: { variantId, quantity }, auth: true }),
  setQuantity: (variantId: string, quantity: number) => apiRequest<CartView>(`/api/v1/cart/items/${variantId}`, { method: "PUT", body: { quantity }, auth: true }),
  remove: (variantId: string) => apiRequest<CartView>(`/api/v1/cart/items/${variantId}`, { method: "DELETE", auth: true }),
  merge: (items: CartLine[]) =>
    apiRequest<{ cart: CartView; skippedVariantIds: string[] }>("/api/v1/cart/merge", { method: "POST", body: { items }, auth: true }),
  /** A sacola do visitante vive no navegador; preço, foto e disponibilidade vêm sempre da API (arquivo 16 §6). */
  lookup: (items: CartLine[]) => apiRequest<CartView>("/api/v1/catalog/variants/lookup", { method: "POST", body: { items } }),
};

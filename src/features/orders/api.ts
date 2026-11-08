import { apiRequest } from "@/shared/api/browser-client";
import type { components } from "@/shared/api/schema";

// Pedidos do cliente (arquivo 07 §7): checkout, meus pedidos, detalhe e cancelamento.

type Schemas = components["schemas"];

export type PlacedOrder = Schemas["PlacedOrderResponse"];
export type OrderSummary = Schemas["OrderSummaryResponse"];
export type Order = Schemas["OrderResponse"];
export type OrdersPage = Schemas["PagedResponseOfOrderSummaryResponse"];
export type Payment = Schemas["PaymentResponse"];

/** Cartão: o token e o meio vêm do Brick do Mercado Pago; o número do cartão nunca passa pela loja (arquivo 21 §2). */
export interface PayRequest {
  method: "Pix" | "CreditCard";
  cardToken?: string;
  paymentMethodId?: string;
  issuerId?: string | null;
  installments?: number;
  /** Documento do titular, que o Brick pede (entrega 4 §3, P10). */
  payerDocument?: { type: string; number: string } | null;
}

export type PaymentOptions = Schemas["PaymentOptionsResponse"];

export interface PlaceOrderRequest {
  addressId: string;
  shippingServiceCode: string;
  notes?: string | null;
  /** Ausente: não é presente. */
  gift?: { wrap: boolean; message: string | null } | null;
}

/** Peça que acabou enquanto a cliente comprava (409 `Ordering.OutOfStock`). */
export interface OutOfStockItem {
  variantId: string;
  productName: string;
  requested: number;
  available: number;
}

export const ordersApi = {
  /** A mesma chave numa segunda tentativa devolve o pedido já criado, sem duplicar (RF-040 CA7). */
  place: (request: PlaceOrderRequest, idempotencyKey: string) =>
    apiRequest<PlacedOrder>("/api/v1/orders", { method: "POST", body: request, auth: true, headers: { "Idempotency-Key": idempotencyKey } }),
  list: (page = 1) => apiRequest<OrdersPage>(`/api/v1/orders?page=${page}`, { auth: true }),
  get: (id: string) => apiRequest<Order>(`/api/v1/orders/${id}`, { auth: true }),
  cancel: (id: string) => apiRequest(`/api/v1/orders/${id}/cancel`, { method: "POST", auth: true }),
  pay: (id: string, request: PayRequest, idempotencyKey: string) =>
    apiRequest<Payment>(`/api/v1/orders/${id}/payments`, { method: "POST", body: request, auth: true, headers: { "Idempotency-Key": idempotencyKey } }),
  currentPayment: (id: string) => apiRequest<Payment>(`/api/v1/orders/${id}/payments/current`, { auth: true }),
  /** Só em desenvolvimento, com a plataforma falsa (entrega 4 §3, P3). */
  simulateApproval: (id: string) => apiRequest(`/api/v1/orders/${id}/payments/simulate-approval`, { method: "POST", auth: true }),
  paymentOptions: () => apiRequest<PaymentOptions>("/api/v1/payments/options", { auth: true }),
  settings: () => apiRequest<Schemas["OrderingSettingsResponse"]>("/api/v1/orders/settings", { auth: true }),
};

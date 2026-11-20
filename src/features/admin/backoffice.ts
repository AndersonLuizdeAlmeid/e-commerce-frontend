import { apiRequest } from "@/shared/api/browser-client";
import type { Paged } from "./api";

// Fase 5 (entrega specs/entregas/fase-5-backoffice.md): pedidos, estornos pendentes, usuários e dashboard.
// Tipos escritos à mão, como o resto do painel, até o próximo `npm run gen:api`.

export type OrderStatus = "PendingPayment" | "PaymentConfirmed" | "Preparing" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
export type AdminOrderAction =
  | "ConfirmPayment"
  | "StartPreparation"
  | "Ship"
  | "UpdateTracking"
  | "Deliver"
  | "Cancel"
  | "CorrectGiftMessage"
  | "Return";
export type PaymentMethod = "Pix" | "CreditCard" | "Manual";

export interface AdminOrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  total: number;
  itemCount: number;
  firstProductName: string;
  firstImageUrl: string | null;
  isGift: boolean;
  paymentMethod: PaymentMethod | null;
  shippingServiceName: string;
  trackingCode: string | null;
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

export interface AdminOrderList {
  orders: Paged<AdminOrderSummary>;
  statusCounts: OrderStatusCount[];
}

export interface AdminOrderItem {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  colorName: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderHistory {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedAt: string;
  /** Nulo: o sistema (pagamento confirmado pela plataforma, prazo de 48 h). */
  changedBy: string | null;
  note: string | null;
}

export interface AdminOrderPayment {
  id: string;
  method: PaymentMethod;
  status: string;
  statusDetail: string | null;
  amount: number;
  installments: number | null;
  providerPaymentId: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface AdminOrder {
  id: string;
  number: string;
  status: OrderStatus;
  cancellationReason: string | null;
  placedAt: string;
  paymentDueAt: string;
  /** `removed`: a cliente excluiu a conta (entrega 6 §3, P7); nome e e-mail já vêm substituídos. */
  customer: { id: string; name: string; email: string; phone: string | null; orderCount: number; removed: boolean };
  items: AdminOrderItem[];
  subtotal: number;
  shippingFee: number;
  giftWrapPrice: number;
  total: number;
  shipping: {
    serviceCode: string;
    name: string;
    price: number;
    deliveryDays: number | null;
    isFallback: boolean;
    trackingCode: string | null;
    trackingUrl: string | null;
  };
  address: {
    recipient: string;
    postalCode: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
  };
  gift: { isGift: boolean; wrap: boolean; message: string | null; wrapPrice: number };
  notes: string | null;
  history: AdminOrderHistory[];
  payments: AdminOrderPayment[];
  allowedActions: AdminOrderAction[];
}

export interface OrderFilters {
  page: number;
  status: OrderStatus | null;
  search: string;
  from: string | null;
  to: string | null;
  paymentMethod: PaymentMethod | null;
  gift: boolean;
}

export type PendingRefundKind = "RefundFailed" | "RefundNotDone" | "ManualPayment";
export type PendingRefundAction = "Retry" | "Sync" | "MarkRefunded";

export interface PendingRefund {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  method: PaymentMethod;
  providerPaymentId: string | null;
  amount: number;
  status: string;
  statusDetail: string | null;
  kind: PendingRefundKind;
  /** Quando o pedido foi cancelado ou devolvido. */
  cancelledAt: string;
  actions: PendingRefundAction[];
  orderStatus: OrderStatus;
}

export type UserRole = "Customer" | "Admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  emailConfirmed: boolean;
  isLockedOut: boolean;
  createdAt: string;
  orderCount: number;
  lastOrderAt: string | null;
  isSelf: boolean;
  /** Conta excluída pela cliente: sem ações. */
  removed: boolean;
}

export interface UserFilters {
  page: number;
  role: UserRole | null;
  isActive: boolean | null;
  search: string;
}

export interface Dashboard {
  from: string;
  to: string;
  ordersPlaced: number;
  ordersByStatus: OrderStatusCount[];
  revenue: number;
  paidOrders: number;
  averageTicket: number;
  refundedAmount: number;
  refundedPayments: number;
  toDo: { awaitingPayment: number; toPrepare: number; preparing: number; inTransit: number; pendingRefunds: number };
  lowStockCount: number;
  lowStock: {
    variantId: string;
    productId: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    sku: string;
    quantityOnHand: number;
    lowStockThreshold: number;
  }[];
}

const ROOT = "/api/v1/admin";
const get = <T>(path: string) => apiRequest<T>(`${ROOT}${path}`, { auth: true });
const send = <T = void>(method: "POST" | "PUT" | "PATCH", path: string, body?: unknown) =>
  apiRequest<T>(`${ROOT}${path}`, { method, body, auth: true });

export function orderQuery(filters: OrderFilters): string {
  const query = new URLSearchParams({ page: String(filters.page) });
  if (filters.status) query.set("status", filters.status);
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.paymentMethod) query.set("paymentMethod", filters.paymentMethod);
  if (filters.gift) query.set("gift", "true");
  return query.toString();
}

export const backofficeApi = {
  orders: (filters: OrderFilters) => get<AdminOrderList>(`/orders?${orderQuery(filters)}`),
  order: (id: string) => get<AdminOrder>(`/orders/${id}`),
  startPreparation: (id: string) => send<AdminOrder>("POST", `/orders/${id}/start-preparation`),
  ship: (id: string, trackingCode: string) => send<AdminOrder>("POST", `/orders/${id}/ship`, { trackingCode }),
  updateTracking: (id: string, trackingCode: string) => send<AdminOrder>("PUT", `/orders/${id}/tracking`, { trackingCode }),
  deliver: (id: string) => send<AdminOrder>("POST", `/orders/${id}/deliver`),
  cancel: (id: string, reason: string) => send<AdminOrder>("POST", `/orders/${id}/cancel`, { reason }),
  confirmPayment: (id: string, reason: string) => send<AdminOrder>("POST", `/orders/${id}/confirm-payment`, { reason }),
  correctGiftMessage: (id: string, message: string) => send<AdminOrder>("PUT", `/orders/${id}/gift-message`, { message }),
  returnOrder: (id: string, note: string) => send<AdminOrder>("POST", `/orders/${id}/return`, { note }),
  orderingSettings: () => get<{ giftWrapPrice: number }>("/ordering/settings"),
  saveOrderingSettings: (giftWrapPrice: number) => send("PUT", "/ordering/settings", { giftWrapPrice }),

  pendingRefunds: () => get<PendingRefund[]>("/payments/refunds/pending"),
  retryRefund: (paymentId: string) => send("POST", `/payments/${paymentId}/refund`),
  syncPayment: (paymentId: string) => send("POST", `/payments/${paymentId}/sync`),
  markRefunded: (paymentId: string, note: string) => send("POST", `/payments/${paymentId}/mark-refunded`, { note }),

  users: ({ page, role, isActive, search }: UserFilters) => {
    const query = new URLSearchParams({ page: String(page) });
    if (role) query.set("role", role);
    if (isActive !== null) query.set("isActive", String(isActive));
    if (search.trim()) query.set("search", search.trim());
    return get<Paged<AdminUser>>(`/users?${query}`);
  },
  setUserActive: (id: string, isActive: boolean) => send<AdminUser>("PATCH", `/users/${id}/status`, { isActive }),
  setUserRole: (id: string, role: UserRole) => send<AdminUser>("PATCH", `/users/${id}/role`, { role }),

  dashboard: (from: string, to: string) => get<Dashboard>(`/dashboard?from=${from}&to=${to}`),
};

export const backofficeKeys = {
  orders: ["admin", "orders"] as const,
  order: (id: string) => ["admin", "order", id] as const,
  refunds: ["admin", "refunds"] as const,
  users: ["admin", "users"] as const,
  dashboard: ["admin", "dashboard"] as const,
  orderingSettings: ["admin", "ordering", "settings"] as const,
};

// ---------- Regras puras (testadas em backoffice.test.ts) ----------

/** As abas da lista, na ordem do trabalho da loja. */
export const STATUS_TABS: readonly OrderStatus[] = ["PaymentConfirmed", "Preparing", "Shipped", "PendingPayment", "Delivered", "Cancelled", "Returned"];

/** Nome curto da aba: a lista não repete "pagamento" em todo lugar. */
export const STATUS_TAB_LABELS: Record<OrderStatus, string> = {
  PendingPayment: "Aguardando pagamento",
  PaymentConfirmed: "Para separar",
  Preparing: "Em separação",
  Shipped: "Enviados",
  Delivered: "Entregues",
  Cancelled: "Cancelados",
  Returned: "Devolvidos",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Pix: "PIX",
  CreditCard: "Cartão",
  Manual: "Confirmado à mão",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Pending: "Pendente",
  Approved: "Aprovado",
  Rejected: "Recusado",
  Expired: "Vencido",
  Cancelled: "Cancelado",
  Refunded: "Estornado",
  RefundFailed: "Estorno recusado",
};

/** A ação que a tela destaca para a situação; as outras ficam como secundárias. */
const FORWARD: readonly AdminOrderAction[] = ["StartPreparation", "Ship", "Deliver"];

export function primaryAction(order: Pick<AdminOrder, "allowedActions">): AdminOrderAction | null {
  return FORWARD.find((action) => order.allowedActions.includes(action)) ?? null;
}

/** Mesma regra da API (entrega 5 §3, P3): 8 a 40 letras e números, sem espaços. Devolve o código pronto ou o erro. */
export function normalizeTrackingCode(value: string): { code: string } | { error: string } {
  const code = value.trim().toUpperCase();
  if (code.length === 0) {
    return { error: "Cole o código de rastreio." };
  }
  if (!/^[A-Z0-9]{8,40}$/.test(code)) {
    return { error: "O código de rastreio tem de 8 a 40 letras e números, sem espaços." };
  }
  return { code };
}

const SAO_PAULO = "America/Sao_Paulo";

/** "2026-11-15" no horário de Brasília. */
export function isoDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SAO_PAULO, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export type PeriodPreset = "today" | "7d" | "30d" | "month";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  month: "Este mês",
};

/** Período do atalho, com os dois extremos incluídos e o dia de hoje em Brasília. */
export function periodRange(preset: PeriodPreset, now: Date = new Date()): { from: string; to: string } {
  const to = isoDay(now);
  const [year, month, day] = to.split("-").map(Number) as [number, number, number];
  const back = (days: number) => isoDay(new Date(Date.UTC(year, month - 1, day - days, 12)));
  switch (preset) {
    case "today":
      return { from: to, to };
    case "7d":
      return { from: back(6), to };
    case "30d":
      return { from: back(29), to };
    case "month":
      return { from: `${to.slice(0, 8)}01`, to };
  }
}

export function variantLabel(item: { colorName: string | null; sizeName: string | null }): string {
  return [item.colorName, item.sizeName].filter(Boolean).join(" · ") || "Variação única";
}

/** Endereço numa linha, como se copia para a etiqueta. */
export function addressLines(address: AdminOrder["address"]): string[] {
  const cep = address.postalCode.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  return [
    address.recipient,
    `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ""}`,
    `${address.district} — ${address.city}/${address.state}`,
    `CEP ${cep}`,
  ];
}

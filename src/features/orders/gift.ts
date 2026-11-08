/** Mesmos limites da API para a dedicatória (RF-047 CA1, arquivo 26 D-F09): 200 caracteres e 6 linhas. */
export const GIFT_MESSAGE_MAX_LENGTH = 200;
export const GIFT_MESSAGE_MAX_LINES = 6;

export function giftMessageProblem(message: string): string | null {
  const text = message.replace(/\r\n?/g, "\n").trim();
  if (text.length > GIFT_MESSAGE_MAX_LENGTH) {
    return `A dedicatória tem até ${GIFT_MESSAGE_MAX_LENGTH} caracteres.`;
  }
  if (text.split("\n").length > GIFT_MESSAGE_MAX_LINES) {
    return `A dedicatória tem até ${GIFT_MESSAGE_MAX_LINES} linhas.`;
  }
  return null;
}

/** "Aguardando pagamento — 31 h restantes" (arquivo 26 §4.7). */
export function paymentCountdown(dueAt: string, now: Date = new Date()): string {
  const remainingMs = new Date(dueAt).getTime() - now.getTime();
  if (remainingMs <= 0) {
    return "prazo encerrado";
  }
  const hours = Math.floor(remainingMs / 3_600_000);
  if (hours >= 1) {
    return hours === 1 ? "1 h restante" : `${hours} h restantes`;
  }
  const minutes = Math.max(1, Math.floor(remainingMs / 60_000));
  return minutes === 1 ? "1 min restante" : `${minutes} min restantes`;
}

const STATUS_LABELS: Record<string, string> = {
  PendingPayment: "Aguardando pagamento",
  PaymentConfirmed: "Pagamento confirmado",
  Preparing: "Em separação",
  Shipped: "Enviado",
  Delivered: "Entregue",
  Cancelled: "Cancelado",
};

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const CANCELLATION_LABELS: Record<string, string> = {
  CustomerRequest: "Cancelado por você",
  AdminRequest: "Cancelado pela loja",
  PaymentTimeout: "Cancelado: o pagamento não chegou em 48 horas",
  PaymentRejected: "Cancelado: pagamento recusado",
};

export function cancellationLabel(reason: string | null | undefined): string | null {
  return reason ? (CANCELLATION_LABELS[reason] ?? "Cancelado") : null;
}

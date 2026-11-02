import { apiRequest } from "@/shared/api/browser-client";

// Frete (arquivo 07 §5). Tipos escritos à mão até o próximo `npm run gen:api` com a API rodando.

export interface ShippingOption {
  serviceCode: string;
  name: string;
  price: number;
  originalPrice: number;
  /** Nulo nos valores de contingência: sem o provedor, não há prazo a informar. */
  deliveryDays: number | null;
}

export interface ShippingQuotes {
  options: ShippingOption[];
  isFallback: boolean;
}

export interface ShippingItem {
  variantId: string;
  quantity: number;
}

export const shippingApi = {
  quote: (postalCode: string, items: ShippingItem[]) =>
    apiRequest<ShippingQuotes>("/api/v1/shipping/quotes", { method: "POST", body: { postalCode, items } }),
};

const POSTAL_CODE_KEY = "mo-cep";

/** O CEP é lembrado só neste navegador, para não pedir de novo a cada peça. */
export function rememberedPostalCode(): string {
  try {
    return window.localStorage.getItem(POSTAL_CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberPostalCode(postalCode: string) {
  try {
    window.localStorage.setItem(POSTAL_CODE_KEY, postalCode);
  } catch {
    // Sem armazenamento, o CEP só não fica lembrado.
  }
}

/** "01310100" → "01310-100", à medida que se digita. */
export function maskPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function isCompletePostalCode(value: string): boolean {
  return value.replace(/\D/g, "").length === 8;
}

export function deliveryLabel(days: number | null): string {
  if (days === null) {
    return "Prazo a confirmar";
  }
  return days === 1 ? "1 dia útil" : `${days} dias úteis`;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 59.9 → "R$ 59,90" */
export function formatPrice(value: number): string {
  return brl.format(value);
}

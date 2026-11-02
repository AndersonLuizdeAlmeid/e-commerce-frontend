/**
 * Rótulos da grade por categoria (specs/26 ADR-F06/F07): "Acabamento"/"Aro" em anéis, "Cor"/"Tamanho" em bolsas.
 * A API passa a mandar `variantLabels` já resolvidos na Fase 2B.2 (RF-050); até lá vale o padrão.
 */
export interface VariantLabels {
  color: string;
  size: string;
}

export const DEFAULT_VARIANT_LABELS: VariantLabels = { color: "Cor", size: "Tamanho" };

interface WithVariantLabels {
  variantLabels?: Partial<VariantLabels> | null;
}

/** Aceita categoria ou produto; o tipo gerado do OpenAPI só ganha `variantLabels` quando a API passar a mandar. */
export function resolveVariantLabels(source?: object | null): VariantLabels {
  const labels = (source as WithVariantLabels | null | undefined)?.variantLabels;
  return {
    color: labels?.color?.trim() || DEFAULT_VARIANT_LABELS.color,
    size: labels?.size?.trim() || DEFAULT_VARIANT_LABELS.size,
  };
}

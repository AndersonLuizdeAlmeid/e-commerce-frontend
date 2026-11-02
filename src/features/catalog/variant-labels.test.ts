import { describe, expect, it } from "vitest";
import { DEFAULT_VARIANT_LABELS, resolveVariantLabels } from "./variant-labels";

describe("resolveVariantLabels", () => {
  it("usa Cor/Tamanho quando a API ainda não manda rótulos", () => {
    expect(resolveVariantLabels(undefined)).toEqual(DEFAULT_VARIANT_LABELS);
    expect(resolveVariantLabels({})).toEqual(DEFAULT_VARIANT_LABELS);
    expect(resolveVariantLabels({ variantLabels: null })).toEqual(DEFAULT_VARIANT_LABELS);
  });

  it("usa os rótulos da categoria", () => {
    expect(resolveVariantLabels({ variantLabels: { color: "Acabamento", size: "Aro" } })).toEqual({
      color: "Acabamento",
      size: "Aro",
    });
  });

  it("completa só o rótulo que faltar e ignora texto em branco", () => {
    expect(resolveVariantLabels({ variantLabels: { color: "Acabamento", size: "  " } })).toEqual({
      color: "Acabamento",
      size: "Tamanho",
    });
  });
});

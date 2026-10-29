import { describe, expect, it } from "vitest";
import { shirtFixture, singleVariantFixture } from "./test-data";
import { findVariant, imagesForColor, initialSelection, selectionSearch, sizeState, variantLabel } from "./variant-selection";

describe("grade de variações (RF-021)", () => {
  const product = shirtFixture();

  it("classifica cada tamanho da cor: disponível, esgotado ou inexistente (CA2)", () => {
    expect(sizeState(product, "azul", "m")).toBe("available");
    expect(sizeState(product, "preto", "p")).toBe("sold-out");
    expect(sizeState(product, "preto", "m")).toBe("nonexistent");
  });

  it("começa pela primeira cor com estoque e sem tamanho quando há mais de um", () => {
    expect(initialSelection(product)).toEqual({ colorId: "azul", sizeId: null });
  });

  it("respeita cor e tamanho pedidos na URL quando a combinação existe", () => {
    expect(initialSelection(product, "preto", "P")).toEqual({ colorId: "preto", sizeId: "p" });
  });

  it("descarta o tamanho da URL quando não existe na cor", () => {
    expect(initialSelection(product, "preto", "M")).toEqual({ colorId: "preto", sizeId: null });
  });

  it("ignora cor desconhecida na URL", () => {
    expect(initialSelection(product, "roxo", null).colorId).toBe("azul");
  });

  it("seleciona a variação única de produto sem cor nem tamanho (RN-022)", () => {
    const single = singleVariantFixture();
    const selection = initialSelection(single);
    expect(selection).toEqual({ colorId: null, sizeId: null });
    expect(findVariant(single, selection)?.sku).toBe("MEI-KIT");
  });

  it("mostra as fotos da cor e as sem cor", () => {
    expect(imagesForColor(product, "preto").map((image) => image.alt)).toEqual(["Camiseta preta", "Etiqueta"]);
  });

  it("gera a query da variação e o rótulo legível", () => {
    expect(selectionSearch(product, { colorId: "azul", sizeId: "m" })).toBe("?cor=azul&tamanho=M");
    expect(selectionSearch(product, { colorId: null, sizeId: null })).toBe("");
    expect(variantLabel(product, product.variants[1]!)).toBe("Azul / M");
  });
});

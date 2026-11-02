import type { ProductDetails } from "./api";

/** Camiseta 2 cores × 2 tamanhos: Azul P/M, Preto P esgotado, Preto M inexistente. */
export function shirtFixture(): ProductDetails {
  return {
    id: "p1",
    slug: "camiseta-basica",
    name: "Camiseta Básica",
    description: "Camiseta de algodão.",
    category: { slug: "camisetas", name: "Camisetas" },
    priceFrom: 59.9,
    seo: { title: "Camiseta Básica", description: "Camiseta de algodão." },
    colors: [
      { id: "azul", name: "Azul", slug: "azul", hex: "#1B3A6B" },
      { id: "preto", name: "Preto", slug: "preto", hex: "#151515" },
    ],
    sizes: [
      { id: "p", name: "P" },
      { id: "m", name: "M" },
    ],
    variants: [
      { id: "v1", sku: "CAM-AZUL-P", colorId: "azul", sizeId: "p", price: 59.9, gtin: null, available: true },
      { id: "v2", sku: "CAM-AZUL-M", colorId: "azul", sizeId: "m", price: 64.9, gtin: "7891234567895", available: true },
      { id: "v3", sku: "CAM-PRETO-P", colorId: "preto", sizeId: "p", price: 59.9, gtin: null, available: false },
    ],
    images: [
      { url: "https://img.teste/azul.png", alt: "Camiseta azul", colorId: "azul" },
      { url: "https://img.teste/preto.png", alt: "Camiseta preta", colorId: "preto" },
      { url: "https://img.teste/etiqueta.png", alt: "Etiqueta", colorId: null },
    ],
    variantLabels: { color: "Cor", size: "Tamanho" },
    updatedAt: "2026-10-01T12:00:00Z",
  };
}

/** Produto sem cor nem tamanho: uma variação "única" (RN-022). */
export function singleVariantFixture(): ProductDetails {
  return {
    ...shirtFixture(),
    id: "p2",
    slug: "kit-meias",
    name: "Kit Meias",
    colors: [],
    sizes: [],
    variants: [{ id: "v9", sku: "MEI-KIT", colorId: null, sizeId: null, price: 39.9, gtin: null, available: true }],
    images: [{ url: "https://img.teste/meias.png", alt: "Kit meias", colorId: null }],
  };
}

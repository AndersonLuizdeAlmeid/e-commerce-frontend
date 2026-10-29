import type { ProductDetails, ProductImage, ProductVariant } from "./api";

/**
 * Regras da grade cor × tamanho na página do produto (RF-021). Funções puras: a API manda só as variações
 * ativas, então combinação ausente = inexistente (CA2) e `available: false` = esgotada.
 */
export interface Selection {
  colorId: string | null;
  sizeId: string | null;
}

export type CellState = "available" | "sold-out" | "nonexistent";

export function findVariant(product: ProductDetails, selection: Selection): ProductVariant | undefined {
  return product.variants.find((variant) => variant.colorId === selection.colorId && variant.sizeId === selection.sizeId);
}

export function sizeState(product: ProductDetails, colorId: string | null, sizeId: string): CellState {
  const variant = findVariant(product, { colorId, sizeId });
  if (!variant) {
    return "nonexistent";
  }
  return variant.available ? "available" : "sold-out";
}

export function colorHasStock(product: ProductDetails, colorId: string): boolean {
  return product.variants.some((variant) => variant.colorId === colorId && variant.available);
}

/**
 * Seleção inicial: a cor/tamanho pedidos na URL quando existem; senão a primeira cor com estoque e, se o produto
 * só tem um tamanho (ou nenhum), ele já vem marcado.
 */
export function initialSelection(product: ProductDetails, colorSlug?: string | null, sizeName?: string | null): Selection {
  const firstColor = product.colors[0];
  const requestedColor = product.colors.find((color) => color.slug === colorSlug);
  const colorWithStock = product.colors.find((color) => colorHasStock(product, color.id));
  const colorId = (requestedColor ?? colorWithStock ?? firstColor)?.id ?? null;

  const onlySize = product.sizes.length === 1 ? product.sizes[0] : undefined;
  const requestedSize = product.sizes.find((size) => size.name === sizeName);
  const size = requestedSize ?? onlySize;
  const sizeId = size && findVariant(product, { colorId, sizeId: size.id }) ? size.id : null;

  return { colorId, sizeId };
}

/** Galeria da cor escolhida + fotos sem cor; sem nenhuma delas, mostra todas. */
export function imagesForColor(product: ProductDetails, colorId: string | null): ProductImage[] {
  const images = product.images.filter((image) => image.colorId === colorId || image.colorId === null);
  return images.length > 0 ? images : product.images;
}

/** `?cor=azul-marinho&tamanho=M` — os parâmetros que a página lê de volta (e que o JSON-LD usa por variação). */
export function selectionSearch(product: ProductDetails, selection: Selection): string {
  const search = new URLSearchParams();
  const color = product.colors.find((item) => item.id === selection.colorId);
  const size = product.sizes.find((item) => item.id === selection.sizeId);
  if (color) {
    search.set("cor", color.slug);
  }
  if (size) {
    search.set("tamanho", size.name);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** "Azul Marinho / M" — vazio para a variação única. */
export function variantLabel(product: ProductDetails, variant: ProductVariant): string {
  const color = product.colors.find((item) => item.id === variant.colorId)?.name;
  const size = product.sizes.find((item) => item.id === variant.sizeId)?.name;
  return [color, size].filter(Boolean).join(" / ");
}

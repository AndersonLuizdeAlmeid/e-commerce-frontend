"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/shared/lib/format";
import type { ProductDetails } from "../api";
import {
  colorHasStock,
  findVariant,
  imagesForColor,
  initialSelection,
  selectionSearch,
  sizeState,
  type Selection,
} from "../variant-selection";

interface ProductPurchaseProps {
  product: ProductDetails;
  initialColorSlug?: string | null;
  initialSizeName?: string | null;
}

/**
 * Galeria por cor + seletor de cor (bolinha com o nome) + grade de tamanhos (RF-021, arquivo 16 §4 e §8).
 * A escolha vai para a URL (`?cor=&tamanho=`) sem navegar, para o link compartilhado abrir a mesma variação.
 */
export function ProductPurchase({ product, initialColorSlug, initialSizeName }: ProductPurchaseProps) {
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product, initialColorSlug, initialSizeName),
  );
  const [imageIndex, setImageIndex] = useState(0);

  const images = imagesForColor(product, selection.colorId);
  const mainImage = images[Math.min(imageIndex, images.length - 1)];
  const needsSize = product.sizes.length > 0 && selection.sizeId === null;
  const variant = needsSize ? undefined : findVariant(product, selection);
  const selectedColor = product.colors.find((color) => color.id === selection.colorId);

  function update(next: Selection) {
    setSelection(next);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${selectionSearch(product, next)}`);
  }

  function selectColor(colorId: string) {
    const keepSize = selection.sizeId !== null && findVariant(product, { colorId, sizeId: selection.sizeId });
    setImageIndex(0);
    update({ colorId, sizeId: keepSize ? selection.sizeId : null });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-line">
          {mainImage && (
            <Image
              key={mainImage.url}
              src={mainImage.url}
              alt={mainImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>

        {images.length > 1 && (
          <ul className="mt-3 flex gap-2" aria-label="Fotos do produto">
            {images.map((image, index) => (
              <li key={image.url}>
                <button
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Ver foto: ${image.alt}`}
                  aria-current={index === imageIndex ? "true" : undefined}
                  className={`relative block size-16 overflow-hidden rounded-md border-2 ${
                    index === imageIndex ? "border-brand" : "border-transparent"
                  } focus-visible:outline-2 focus-visible:outline-brand`}
                >
                  <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-3 text-2xl font-semibold">
          {variant ? (
            formatPrice(variant.price)
          ) : (
            <>
              <span className="text-base font-normal text-muted">a partir de </span>
              {formatPrice(product.priceFrom)}
            </>
          )}
        </p>

        {product.colors.length > 0 && (
          <fieldset className="mt-8">
            <legend className="text-sm font-medium">
              Cor: <span className="font-normal text-muted">{selectedColor?.name ?? "escolha uma cor"}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((color) => {
                const soldOut = !colorHasStock(product, color.id);
                return (
                  <label
                    key={color.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3 text-sm has-[:checked]:border-brand has-[:checked]:ring-1 has-[:checked]:ring-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
                  >
                    <input
                      type="radio"
                      name="cor"
                      value={color.slug}
                      checked={selection.colorId === color.id}
                      onChange={() => selectColor(color.id)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className="size-6 rounded-full border border-ink/15" style={{ backgroundColor: color.hex }} />
                    {color.name}
                    {soldOut && <span className="text-muted">(esgotada)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {product.sizes.length > 0 && (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium">Tamanho</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const state = sizeState(product, selection.colorId, size.id);
                return (
                  <label
                    key={size.id}
                    className={`relative flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm ${
                      state === "nonexistent"
                        ? "cursor-not-allowed border-line bg-surface text-muted/50"
                        : "cursor-pointer border-line bg-white has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
                    } ${state === "sold-out" ? "text-muted line-through" : ""} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand`}
                  >
                    <input
                      type="radio"
                      name="tamanho"
                      value={size.name}
                      checked={selection.sizeId === size.id}
                      disabled={state === "nonexistent"}
                      onChange={() => update({ colorId: selection.colorId, sizeId: size.id })}
                      className="sr-only"
                    />
                    {size.name}
                    {state === "sold-out" && <span className="sr-only"> (esgotado)</span>}
                    {state === "nonexistent" && <span className="sr-only"> (indisponível nesta cor)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <p className="mt-6 text-sm" aria-live="polite">
          {needsSize ? (
            <span className="text-muted">Escolha um tamanho.</span>
          ) : variant?.available ? (
            <span className="font-medium text-emerald-700">Em estoque</span>
          ) : (
            <span className="font-medium text-red-700">Esgotado nesta combinação</span>
          )}
        </p>

        <button
          type="button"
          disabled
          className="mt-4 w-full rounded-md bg-brand px-5 py-3 font-medium text-white opacity-60 sm:w-auto"
        >
          Adicionar ao carrinho
        </button>
        <p className="mt-2 text-xs text-muted">A compra online chega na próxima etapa da loja.</p>

        {product.description && (
          <div className="mt-10 border-t border-line pt-6">
            <h2 className="text-sm font-medium">Descrição</h2>
            <p className="mt-2 max-w-prose whitespace-pre-line text-muted">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Lê `?cor=&tamanho=` no navegador; a página envolve em Suspense e usa o ProductPurchase puro como fallback (ISR). */
export function ProductPurchaseFromUrl({ product }: { product: ProductDetails }) {
  const params = useSearchParams();
  return <ProductPurchase product={product} initialColorSlug={params.get("cor")} initialSizeName={params.get("tamanho")} />;
}

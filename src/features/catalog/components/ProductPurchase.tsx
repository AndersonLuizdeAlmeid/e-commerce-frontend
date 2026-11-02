"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { cartErrorMessage, useCart } from "@/features/cart/CartProvider";
import { ShippingSimulator } from "@/features/shipping/components/ShippingSimulator";
import { formatPrice } from "@/shared/lib/format";
import { WARRANTY_TEXT, absoluteUrl, whatsappUrl } from "@/shared/lib/site";
import { ChatIcon, FlipIcon } from "@/shared/ui/icons";
import type { ProductDetails } from "../api";
import { resolveVariantLabels } from "../variant-labels";
import {
  colorHasStock,
  findVariant,
  imagesForColor,
  initialSelection,
  selectionSearch,
  sizeState,
  type Selection,
} from "../variant-selection";
import { Brilho } from "./Brilho";
import { sombraCartela } from "./Cartela";

interface ProductPurchaseProps {
  product: ProductDetails;
  initialColorSlug?: string | null;
  initialSizeName?: string | null;
}

const addButton =
  "min-h-12 bg-tinta px-6 pt-0.5 text-sm font-medium uppercase tracking-[0.18em] text-cartela transition-colors hover:bg-grafite disabled:opacity-60 disabled:hover:bg-tinta";

/** Opção marcada na vitrine: cartela clara com o aro de folha (specs/26 §2.2, regra 2). */
const marcada =
  "has-[:checked]:bg-cartela has-[:checked]:text-tinta has-[:checked]:shadow-[0_0_0_2px_var(--color-vitrine),0_0_0_4px_var(--color-folha-vitrine)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-vitrine-tinta";

/**
 * A cartela da peça na vitrine, com o brilho de folha (inclinação menor que a das cartelas da grade), a galeria
 * do acabamento escolhido na frente e os detalhes no verso; ao lado, acabamento e tamanho com os rótulos da categoria (RF-021, specs/26 §4.3).
 * A escolha vai para a URL (`?cor=&tamanho=`) sem navegar, para o link compartilhado abrir a mesma variação.
 */
export function ProductPurchase({ product, initialColorSlug, initialSizeName }: ProductPurchaseProps) {
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(product, initialColorSlug, initialSizeName),
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const backButton = useRef<HTMLButtonElement>(null);
  const frontButton = useRef<HTMLButtonElement>(null);
  const sizeSelector = useRef<HTMLFieldSetElement>(null);
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const labels = resolveVariantLabels(product);
  const images = imagesForColor(product, selection.colorId);
  const mainImage = images[Math.min(imageIndex, images.length - 1)];
  const needsSize = product.sizes.length > 0 && selection.sizeId === null;
  const variant = needsSize ? undefined : findVariant(product, selection);
  const selectedColor = product.colors.find((color) => color.id === selection.colorId);
  const price = variant ? formatPrice(variant.price) : null;

  const canAdd = !adding && (needsSize || variant?.available === true);
  const addLabel = needsSize ? `Escolha o ${labels.size.toLowerCase()}` : variant?.available ? "Adicionar à sacola" : "Esgotado";

  async function addToBag() {
    setAdded(false);
    setAddError(null);
    if (needsSize) {
      // Sem erro vermelho: a escolha que falta é só levar o foco até ela (specs/26 §4.3).
      sizeSelector.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    if (!variant) {
      return;
    }
    setAdding(true);
    try {
      await add(variant.id);
      setAdded(true);
    } catch (error) {
      setAddError(cartErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  function update(next: Selection) {
    setAdded(false);
    setAddError(null);
    setSelection(next);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${selectionSearch(product, next)}`);
  }

  function selectColor(colorId: string) {
    const keepSize = selection.sizeId !== null && findVariant(product, { colorId, sizeId: selection.sizeId });
    setImageIndex(0);
    update({ colorId, sizeId: keepSize ? selection.sizeId : null });
  }

  function flip(toBack: boolean) {
    setFlipped(toBack);
    // O foco acompanha a face visível, para teclado e leitor de tela não ficarem no lado escondido.
    requestAnimationFrame(() => (toBack ? backButton : frontButton).current?.focus());
  }

  const whatsappMessage = `Olá! Tenho uma dúvida sobre ${product.name}${selectedColor ? ` (${selectedColor.name})` : ""}: ${absoluteUrl(`/produto/${product.slug}`)}`;

  return (
    <div className="grid gap-10 pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 lg:pb-0">
      <Brilho intensidade={0.35} className="group self-start rounded-[3px]">
        <div className="virar" data-virada={flipped}>
          <div className="virar-miolo">
            <div
              className={`virar-frente cartela relative rounded-[3px] px-4 pb-5 pt-4 sm:px-6 sm:pt-6 ${sombraCartela}`}
              inert={flipped}
              aria-hidden={flipped}
            >
              <div className="relative aspect-square overflow-hidden bg-linha/50 lg:aspect-[4/5]">
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
                <ul className="mt-3 flex gap-2 overflow-x-auto p-1" aria-label="Fotos da peça">
                  {images.map((image, index) => (
                    <li key={image.url} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setImageIndex(index)}
                        aria-label={`Ver foto: ${image.alt}`}
                        aria-current={index === imageIndex ? "true" : undefined}
                        className={`relative block size-14 overflow-hidden ${
                          index === imageIndex ? "shadow-[0_0_0_2px_var(--color-cartela),0_0_0_4px_var(--color-folha)]" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                ref={frontButton}
                type="button"
                onClick={() => flip(true)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] underline-offset-4 hover:underline"
              >
                <FlipIcon />
                Virar: detalhes e cuidados
              </button>
            </div>

            <div
              className={`virar-verso cartela rounded-[3px] px-5 py-6 sm:px-8 ${sombraCartela}`}
              inert={!flipped}
              aria-hidden={!flipped}
            >
              <h2 className="font-display text-3xl leading-tight">Detalhes</h2>
              {product.description ? (
                <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">{product.description}</p>
              ) : (
                <p className="mt-4 text-tinta-suave">A loja ainda não escreveu os detalhes desta peça.</p>
              )}
              <h3 className="mt-8 text-xs font-medium uppercase tracking-[0.16em]">Garantia</h3>
              <p className="mt-2 max-w-prose leading-relaxed">{WARRANTY_TEXT}</p>
              <button
                ref={backButton}
                type="button"
                onClick={() => flip(false)}
                className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] underline-offset-4 hover:underline"
              >
                <FlipIcon />
                Voltar para a foto
              </button>
            </div>
          </div>
        </div>
      </Brilho>

      <div className="lg:pt-6">
        {/* Nome e preço fora da cartela: a foto pode crescer sem empurrar os dois para baixo da dobra. */}
        <h1 className="font-display text-4xl leading-[1.04] tracking-[-0.02em] text-balance sm:text-5xl">{product.name}</h1>
        {/* O preço é parte da peça: em Prata, um degrau abaixo do nome (contrato de direção, OWN-WORLD). */}
        <p className="numeros mt-3">
          {price ? (
            <span className="font-display text-3xl">{price}</span>
          ) : (
            <>
              <span className="text-vitrine-texto">a partir de </span>
              <span className="font-display text-3xl">{formatPrice(product.priceFrom)}</span>
            </>
          )}
        </p>

        {product.colors.length > 0 && (
          <fieldset className="mt-8">
            <legend className="text-xs font-medium uppercase tracking-[0.16em]">
              {labels.color}: <span className="font-display text-base normal-case tracking-normal">{selectedColor?.name ?? "escolha"}</span>
            </legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.colors.map((color) => {
                const soldOut = !colorHasStock(product, color.id);
                return (
                  <label
                    key={color.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-vitrine-tinta/30 py-1.5 pl-1.5 pr-4 text-sm transition-colors hover:border-vitrine-tinta ${marcada}`}
                  >
                    <input
                      type="radio"
                      name="cor"
                      value={color.slug}
                      checked={selection.colorId === color.id}
                      onChange={() => selectColor(color.id)}
                      className="sr-only"
                    />
                    {soldOut ? (
                      <span aria-hidden="true" className="size-7 rounded-full border border-dashed border-current opacity-70" />
                    ) : (
                      <span aria-hidden="true" className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]" style={{ backgroundColor: color.hex }} />
                    )}
                    {color.name}
                    {soldOut && <span className="opacity-80">esgotado</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {product.sizes.length > 0 && (
          <fieldset ref={sizeSelector} className="mt-8">
            <legend className="text-xs font-medium uppercase tracking-[0.16em]">{labels.size}</legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const state = sizeState(product, selection.colorId, size.id);
                return (
                  <label
                    key={size.id}
                    className={`numeros relative flex h-11 min-w-11 items-center justify-center rounded-full border px-2 text-sm transition-colors ${
                      state === "nonexistent"
                        ? "cursor-not-allowed border-vitrine-tinta/15 opacity-40"
                        : `cursor-pointer border-vitrine-tinta/30 hover:border-vitrine-tinta ${marcada}`
                    } ${state === "sold-out" ? "border-dashed line-through" : ""}`}
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
                    {state === "nonexistent" && <span className="sr-only"> (indisponível neste {labels.color.toLowerCase()})</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <p className="mt-8 text-sm" aria-live="polite">
          {needsSize ? (
            <span className="text-vitrine-texto">Escolha o {labels.size.toLowerCase()}.</span>
          ) : variant?.available ? (
            <span className="font-medium">Disponível</span>
          ) : (
            <span className="font-medium">Esgotado nesta combinação</span>
          )}
        </p>

        <button type="button" onClick={() => void addToBag()} disabled={!canAdd} aria-busy={adding} className={`mt-4 w-full sm:w-auto ${addButton}`}>
          {addLabel}
        </button>
        <div aria-live="polite" className="mt-2 text-sm empty:hidden">
          {added && (
            <p>
              Peça na sacola. <Link href="/carrinho" className="inline-flex min-h-11 items-center font-medium underline">Ver sacola</Link>
            </p>
          )}
          {addError && <p role="alert" className="font-medium">{addError}</p>}
        </div>

        <div className="mt-10 max-w-md">
          <ShippingSimulator
            id="produto"
            items={variant ? [{ variantId: variant.id, quantity: 1 }] : null}
            pendingHint={needsSize ? `Escolha o ${labels.size.toLowerCase()} para calcular.` : undefined}
          />
        </div>

        <div className="mt-10">
          <WhatsappLink message={whatsappMessage} />
        </div>
      </div>

      {/* Barra do polegar no celular: preço e a compra sempre à mão (specs/26 §4.3). */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-vitrine-tinta/15 bg-vitrine-funda px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="numeros shrink-0 text-lg">{price ?? formatPrice(product.priceFrom)}</p>
          <button type="button" onClick={() => void addToBag()} disabled={!canAdd} aria-busy={adding} className={`min-w-0 ${addButton}`}>
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsappLink({ message }: { message: string }) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-vitrine-tinta/40 px-4 text-sm font-medium transition-colors hover:border-vitrine-tinta"
    >
      <ChatIcon />
      Tirar dúvida no WhatsApp
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  );
}

/** Lê `?cor=&tamanho=` no navegador; a página envolve em Suspense e usa o ProductPurchase puro como fallback (ISR). */
export function ProductPurchaseFromUrl({ product }: { product: ProductDetails }) {
  const params = useSearchParams();
  return <ProductPurchase product={product} initialColorSlug={params.get("cor")} initialSizeName={params.get("tamanho")} />;
}

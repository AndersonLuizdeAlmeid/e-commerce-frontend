"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cartErrorMessage, useCart } from "@/features/cart/CartProvider";
import type { CardTheme, ProductDetails, ProductSummary } from "@/features/catalog/api";
import { resolveVariantLabels } from "@/features/catalog/variant-labels";
import { colorHasStock, findVariant, initialSelection, sizeState, type Selection } from "@/features/catalog/variant-selection";
import { formatPrice } from "@/shared/lib/format";
import { BagIcon, CheckIcon, CloseIcon } from "@/shared/ui/icons";
import { buscarDetalhes } from "./detalhes";
import { aroDoNome, medidas, tipoDeMedida, useMedidas } from "./medidas";
import { useMedidor } from "./MedidorDeAro";

const MAX_SWATCHES = 4;

interface PecaProps {
  product: ProductSummary;
  priority?: boolean;
  /** Tema da coleção: moldura grafite com fio prata na linha "Eles". */
  tema?: CardTheme;
  /** Abaixo de um título de seção, o nome da peça desce um nível. */
  tituloComo?: "h2" | "h3";
  /** Slug do acabamento que já abre escolhido (peça em destaque do painel, RF-025). */
  cor?: string;
  sizes?: string;
}

/** Seleção inicial da peça virada: a da loja e, nos anéis, o aro que a cliente mediu na tela quando existe nele. */
function selecaoInicial(product: ProductDetails, cor: string | undefined, aro: number | null): Selection {
  const selecao = initialSelection(product, cor);
  if (selecao.sizeId || aro === null || tipoDeMedida(resolveVariantLabels(product).size) !== "aro") {
    return selecao;
  }
  const noAro = product.sizes.find((size) => aroDoNome(size.name) === aro);
  return noAro && findVariant(product, { colorId: selecao.colorId, sizeId: noAro.id })?.available ? { ...selecao, sizeId: noAro.id } : selecao;
}

/**
 * A peça da loja: a foto na moldura de passe-partout pérola, com nome e preço embaixo. "Comprar" vira a moldura ali
 * mesmo e mostra acabamento, tamanho e sacola; peça sem escolha a fazer vai direto para a sacola.
 */
export function Peca({ product, priority = false, tema = "Ivory", tituloComo: Titulo = "h2", cor, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" }: PecaProps) {
  const router = useRouter();
  const { add } = useCart();
  const { aro } = useMedidas();
  const medidor = useMedidor();
  const [virada, setVirada] = useState(false);
  const [detalhes, setDetalhes] = useState<ProductDetails | null>(null);
  const [escolha, setEscolha] = useState<Selection | null>(null);
  const [estado, setEstado] = useState<"parado" | "abrindo" | "levando" | "levada">("parado");
  const [aviso, setAviso] = useState<string | null>(null);
  const botaoComprar = useRef<HTMLButtonElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);

  const href = `/produto/${product.slug}${cor ? `?cor=${encodeURIComponent(cor)}` : ""}`;
  const extras = product.colors.length - MAX_SWATCHES;

  async function comprar() {
    setEstado("abrindo");
    setAviso(null);
    let produto: ProductDetails;
    try {
      produto = await buscarDetalhes(product.slug);
    } catch {
      router.push(href);
      return;
    }
    setDetalhes(produto);
    const inicial = selecaoInicial(produto, cor, medidas.getSnapshot().aro);
    const variante = findVariant(produto, inicial);
    const semEscolha = produto.colors.length <= 1 && produto.sizes.length <= 1;
    if (semEscolha && variante?.available) {
      await levar(variante.id);
      return;
    }
    setEscolha(inicial);
    setEstado("parado");
    setVirada(true);
    window.setTimeout(() => botaoFechar.current?.focus({ preventScroll: true }), 80);
  }

  async function levar(variantId: string) {
    setEstado("levando");
    try {
      await add(variantId);
      setEstado("levada");
    } catch (error) {
      setEstado("parado");
      setAviso(cartErrorMessage(error));
      setVirada(true);
    }
  }

  function desvirar() {
    setVirada(false);
    window.setTimeout(() => botaoComprar.current?.focus({ preventScroll: true }), 80);
  }

  const selecao = escolha ?? (detalhes ? selecaoInicial(detalhes, cor, aro) : { colorId: null, sizeId: null });
  const labels = detalhes ? resolveVariantLabels(detalhes) : null;
  const variante = detalhes ? findVariant(detalhes, selecao) : undefined;
  const corEscolhida = detalhes?.colors.find((color) => color.id === selecao.colorId) ?? null;
  const faltaTamanho = Boolean(detalhes && detalhes.sizes.length > 0 && !selecao.sizeId);
  const medeAro = labels ? tipoDeMedida(labels.size) === "aro" : false;

  return (
    <article className="peca" data-tema={tema === "Graphite" ? "grafite" : undefined} data-virada={virada}>
      <div className="peca-palco @container">
        <div className="peca-miolo">
          <div className="peca-face peca-frente" inert={virada}>
            {/* O nome embaixo é o link que o teclado e o leitor de tela usam; a foto é o mesmo destino para o toque. */}
            <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block bg-rose/40">
              {product.image && <Image src={product.image.url} alt="" fill priority={priority} sizes={sizes} className="peca-foto object-cover" />}
            </Link>
            <button
              ref={botaoComprar}
              type="button"
              onClick={() => void comprar()}
              disabled={estado === "abrindo" || estado === "levando"}
              aria-busy={estado === "abrindo" || estado === "levando"}
              aria-expanded={virada}
              className="botao botao-tinta absolute bottom-3 right-3 z-[2] min-h-11 gap-2 px-3 py-0 text-[0.8125rem] @[13rem]:px-4"
            >
              {estado === "levada" ? <CheckIcon width={18} height={18} /> : <BagIcon width={18} height={18} />}
              <span className="sr-only @[13rem]:not-sr-only">
                {estado === "levada" ? "Na sacola" : "Comprar"}
                <span className="sr-only"> {product.name}</span>
              </span>
            </button>
          </div>

          <div className="peca-face peca-verso px-3 pb-3 pt-2 @[13rem]:px-4 @[13rem]:pb-4" inert={!virada}>
            <div className="flex items-center justify-between gap-2">
              <p className="line-clamp-1 font-display text-[0.9375rem] leading-tight">{product.name}</p>
              <button ref={botaoFechar} type="button" onClick={desvirar} aria-label={`Voltar para a foto de ${product.name}`} className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ouro-tinta transition-colors hover:text-ouro-fundo">
                <CloseIcon width={18} height={18} />
              </button>
            </div>

            {detalhes && labels && (
              <>
                {estado === "levada" ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    <span className="grid size-11 place-items-center rounded-full bg-tinta text-ouro-claro">
                      <CheckIcon />
                    </span>
                    <p role="status" className="font-display text-lg leading-tight">
                      Na sacola
                    </p>
                    <Link href="/carrinho" className="link-ouro inline-flex min-h-11 items-center text-sm">
                      Ver a sacola
                    </Link>
                  </div>
                ) : (
                  <>
                    {detalhes.colors.length > 0 && (
                      <fieldset className="mt-1">
                        <legend className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-tinta-suave">
                          {labels.color}: <span className="normal-case tracking-normal text-tinta">{corEscolhida?.name ?? "escolha"}</span>
                        </legend>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {detalhes.colors.map((color) => {
                            const marcada = color.id === selecao.colorId;
                            const esgotada = !colorHasStock(detalhes, color.id);
                            return (
                              <button
                                key={color.id}
                                type="button"
                                aria-pressed={marcada}
                                aria-label={`${color.name}${esgotada ? " (esgotado)" : ""}`}
                                title={color.name}
                                onClick={() => {
                                  setAviso(null);
                                  setEscolha({ colorId: color.id, sizeId: findVariant(detalhes, { colorId: color.id, sizeId: selecao.sizeId }) ? selecao.sizeId : null });
                                }}
                                className={`grid size-9 place-items-center rounded-full transition-shadow ${marcada ? "shadow-[0_0_0_1.5px_var(--color-ouro-tinta)]" : "hover:shadow-[0_0_0_1px_var(--fio-ouro)]"}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)] ${esgotada ? "opacity-40" : ""}`}
                                  style={{ backgroundColor: color.hex }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}

                    {detalhes.sizes.length > 0 && (
                      <fieldset className="mt-2">
                        <legend className="flex w-full items-baseline justify-between gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-tinta-suave">
                          {labels.size}
                          {medeAro && (
                            <button type="button" onClick={medidor.abrir} className="link-ouro normal-case tracking-normal">
                              {aro ? `Seu aro: ${aro}` : "Medir meu aro"}
                            </button>
                          )}
                        </legend>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {detalhes.sizes.map((size) => {
                            const situacao = sizeState(detalhes, selecao.colorId, size.id);
                            const marcada = size.id === selecao.sizeId;
                            if (situacao === "nonexistent") return null;
                            return (
                              <button
                                key={size.id}
                                type="button"
                                aria-pressed={marcada}
                                disabled={situacao === "sold-out"}
                                onClick={() => {
                                  setAviso(null);
                                  setEscolha({ ...selecao, sizeId: size.id });
                                }}
                                className={`numeros h-9 min-w-9 rounded-full border px-2 text-[0.8125rem] transition-colors ${
                                  marcada ? "border-tinta bg-tinta text-cartela" : "border-[var(--fio-ouro)] hover:border-ouro-tinta"
                                } ${situacao === "sold-out" ? "border-dashed text-tinta-suave line-through" : ""}`}
                              >
                                {size.name}
                                {situacao === "sold-out" && <span className="sr-only"> (esgotado)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}

                    <div className="mt-auto pt-2">
                      {aviso && (
                        <p role="alert" className="mb-1.5 text-xs text-alerta">
                          {aviso}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => variante && void levar(variante.id)}
                        disabled={!variante?.available || estado === "levando"}
                        aria-busy={estado === "levando"}
                        className="botao botao-tinta botao-pequeno w-full px-3"
                      >
                        {faltaTamanho ? (
                          `Escolha o ${labels.size.toLowerCase()}`
                        ) : variante && !variante.available ? (
                          "Esgotado"
                        ) : (
                          <>
                            <span>{estado === "levando" ? "Levando" : "Adicionar"}</span>
                            {variante && <span className="numeros opacity-80">{formatPrice(variante.price)}</span>}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 px-1.5">
        <Titulo className="font-display text-[1.0625rem] leading-snug text-balance">
          <Link href={href} className="transition-colors hover:text-ouro-tinta">
            {product.name}
          </Link>
        </Titulo>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="numeros text-sm">
            <span className="text-vitrine-texto">a partir de </span>
            <span className="font-medium">{formatPrice(product.priceFrom)}</span>
          </p>
          {product.colors.length > 1 && (
            <ul className="flex shrink-0 items-center gap-1" aria-label={`Acabamentos: ${product.colors.map((color) => color.name).join(", ")}`}>
              {product.colors.slice(0, MAX_SWATCHES).map((color) => (
                <li key={color.id} title={color.name} className="size-3 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]" style={{ backgroundColor: color.hex }} />
              ))}
              {extras > 0 && <li className="numeros text-xs text-vitrine-texto">+{extras}</li>}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

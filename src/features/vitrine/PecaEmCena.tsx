"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AddFeaturedButton } from "@/features/cart/components/AddFeaturedButton";
import type { ProductSummary } from "@/features/catalog/api";
import { formatPrice } from "@/shared/lib/format";
import { ArrowIcon, PauseIcon, PlayIcon } from "@/shared/ui/icons";
import { useIntervalo, useMovimentoReduzido } from "./movimento";

const EM_CENA_MS = 7000;
const EM_CENA_LENTO_MS = 11000;

interface PecaEmCenaProps {
  pecas: ProductSummary[];
  /** Acabamento com que a peça em destaque do painel abre (RF-025); vale para a primeira. */
  corDaPrimeira?: string;
  /** O título da página (o slogan), que fica fixo enquanto as peças se revezam. */
  children: ReactNode;
}

/**
 * Abertura da loja: uma peça em cena, sob a luz, se dissolvendo no cetim, com nome, preço e sacola. As peças se
 * revezam em fusão lenta; o revezamento para com o ponteiro, o foco ou o botão de pausa.
 */
export function PecaEmCena({ pecas, corDaPrimeira, children }: PecaEmCenaProps) {
  const [ativa, setAtiva] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [emFoco, setEmFoco] = useState(false);
  const reduzido = useMovimentoReduzido();
  const total = pecas.length;
  const peca = pecas[ativa] ?? pecas[0];

  useIntervalo(() => setAtiva((atual) => (atual + 1) % total), reduzido ? EM_CENA_LENTO_MS : EM_CENA_MS, !pausado && !emFoco && total > 1);

  if (!peca) {
    return null;
  }

  const cor = ativa === 0 ? corDaPrimeira : undefined;
  const href = `/produto/${peca.slug}${cor ? `?cor=${encodeURIComponent(cor)}` : ""}`;

  return (
    <section
      aria-labelledby="slogan"
      className="cena vitrine"
      onMouseEnter={() => setEmFoco(true)}
      onMouseLeave={() => setEmFoco(false)}
      onFocus={() => setEmFoco(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setEmFoco(false);
      }}
    >
      <div aria-hidden="true" className="cena-midia">
        {pecas.map((item, index) =>
          item.image ? (
            <div key={item.id} className="cena-foto" data-ativa={index === ativa}>
              <Image src={item.image.url} alt="" fill priority={index === 0} sizes="(min-width: 1024px) 68vw, 100vw" className="object-cover" />
            </div>
          ) : null,
        )}
      </div>
      <div aria-hidden="true" className="cena-luz" />

      <div className="mx-auto flex min-h-[min(92svh,46rem)] max-w-6xl flex-col justify-end px-4 pb-10 pt-[min(44svh,23rem)] lg:min-h-[clamp(32rem,76svh,44rem)] lg:pb-16 lg:pt-16">
        <div className="lg:max-w-[31rem]">
          {children}

          <div key={peca.id} className="cena-legenda mt-6 border-t border-[var(--fio-ouro)] pt-5 lg:mt-8">
            <p aria-live={pausado ? "polite" : "off"} className="font-display text-2xl leading-tight text-balance sm:text-[1.75rem]">
              <Link href={href} className="transition-colors hover:text-ouro-tinta">
                {peca.name}
              </Link>
            </p>
            <p className="numeros mt-1.5">
              <span className="text-vitrine-texto">a partir de </span>
              <span className="font-display text-2xl">{formatPrice(peca.priceFrom)}</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <AddFeaturedButton slug={peca.slug} colorSlug={cor} />
              <Link href={href} className="botao botao-fio">
                Ver a peça
                <ArrowIcon width={18} height={18} />
                <span className="sr-only">: {peca.name}</span>
              </Link>
            </div>
          </div>

          {total > 1 && (
            <div className="mt-7 flex items-center gap-3">
              <button type="button" onClick={() => setPausado((atual) => !atual)} aria-pressed={pausado} aria-label={`${pausado ? "Continuar" : "Pausar"} o revezamento das peças em cena`} className="controle">
                {pausado ? <PlayIcon width={18} height={18} /> : <PauseIcon width={18} height={18} />}
              </button>
              <ol className="flex items-center">
                {pecas.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setAtiva(index)}
                      aria-current={index === ativa ? "true" : undefined}
                      aria-label={`Peça em cena ${index + 1} de ${total}: ${item.name}`}
                      className="group grid h-11 w-9 place-items-center"
                    >
                      <span
                        className={`block h-0.5 rounded-full transition-all duration-700 ease-solta ${
                          index === ativa ? "w-7 bg-ouro-tinta" : "w-3.5 bg-ouro-tinta/35 group-hover:bg-ouro-tinta/70"
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

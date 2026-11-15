"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CardTheme, ProductSummary } from "@/features/catalog/api";
import { ArrowIcon } from "@/shared/ui/icons";
import { Peca } from "./Peca";

/** O trilho de peças que desliza de lado, com as setas e o encaixe por peça. Sangra até a borda da tela. */
function Trilho({ products, tema, rotulo, cabecalho, cor }: { products: ProductSummary[]; tema?: CardTheme; rotulo: string; cabecalho: ReactNode; cor?: string }) {
  const lista = useRef<HTMLUListElement>(null);
  const [borda, setBorda] = useState<{ inicio: boolean; fim: boolean }>({ inicio: true, fim: false });

  function medir() {
    const element = lista.current;
    if (!element) return;
    const inicio = element.scrollLeft < 8;
    const fim = element.scrollLeft + element.clientWidth > element.scrollWidth - 8;
    setBorda((atual) => (atual.inicio === inicio && atual.fim === fim ? atual : { inicio, fim }));
  }

  // As setas acompanham o tamanho da tela: prateleira que cabe inteira fica sem seta ativa.
  useEffect(() => {
    const element = lista.current;
    if (!element) return;
    const observador = new ResizeObserver(medir);
    observador.observe(element);
    return () => observador.disconnect();
  }, []);

  function deslizar(direcao: 1 | -1) {
    const element = lista.current;
    if (!element) return;
    element.scrollBy({ left: direcao * Math.max(260, element.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4">
        {cabecalho}
        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" onClick={() => deslizar(-1)} disabled={borda.inicio} aria-label={`Peças anteriores: ${rotulo}`} className="controle">
            <ArrowIcon width={18} height={18} className="rotate-180" />
          </button>
          <button type="button" onClick={() => deslizar(1)} disabled={borda.fim} aria-label={`Próximas peças: ${rotulo}`} className="controle">
            <ArrowIcon width={18} height={18} />
          </button>
        </div>
      </div>
      <ul ref={lista} onScroll={medir} aria-label={rotulo} className="trilho trilho-sangra mt-5 gap-5 pb-12 pt-3 sm:gap-8">
        {products.map((product, index) => (
          <li key={product.id} className="w-[62vw] max-w-[16.5rem] sm:w-[15.5rem] lg:w-[16.5rem]">
            <Peca product={product} tema={tema} tituloComo="h3" cor={index === 0 ? cor : undefined} sizes="(min-width: 640px) 264px, 62vw" />
          </li>
        ))}
      </ul>
    </>
  );
}

interface PrateleiraProps {
  id: string;
  titulo: string;
  descricao?: string | null;
  href?: string;
  verTudo?: string;
  products: ProductSummary[];
  tema?: CardTheme;
}

/** Uma prateleira da loja: título, "ver tudo" e o trilho de peças. */
export function Prateleira({ id, titulo, descricao, href, verTudo = "Ver tudo", products, tema }: PrateleiraProps) {
  if (products.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={id}>
      <Trilho
        products={products}
        tema={tema}
        rotulo={titulo}
        cabecalho={
          <div className="max-w-xl">
            <h2 id={id} className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
              {titulo}
            </h2>
            {descricao && <p className="mt-2 text-vitrine-texto sm:text-lg">{descricao}</p>}
            {href && (
              <Link href={href} className="link-ouro mt-1 inline-flex min-h-11 items-center gap-2 text-sm">
                {verTudo}
                <ArrowIcon width={16} height={16} />
              </Link>
            )}
          </div>
        }
      />
    </section>
  );
}

export interface LinhaDaVitrine {
  slug: string;
  name: string;
  products: ProductSummary[];
}

/** "A vitrine": as linhas da loja em abas, cada uma com a sua prateleira (a vitrine por coleção da prévia). */
export function VitrinePorLinha({ linhas }: { linhas: LinhaDaVitrine[] }) {
  const [aba, setAba] = useState(linhas[0]?.slug ?? "");
  const atual = linhas.find((linha) => linha.slug === aba) ?? linhas[0];

  if (!atual) {
    return null;
  }

  return (
    <section aria-labelledby="vitrine-titulo" className="vitrine-nude border-y border-linha pb-6 pt-16 sm:pt-24">
      <Trilho
        key={atual.slug}
        products={atual.products}
        rotulo={atual.name}
        cabecalho={
          <div className="min-w-0">
            <h2 id="vitrine-titulo" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              A vitrine
            </h2>
            <div role="tablist" aria-label="Linhas da loja" className="-mx-4 mt-3 flex gap-x-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {linhas.map((linha) => {
                const marcada = linha.slug === atual.slug;
                return (
                  <button
                    key={linha.slug}
                    type="button"
                    role="tab"
                    aria-selected={marcada}
                    onClick={() => setAba(linha.slug)}
                    className={`inline-flex min-h-11 shrink-0 items-center border-b font-display text-xl transition-colors ${
                      marcada ? "border-ouro-tinta text-ouro-tinta" : "border-transparent text-vitrine-texto hover:text-tinta"
                    }`}
                  >
                    {linha.name}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />
      <div className="mx-auto -mt-4 max-w-6xl px-4 pb-10">
        <Link href={`/categoria/${atual.slug}`} className="botao botao-fio">
          Ver tudo em {atual.name.toLowerCase()}
          <ArrowIcon width={18} height={18} />
        </Link>
      </div>
    </section>
  );
}

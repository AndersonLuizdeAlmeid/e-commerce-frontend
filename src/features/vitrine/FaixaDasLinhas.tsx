"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PauseIcon, PlayIcon, StarMark } from "@/shared/ui/icons";
import { useMovimentoReduzido } from "./movimento";

export interface Linha {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
}

/**
 * "O que a MO oferece": a faixa que passa devagar com as linhas da loja (pedida na rodada 2 da prévia), levando às
 * categorias e coleções reais. A segunda volta só fecha o laço: fica fora do teclado e do leitor de tela.
 */
export function FaixaDasLinhas({ linhas }: { linhas: Linha[] }) {
  const [pausado, setPausado] = useState(false);
  const reduzido = useMovimentoReduzido();

  if (linhas.length === 0) {
    return null;
  }

  const volta = (copia: boolean) => (
    <ul aria-hidden={copia || undefined} className="flex shrink-0 items-center">
      {linhas.map((linha) => (
        <li key={linha.id} className="flex items-center">
          <Link
            href={linha.href}
            tabIndex={copia ? -1 : undefined}
            className="group inline-flex items-center gap-[0.3em] whitespace-nowrap py-[0.08em] font-display text-[clamp(2.25rem,6vw,4.75rem)] leading-[1.1] tracking-[-0.02em] transition-colors duration-300 hover:text-ouro-tinta"
          >
            <span className="faixa-chip relative h-[0.9em] w-[1.4em] shrink-0 overflow-hidden rounded-full bg-rose">
              {linha.imageUrl && (
                <Image src={linha.imageUrl} alt="" fill sizes="120px" className="object-cover transition-transform duration-1000 ease-solta group-hover:scale-110" />
              )}
            </span>
            {linha.name}
          </Link>
          <StarMark aria-hidden="true" className="mx-[0.62em] size-[0.26em] shrink-0 text-[clamp(2.25rem,6vw,4.75rem)] text-ouro" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="As linhas da MO" className="vitrine relative border-y border-linha py-5 sm:py-8">
      <div className="faixa" data-pausado={pausado || undefined} style={{ ["--faixa-duracao" as string]: `${(reduzido ? 11 : 6) * linhas.length}s` }}>
        <div className="faixa-trilho flex w-max">
          {volta(false)}
          {volta(true)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPausado((atual) => !atual)}
        aria-pressed={pausado}
        aria-label={`${pausado ? "Continuar" : "Pausar"} a faixa das linhas`}
        className="controle absolute bottom-2 right-3 size-10 sm:right-5"
      >
        {pausado ? <PlayIcon width={16} height={16} /> : <PauseIcon width={16} height={16} />}
      </button>
    </section>
  );
}

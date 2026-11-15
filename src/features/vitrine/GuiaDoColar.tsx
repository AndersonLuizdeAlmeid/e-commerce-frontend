"use client";

import { useState } from "react";

interface GuiaProps {
  /** Comprimentos em centímetros, do menor para o maior. */
  comprimentos: number[];
  /** Controlado pela página do produto; sem ele, o guia guarda a própria escolha. */
  selecionado?: number | null;
  onSelecionar?: (cm: number) => void;
  className?: string;
}

/** Onde o colar cai, para um pescoço de 34 a 36 cm. */
function ondeCai(cm: number): string {
  if (cm <= 42) return "rente à base do pescoço";
  if (cm <= 47) return "sobre a clavícula";
  if (cm <= 55) return "logo abaixo da clavícula";
  if (cm <= 65) return "no colo";
  return "na altura do busto";
}

/** Altura do ponto mais baixo do colar no desenho (viewBox 320 × 300). */
function queda(cm: number): number {
  return Math.min(282, 108 + (cm - 40) * 5.4);
}

const OMBRO_ESQUERDO = { x: 127, y: 72 };
const OMBRO_DIREITO = { x: 193, y: 72 };

/**
 * Guia do colar: um colo desenhado em traço fino com cada comprimento caindo no seu lugar. O comprimento escolhido
 * fica em tinta, com o pingente; os outros, em fio de ouro pontilhado.
 */
export function GuiaDoColar({ comprimentos, selecionado, onSelecionar, className = "" }: GuiaProps) {
  const [proprio, setProprio] = useState<number | null>(null);
  const controlado = selecionado !== undefined;
  const atual = (controlado ? selecionado : proprio) ?? comprimentos[Math.min(1, comprimentos.length - 1)] ?? null;

  function escolher(cm: number) {
    if (!controlado) setProprio(cm);
    onSelecionar?.(cm);
  }

  if (comprimentos.length === 0) {
    return null;
  }

  return (
    <figure className={className}>
      <svg viewBox="0 0 320 300" role="img" aria-label={atual ? `Um colar de ${atual} cm cai ${ondeCai(atual)}.` : "Guia de comprimento do colar"} className="mx-auto block w-full max-w-[22rem] text-tinta">
        {/* Pescoço, ombros e clavículas em traço fino. */}
        <g fill="none" stroke="var(--color-ouro-tinta)" strokeWidth="1.25" strokeLinecap="round" opacity="0.75">
          <path d="M126 0c0 44-4 70-26 88-24 20-70 20-88 62L6 300" />
          <path d="M194 0c0 44 4 70 26 88 24 20 70 20 88 62l6 150" />
          <path d="M96 122c22 10 44 13 60 13" />
          <path d="M224 122c-22 10-44 13-60 13" />
        </g>
        {comprimentos.map((cm) => {
          const y = queda(cm);
          const marcado = cm === atual;
          // Curva em U com o ponto mais baixo em y: os dois controles da cúbica descem na vertical dos ombros.
          const controle = (8 * y - 2 * OMBRO_ESQUERDO.y) / 6;
          const d = `M${OMBRO_ESQUERDO.x} ${OMBRO_ESQUERDO.y} C${OMBRO_ESQUERDO.x + 4} ${controle} ${OMBRO_DIREITO.x - 4} ${controle} ${OMBRO_DIREITO.x} ${OMBRO_DIREITO.y}`;
          return (
            <g key={cm}>
              <path
                d={d}
                fill="none"
                stroke={marcado ? "currentColor" : "var(--color-ouro-tinta)"}
                strokeWidth={marcado ? 2 : 1}
                strokeDasharray={marcado ? undefined : "2 5"}
                strokeLinecap="round"
                opacity={marcado ? 1 : 0.6}
                style={{ transition: "stroke-width 300ms, opacity 300ms" }}
              />
              {marcado && <circle cx="160" cy={y + 5} r="4.5" fill="var(--color-ouro)" stroke="currentColor" strokeWidth="1" />}
            </g>
          );
        })}
      </svg>

      <div role="group" aria-label="Comprimento do colar" className="mt-4 flex flex-wrap justify-center gap-2">
        {comprimentos.map((cm) => {
          const marcado = cm === atual;
          return (
            <button
              key={cm}
              type="button"
              aria-pressed={marcado}
              onClick={() => escolher(cm)}
              className={`numeros min-h-11 rounded-full border px-4 text-sm transition-colors ${
                marcado ? "border-tinta bg-tinta text-cartela" : "border-[var(--fio-ouro)] bg-cartela/50 hover:border-ouro-tinta"
              }`}
            >
              {cm} cm
            </button>
          );
        })}
      </div>
      {atual && (
        <figcaption aria-live="polite" className="mt-3 text-center text-[0.9375rem]">
          <span className="font-display text-lg">{atual} cm</span> cai {ondeCai(atual)}.
          <span className="mt-1 block text-xs text-vitrine-texto">Referência para um pescoço de 34 a 36 cm; varia de pessoa para pessoa.</span>
        </figcaption>
      )}
    </figure>
  );
}

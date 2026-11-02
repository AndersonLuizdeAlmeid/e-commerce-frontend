"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

interface BrilhoProps {
  className?: string;
  /** 1 = cartela do expositor; valores menores para superfícies grandes, que não devem balançar muito. */
  intensidade?: number;
  children: ReactNode;
}

const INCLINACAO_X = 7;
const INCLINACAO_Y = 9;

/**
 * Brilho de folha (specs/26 §2.5): a superfície inclina na direção do ponteiro e uma luz passa por ela, como
 * sobre metal. Escreve só variáveis CSS no próprio elemento, sem re-render; a regra `.brilho` faz o resto e
 * desliga a inclinação com `prefers-reduced-motion`. A luz aparece no hover/foco do `group` mais próximo.
 */
export function Brilho({ className = "", intensidade = 1, children }: BrilhoProps) {
  const ref = useRef<HTMLDivElement>(null);

  function mover(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || event.pointerType === "touch") {
      return;
    }
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    element.style.setProperty("--rx", `${(0.5 - y) * INCLINACAO_X * intensidade}deg`);
    element.style.setProperty("--ry", `${(x - 0.5) * INCLINACAO_Y * intensidade}deg`);
    element.style.setProperty("--mx", `${x * 100}%`);
    element.style.setProperty("--my", `${y * 100}%`);
  }

  function sair() {
    ["--rx", "--ry", "--mx", "--my"].forEach((name) => ref.current?.style.removeProperty(name));
  }

  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={sair} className={`brilho relative ${className}`}>
      {children}
      <span aria-hidden="true" className="brilho-luz group-hover:opacity-100 group-focus-visible:opacity-100" />
    </div>
  );
}

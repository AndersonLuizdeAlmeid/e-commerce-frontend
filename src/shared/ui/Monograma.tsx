import Link from "next/link";
import { StarMark } from "./icons";

/**
 * Monograma "MO" com a estrela dourada, composto em Prata enquanto o SVG oficial do logo não chega
 * (specs/26 §8.2, D-F06). A estrela é a marca da loja, não um enfeite de interface. O nome acessível
 * contém o texto visível ("MO Acessórios"), como pede a WCAG 2.5.3.
 */
export function Monograma() {
  return (
    <Link href="/" className="group inline-flex items-end gap-2.5 py-1">
      <span className="relative font-display text-[2rem] leading-[0.8] tracking-[-0.04em]">
        MO
        <StarMark className="absolute -right-2.5 -top-1 text-folha" />
      </span>{" "}
      <span className="pb-0.5 text-[0.625rem] font-medium uppercase tracking-[0.32em] text-tinta-suave">Acessórios</span>
      <span className="sr-only">, página inicial</span>
    </Link>
  );
}

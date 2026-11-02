"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CategorySummary, CollectionSummary } from "../api";

/**
 * Etiquetas com as coleções e as categorias, na vitrine abaixo do topo (specs/26 §2.4). A etiqueta da página
 * atual leva a folha dourada. O recorte (`etiqueta-ponta`) fica num elemento interno para não cortar o anel de foco.
 * As coleções vêm primeiro: são poucas, e no celular as últimas etiquetas ficam fora da tela.
 */
export function CategoryNav({ categories, collections }: { categories: CategorySummary[]; collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const links = [
    ...collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      href: `/colecao/${collection.slug}`,
      grafite: collection.cardTheme === "Graphite",
    })),
    ...categories
      .filter((category) => !category.parentId)
      .map((category) => ({ id: category.id, name: category.name, href: `/categoria/${category.slug}`, grafite: false })),
  ];
  if (links.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Coleções e categorias" className="vitrine">
      <ul className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {links.map((link) => {
          const current = pathname === link.href;
          const cor = current
            ? "bg-folha-vitrine text-cartela"
            : link.grafite
              ? "bg-grafite text-cartela group-hover:bg-tinta"
              : "bg-cartela text-tinta group-hover:bg-linha";
          return (
            <li key={link.id} className="shrink-0">
              <Link href={link.href} aria-current={current ? "page" : undefined} className="group block rounded-sm [filter:drop-shadow(0_1px_1px_rgb(74_40_44/0.25))]">
                <span className={`flex min-h-9 items-center gap-2 py-1.5 pl-4 pr-3.5 text-xs font-medium uppercase tracking-[0.16em] etiqueta-ponta transition-colors ${cor}`}>
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${link.grafite && !current ? "bg-prata" : "bg-vitrine-funda"}`} />
                  {link.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

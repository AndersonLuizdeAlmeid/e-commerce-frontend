"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CategorySummary, CollectionSummary } from "../api";

/**
 * As linhas da loja logo abaixo do topo, em Prata sobre o cetim. A página atual leva o fio de ouro-tinta por baixo.
 * As coleções vêm primeiro: são poucas, e no celular os últimos nomes ficam fora da tela.
 */
export function CategoryNav({ categories, collections }: { categories: CategorySummary[]; collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const links = [
    ...collections.map((collection) => ({ id: collection.id, name: collection.name, href: `/colecao/${collection.slug}` })),
    ...categories.filter((category) => !category.parentId).map((category) => ({ id: category.id, name: category.name, href: `/categoria/${category.slug}` })),
  ];
  if (links.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Coleções e categorias" className="vitrine border-b border-linha">
      <ul className="mx-auto flex max-w-6xl gap-x-7 overflow-x-auto px-4 [scrollbar-width:none] sm:gap-x-9">
        {links.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.id} className="shrink-0">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-12 items-center border-b font-display text-[1.0625rem] transition-colors ${
                  current ? "border-ouro-tinta text-ouro-tinta" : "border-transparent text-vitrine-texto hover:text-tinta"
                }`}
              >
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

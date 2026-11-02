import type { ReactNode } from "react";
import { PlusIcon } from "@/shared/ui/icons";
import { sombraCartela } from "./Cartela";

interface ListingLayoutProps {
  heading: ReactNode;
  /** Trilha, descrição e contagem: o que fica abaixo do título. */
  intro?: ReactNode;
  /** Recebe o prefixo de id, porque o formulário aparece no celular e no desktop. */
  filters: (idPrefix: string) => ReactNode;
  children: ReactNode;
}

/**
 * Página de listagem (categoria e busca) na vitrine: os filtros são uma cartela grande ao lado da grade no
 * desktop e uma cartela recolhível no celular (specs/26 §4.2).
 */
export function ListingLayout({ heading, intro, filters, children }: ListingLayoutProps) {
  return (
    <div className="vitrine flex-1">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:pt-10">
        {heading}
        {intro}

        <details className={`cartela group mt-8 rounded-[3px] lg:hidden ${sombraCartela}`}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium uppercase tracking-[0.16em] [&::-webkit-details-marker]:hidden">
            Filtrar e ordenar
            <PlusIcon className="transition-transform duration-300 ease-solta group-open:rotate-45" />
          </summary>
          <div className="border-t border-linha px-4 pb-6 pt-5">{filters("filtros-celular")}</div>
        </details>

        <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
          <aside aria-label="Filtros" className="hidden lg:block">
            <div className={`cartela rounded-[3px] px-5 py-6 ${sombraCartela}`}>
              {filters("filtros")}
            </div>
          </aside>

          <section aria-label="Peças">{children}</section>
        </div>
      </div>
    </div>
  );
}

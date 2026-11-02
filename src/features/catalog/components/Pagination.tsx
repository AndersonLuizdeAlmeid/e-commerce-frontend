import Link from "next/link";
import { buildListingHref, visiblePages, type ListingState } from "../listing-params";

interface PaginationProps {
  basePath: string;
  state: ListingState;
  totalPages: number;
  extra?: Record<string, string | undefined>;
}

const item = "numeros flex min-h-11 min-w-11 items-center justify-center px-3 text-sm";

/** Links rastreáveis `?pagina=N` (SEO-11) — sem JavaScript. Fica na vitrine; a página atual leva a folha. */
export function Pagination({ basePath, state, totalPages, extra }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = visiblePages(state.page, totalPages);

  return (
    <nav aria-label="Paginação" className="mt-12 flex flex-wrap items-center justify-center gap-1.5">
      {state.page > 1 && (
        <Link
          href={buildListingHref(basePath, state, { page: state.page - 1 }, extra)}
          rel="prev"
          className={`${item} underline hover:text-vitrine-texto`}
        >
          Anterior
        </Link>
      )}

      {pages.map((page, index) =>
        page === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-vitrine-texto">
            …
          </span>
        ) : page === state.page ? (
          <span key={page} aria-current="page" className={`${item} bg-folha-vitrine font-medium text-cartela`}>
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildListingHref(basePath, state, { page }, extra)}
            className={`${item} bg-cartela text-tinta transition-colors hover:bg-linha`}
          >
            <span className="sr-only">Página </span>
            {page}
          </Link>
        ),
      )}

      {state.page < totalPages && (
        <Link
          href={buildListingHref(basePath, state, { page: state.page + 1 }, extra)}
          rel="next"
          className={`${item} underline hover:text-vitrine-texto`}
        >
          Próxima
        </Link>
      )}
    </nav>
  );
}

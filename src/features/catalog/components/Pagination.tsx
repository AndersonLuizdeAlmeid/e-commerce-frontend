import Link from "next/link";
import { buildListingHref, visiblePages, type ListingState } from "../listing-params";

interface PaginationProps {
  basePath: string;
  state: ListingState;
  totalPages: number;
  extra?: Record<string, string | undefined>;
}

/** Links rastreáveis `?pagina=N` (SEO-11) — sem JavaScript. */
export function Pagination({ basePath, state, totalPages, extra }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = visiblePages(state.page, totalPages);
  const linkClass = "flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm";

  return (
    <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {state.page > 1 && (
        <Link
          href={buildListingHref(basePath, state, { page: state.page - 1 }, extra)}
          rel="prev"
          className={`${linkClass} border-line bg-white hover:border-brand`}
        >
          Anterior
        </Link>
      )}

      {pages.map((page, index) =>
        page === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : page === state.page ? (
          <span key={page} aria-current="page" className={`${linkClass} border-brand bg-brand font-medium text-white`}>
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildListingHref(basePath, state, { page }, extra)}
            className={`${linkClass} border-line bg-white hover:border-brand`}
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
          className={`${linkClass} border-line bg-white hover:border-brand`}
        >
          Próxima
        </Link>
      )}
    </nav>
  );
}

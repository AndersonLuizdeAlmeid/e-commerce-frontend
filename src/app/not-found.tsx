import Link from "next/link";
import { SearchForm } from "@/shared/ui/SearchForm";
import { StoreChrome } from "@/shared/ui/StoreChrome";

/** SEO-12: 404 útil (busca + caminho de volta) e com status HTTP 404 de verdade. */
export default function NotFound() {
  return (
    <StoreChrome>
      <section className="vitrine flex-1">
        <div className="mx-auto max-w-xl px-4 pb-20 pt-12 text-center">
          <h1 className="font-display text-4xl leading-tight text-balance sm:text-5xl">Essa página saiu da vitrine</h1>
          <p className="mt-3 text-vitrine-texto">O endereço pode ter mudado ou a peça não está mais na loja.</p>
          <div className="cartela mx-auto mt-10 max-w-sm rounded-[3px] px-4 py-2 text-left">
            <SearchForm />
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center bg-cartela px-6 text-sm font-medium uppercase tracking-[0.16em] text-tinta transition-colors hover:bg-linha"
          >
            Ver as novidades
          </Link>
        </div>
      </section>
    </StoreChrome>
  );
}

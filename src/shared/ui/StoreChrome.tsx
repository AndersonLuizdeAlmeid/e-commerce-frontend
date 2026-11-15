import Link from "next/link";
import { AccountLink } from "@/features/auth/components/AccountLink";
import { CartProvider } from "@/features/cart/CartProvider";
import { SacolaLink } from "@/features/cart/components/SacolaLink";
import { getCategories, getCollections } from "@/features/catalog/api";
import { CategoryNav } from "@/features/catalog/components/CategoryNav";
import { MedidorProvider } from "@/features/vitrine/MedidorDeAro";
import { INSTAGRAM_URL, SITE_SLOGAN, WARRANTY_TEXT, whatsappUrl } from "@/shared/lib/site";
import { FalarComAMO } from "./FalarComAMO";
import { SearchIcon, StarMark } from "./icons";
import { Monograma } from "./Monograma";
import { SearchForm } from "./SearchForm";

/** Moldura das páginas da loja e da conta: topo, coleções e categorias, e rodapé. O painel (/admin) tem a própria moldura. */
export async function StoreChrome({ children }: { children: React.ReactNode }) {
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);
  // O medidor de aro leva de volta aos anéis; sem uma categoria de anéis, ele só fecha.
  const aneis = categories.find((category) => category.slug === "aneis" || /^an[eé]is?\b/i.test(category.name));

  return (
    <CartProvider>
      <MedidorProvider aneisHref={aneis ? `/categoria/${aneis.slug}` : undefined}>
        <header className="sticky top-0 z-40 border-b border-linha bg-cartela/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
            <Monograma />
            <div className="flex items-center gap-1 sm:gap-5">
              <div className="hidden sm:block">
                <SearchForm compact />
              </div>
              <Link href="/busca" aria-label="Buscar peças" className="grid size-11 place-items-center sm:hidden">
                <SearchIcon />
              </Link>
              <AccountLink />
              <SacolaLink />
            </div>
          </div>
        </header>
        <CategoryNav categories={categories} collections={collections} />

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="border-t border-linha">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-28 pt-14 sm:grid-cols-[1fr_auto] sm:pb-16">
            <div>
              <p className="flex items-start gap-2 font-display text-3xl leading-tight sm:text-4xl">
                {SITE_SLOGAN}
                <StarMark className="mt-1.5 size-3 shrink-0 text-ouro" />
              </p>
              <p className="mt-3 max-w-md text-sm text-tinta-suave">{WARRANTY_TEXT}</p>
            </div>
            <ul className="flex flex-col gap-1 text-sm sm:items-end">
              <li>
                <a href={whatsappUrl("Olá! Vim pelo site da MO.")} target="_blank" rel="noopener noreferrer" className="link-ouro inline-flex min-h-11 items-center">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link-ouro inline-flex min-h-11 items-center">
                  Instagram @momodaeacessorios
                </a>
              </li>
            </ul>
          </div>
        </footer>
        <FalarComAMO />
      </MedidorProvider>
    </CartProvider>
  );
}

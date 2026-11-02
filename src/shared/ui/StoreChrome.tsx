import Link from "next/link";
import { AccountLink } from "@/features/auth/components/AccountLink";
import { CartProvider } from "@/features/cart/CartProvider";
import { SacolaLink } from "@/features/cart/components/SacolaLink";
import { getCategories, getCollections } from "@/features/catalog/api";
import { CategoryNav } from "@/features/catalog/components/CategoryNav";
import { INSTAGRAM_URL, SITE_SLOGAN, WARRANTY_TEXT, whatsappUrl } from "@/shared/lib/site";
import { FalarComAMO } from "./FalarComAMO";
import { SearchIcon } from "./icons";
import { Monograma } from "./Monograma";
import { SearchForm } from "./SearchForm";

/** Moldura das páginas da loja e da conta: topo, coleções e categorias, e rodapé. O painel (/admin) tem a própria moldura. */
export async function StoreChrome({ children }: { children: React.ReactNode }) {
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);

  return (
    <CartProvider>
      <header className="border-b border-linha">
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
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-12 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-2xl leading-tight">{SITE_SLOGAN}.</p>
            <p className="mt-2 max-w-md text-sm text-tinta-suave">{WARRANTY_TEXT}</p>
          </div>
          <ul className="flex flex-col gap-1 text-sm sm:items-end">
            <li>
              <a href={whatsappUrl("Olá! Vim pelo site da MO.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">
                Instagram @momodaeacessorios
              </a>
            </li>
          </ul>
        </div>
      </footer>
      <FalarComAMO />
    </CartProvider>
  );
}

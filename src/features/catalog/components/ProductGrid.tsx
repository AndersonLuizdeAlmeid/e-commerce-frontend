import { Peca } from "@/features/vitrine/Peca";
import type { CardTheme, ProductSummary } from "../api";
import { CartelaVazia } from "./Cartela";

/** As primeiras imagens carregam com prioridade: costumam ser o LCP da página (SEO-08). */
const PRIORITY_IMAGES = 4;

interface ProductGridProps {
  products: ProductSummary[];
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
  /** Ao lado da coluna de filtros a grade fica com 3 colunas no desktop, para a peça não encolher. */
  besideFilters?: boolean;
  /** Fileira única de 4: reflui em 2 e 4 colunas, sem peça sobrando. */
  fileiraDeQuatro?: boolean;
  tema?: CardTheme;
  tituloComo?: "h2" | "h3";
}

/** A grade da loja: peças em molduras, em fileiras inteiras. Cada peça vira ali mesmo para comprar (Peca). */
export function ProductGrid({ products, emptyMessage, emptyAction, besideFilters = false, fileiraDeQuatro = false, tema, tituloComo }: ProductGridProps) {
  if (products.length === 0) {
    return <CartelaVazia message={emptyMessage} action={emptyAction} />;
  }

  return (
    <ul
      className={`grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 lg:gap-x-8 lg:gap-y-12 ${
        fileiraDeQuatro ? "lg:grid-cols-4" : `sm:grid-cols-3 ${besideFilters ? "" : "lg:grid-cols-4"}`
      }`}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <Peca product={product} priority={!fileiraDeQuatro && index < PRIORITY_IMAGES} tema={tema} tituloComo={tituloComo} />
        </li>
      ))}
    </ul>
  );
}

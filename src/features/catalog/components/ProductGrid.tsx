import { AddFeaturedButton } from "@/features/cart/components/AddFeaturedButton";
import type { CardTheme, ProductSummary } from "../api";
import { Cartela, CartelaVazia } from "./Cartela";

/** As primeiras imagens carregam com prioridade: costumam ser o LCP da página (SEO-08). */
const PRIORITY_IMAGES = 4;

interface ProductGridProps {
  products: ProductSummary[];
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
  /** A primeira peça vira a cartela grande da vez (home). */
  highlightFirst?: boolean;
  /** Ao lado da coluna de filtros a grade fica com 3 colunas no desktop, para a peça não encolher. */
  besideFilters?: boolean;
  /** Fileira única de 4 na home: reflui em 2 e 4 colunas, sem cartela sobrando (specs/26 §2.4). */
  fileiraDeQuatro?: boolean;
  tema?: CardTheme;
  tituloComo?: "h2" | "h3";
  /** Slug do acabamento da primeira cartela, a peça em destaque (RF-025). */
  corDaPrimeira?: string;
}

/** A vitrine: cartelas em fileiras que refluem sempre em cartelas inteiras (specs/26 §2.4). */
export function ProductGrid({
  products,
  emptyMessage,
  emptyAction,
  highlightFirst = false,
  besideFilters = false,
  fileiraDeQuatro = false,
  tema,
  tituloComo,
  corDaPrimeira,
}: ProductGridProps) {
  if (products.length === 0) {
    return <CartelaVazia message={emptyMessage} action={emptyAction} />;
  }

  return (
    <ul
      className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-y-10 ${
        fileiraDeQuatro ? "lg:grid-cols-4" : `sm:grid-cols-3 ${besideFilters ? "" : "lg:grid-cols-4"}`
      }`}
    >
      {products.map((product, index) => {
        const highlighted = highlightFirst && index === 0;
        return (
          <li key={product.id} className={highlighted ? "relative col-span-2" : undefined}>
            <Cartela
              product={product}
              priority={!fileiraDeQuatro && index < PRIORITY_IMAGES}
              destaque={highlighted}
              tema={tema}
              tituloComo={tituloComo}
              cor={index === 0 ? corDaPrimeira : undefined}
            />
            {/* Fora do link da cartela (botão dentro de link não vale), sobre o espaço que a cartela reserva. */}
            {highlighted && (
              <div className="absolute bottom-6 left-4 sm:bottom-8 sm:left-[calc(3.5rem+0.55*(100%-3rem))]">
                <AddFeaturedButton slug={product.slug} colorSlug={corDaPrimeira} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

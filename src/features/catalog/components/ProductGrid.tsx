import type { ProductSummary } from "../api";
import { ProductCard } from "./ProductCard";

/** As primeiras imagens carregam com prioridade: costumam ser o LCP da página (SEO-08). */
const PRIORITY_IMAGES = 4;

export function ProductGrid({ products, emptyMessage }: { products: ProductSummary[]; emptyMessage: string }) {
  if (products.length === 0) {
    return <p className="rounded-lg border border-dashed border-line p-6 text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < PRIORITY_IMAGES} />
        </li>
      ))}
    </ul>
  );
}

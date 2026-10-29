import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/shared/lib/format";
import type { ProductSummary } from "../api";

const MAX_SWATCHES = 5;

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const extraColors = product.colors.length - MAX_SWATCHES;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-line">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <h3 className="mt-3 text-sm font-medium text-ink group-hover:text-brand">{product.name}</h3>
      <p className="mt-1 text-sm text-muted">
        a partir de <span className="font-semibold text-ink">{formatPrice(product.priceFrom)}</span>
      </p>

      {product.colors.length > 0 && (
        <ul className="mt-2 flex items-center gap-1.5" aria-label={`Cores: ${product.colors.map((c) => c.name).join(", ")}`}>
          {product.colors.slice(0, MAX_SWATCHES).map((color) => (
            <li
              key={color.id}
              title={color.name}
              className="size-3.5 rounded-full border border-ink/15"
              style={{ backgroundColor: color.hex }}
            />
          ))}
          {extraColors > 0 && <li className="text-xs text-muted">+{extraColors}</li>}
        </ul>
      )}
    </Link>
  );
}

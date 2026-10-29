import Link from "next/link";
import { formatPrice } from "@/shared/lib/format";
import type { CatalogFilters } from "../api";
import { SORT_OPTIONS, type ListingState } from "../listing-params";

interface ListingFiltersProps {
  action: string;
  filters: CatalogFilters;
  state: ListingState;
  /** Campos que precisam sobreviver ao envio (ex.: `q` da busca). */
  hidden?: Record<string, string | undefined>;
}

/**
 * Filtros de cor, tamanho, preço e ordenação (RF-020, RF-023) como formulário GET comum:
 * funciona sem JavaScript e gera URLs que a página sabe ler de volta.
 */
export function ListingFilters({ action, filters, state, hidden = {} }: ListingFiltersProps) {
  const pricePlaceholder = (value: number | null) => (value === null ? undefined : formatPrice(value));

  return (
    <form action={action} method="get" className="space-y-6 text-sm">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}

      <div>
        <label htmlFor="ordem" className="font-medium">
          Ordenar por
        </label>
        <select
          id="ordem"
          name="ordem"
          defaultValue={state.sort}
          className="mt-2 block w-full rounded-md border border-line bg-white px-3 py-2"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filters.colors.length > 0 && (
        <fieldset>
          <legend className="font-medium">Cor</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {filters.colors.map((color) => (
              <label key={color.id} className="flex items-center gap-2">
                <input type="checkbox" name="cor" value={color.slug} defaultChecked={state.colors.includes(color.slug)} />
                <span aria-hidden="true" className="size-4 rounded-full border border-ink/15" style={{ backgroundColor: color.hex }} />
                {color.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {filters.sizes.length > 0 && (
        <fieldset>
          <legend className="font-medium">Tamanho</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.sizes.map((size) => (
              <label key={size.id} className="flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5">
                <input type="checkbox" name="tamanho" value={size.name} defaultChecked={state.sizes.includes(size.name)} />
                {size.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-medium">Preço (R$)</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-muted">De</span>
            <input
              type="number"
              name="preco_min"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={state.minPrice}
              placeholder={pricePlaceholder(filters.minPrice)}
              className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-muted">Até</span>
            <input
              type="number"
              name="preco_max"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={state.maxPrice}
              placeholder={pricePlaceholder(filters.maxPrice)}
              className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2"
            />
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90">
          Aplicar filtros
        </button>
        <Link href={hidden.q ? `${action}?q=${encodeURIComponent(hidden.q)}` : action} className="text-muted underline hover:text-brand">
          Limpar
        </Link>
      </div>
    </form>
  );
}

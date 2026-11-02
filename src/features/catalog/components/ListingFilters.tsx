import Link from "next/link";
import { formatPrice } from "@/shared/lib/format";
import type { CatalogFilters } from "../api";
import { SORT_OPTIONS, type ListingState } from "../listing-params";
import { DEFAULT_VARIANT_LABELS, type VariantLabels } from "../variant-labels";

interface ListingFiltersProps {
  action: string;
  filters: CatalogFilters;
  state: ListingState;
  /** Campos que precisam sobreviver ao envio (ex.: `q` da busca). */
  hidden?: Record<string, string | undefined>;
  labels?: VariantLabels;
  /** Na coleção, a primeira etiqueta de filtro é a categoria (specs/26 §4.2). */
  categories?: CatalogFilters["categories"];
  /** O formulário aparece duas vezes (celular e desktop); o prefixo mantém os ids únicos. */
  idPrefix: string;
}

/**
 * Opção de filtro como etiqueta com ponta, igual às da navegação. O rótulo leva o foco (o recorte fica no
 * elemento de dentro); a marcada fica em tinta e o furo da etiqueta vira folha (specs/26 §2.2, regra 2).
 */
const etiqueta =
  "group cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta";
const etiquetaCorpo =
  "etiqueta-ponta flex min-h-10 items-center gap-2 bg-linha/70 py-1.5 pl-4 pr-3 transition-colors group-hover:bg-linha group-has-[:checked]:bg-tinta group-has-[:checked]:text-cartela";
const etiquetaFuro = "size-1.5 shrink-0 rounded-full bg-cartela group-has-[:checked]:bg-folha-vitrine";

const campo =
  "mt-1 block min-h-11 w-full border-b border-tinta/40 bg-transparent py-2 numeros placeholder:text-tinta-suave focus-visible:border-tinta focus-visible:shadow-[0_1px_0_0_var(--color-tinta)] focus-visible:outline-none";

/**
 * Filtros de acabamento/cor, tamanho, preço e ordenação (RF-020, RF-023) como formulário GET comum:
 * funciona sem JavaScript e gera URLs que a página sabe ler de volta. Cada opção é uma etiqueta;
 * a marcada fica em tinta com o aro de folha (specs/26 §4.2).
 */
export function ListingFilters({ action, filters, state, hidden = {}, labels = DEFAULT_VARIANT_LABELS, categories = [], idPrefix }: ListingFiltersProps) {
  const pricePlaceholder = (value: number | null) => (value === null ? undefined : formatPrice(value));
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form action={action} method="get" className="space-y-7 text-sm">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}

      {categories.length > 1 && (
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-[0.16em]">Categoria</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={etiqueta}>
              <input type="radio" name="categoria" value="" defaultChecked={!state.category} className="sr-only" />
              <span className={etiquetaCorpo}>
                <span aria-hidden="true" className={etiquetaFuro} />
                Todas
              </span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className={etiqueta}>
                <input type="radio" name="categoria" value={category.slug} defaultChecked={state.category === category.slug} className="sr-only" />
                <span className={etiquetaCorpo}>
                  <span aria-hidden="true" className={etiquetaFuro} />
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor={id("ordem")} className="text-xs font-medium uppercase tracking-[0.16em]">
          Ordenar por
        </label>
        <select id={id("ordem")} name="ordem" defaultValue={state.sort} className={`${campo} cursor-pointer`}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filters.colors.length > 0 && (
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-[0.16em]">{labels.color}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.colors.map((color) => (
              <label key={color.id} className={etiqueta}>
                <input type="checkbox" name="cor" value={color.slug} defaultChecked={state.colors.includes(color.slug)} className="sr-only" />
                <span className={etiquetaCorpo}>
                  <span aria-hidden="true" className={etiquetaFuro} />
                  <span aria-hidden="true" className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]" style={{ backgroundColor: color.hex }} />
                  {color.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {filters.sizes.length > 0 && (
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-[0.16em]">{labels.size}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.sizes.map((size) => (
              <label key={size.id} className={etiqueta}>
                <input type="checkbox" name="tamanho" value={size.name} defaultChecked={state.sizes.includes(size.name)} className="sr-only" />
                <span className={`${etiquetaCorpo} numeros`}>
                  <span aria-hidden="true" className={etiquetaFuro} />
                  {size.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.16em]">Preço (R$)</legend>
        <div className="mt-1 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-tinta-suave">De</span>
            <input
              type="number"
              name="preco_min"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={state.minPrice}
              placeholder={pricePlaceholder(filters.minPrice)}
              className={campo}
            />
          </label>
          <label className="block">
            <span className="text-tinta-suave">Até</span>
            <input
              type="number"
              name="preco_max"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={state.maxPrice}
              placeholder={pricePlaceholder(filters.maxPrice)}
              className={campo}
            />
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-5">
        <button
          type="submit"
          className="min-h-11 bg-tinta px-6 text-sm font-medium uppercase tracking-[0.16em] text-cartela transition-colors hover:bg-grafite"
        >
          Aplicar
        </button>
        <Link href={hidden.q ? `${action}?q=${encodeURIComponent(hidden.q)}` : action} className="inline-flex min-h-11 items-center underline">
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}

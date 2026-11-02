import { SearchIcon } from "./icons";

/** Busca por GET em /busca — funciona sem JavaScript e é o alvo do SearchAction do JSON-LD. */
export function SearchForm({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
  return (
    <form
      action="/busca"
      method="get"
      role="search"
      className="flex items-center border-b border-tinta/40 focus-within:border-tinta focus-within:shadow-[0_1px_0_0_var(--color-tinta)]"
    >
      <label htmlFor={compact ? "busca-q-topo" : "busca-q"} className="sr-only">
        Buscar peças
      </label>
      <input
        id={compact ? "busca-q-topo" : "busca-q"}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar peças"
        maxLength={100}
        className={`min-h-11 bg-transparent py-2 text-base placeholder:text-tinta-suave focus-visible:outline-none ${
          compact ? "w-28 sm:w-48" : "w-full"
        }`}
      />
      <button type="submit" className="grid size-11 shrink-0 place-items-center" aria-label="Buscar">
        <SearchIcon />
      </button>
    </form>
  );
}

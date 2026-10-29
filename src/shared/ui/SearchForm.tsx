/** Busca por GET em /busca — funciona sem JavaScript e é o alvo do SearchAction do JSON-LD. */
export function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/busca" method="get" role="search" className="flex items-center gap-2">
      <label htmlFor="busca-q" className="sr-only">
        Buscar produtos
      </label>
      <input
        id="busca-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar produtos"
        maxLength={100}
        className="w-44 rounded-md border border-line bg-white px-3 py-2 text-sm sm:w-56"
      />
      <button type="submit" className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand/90">
        Buscar
      </button>
    </form>
  );
}

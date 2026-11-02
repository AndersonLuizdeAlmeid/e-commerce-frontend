import { CartelaEsqueleto } from "./Cartela";

const PLACEHOLDERS = 8;

/** Carregamento de categoria e busca: a vitrine já aparece, com cartelas ainda sem peça. */
export function ListingSkeleton() {
  return (
    <div className="vitrine flex-1" role="status">
      <span className="sr-only">Carregando peças…</span>
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:pt-10">
        <div aria-hidden="true" className="h-12 w-2/3 max-w-sm bg-vitrine-funda/60" />
        <ul aria-hidden="true" className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: PLACEHOLDERS }, (_, index) => (
            <li key={index}>
              <CartelaEsqueleto />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

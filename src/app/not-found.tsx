import Link from "next/link";
import { SearchForm } from "@/shared/ui/SearchForm";

/** SEO-12: 404 útil (busca + caminho de volta) e com status HTTP 404 de verdade. */
export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="mt-3 text-muted">O endereço pode ter mudado ou a página não existe mais.</p>
      <div className="mt-8 flex justify-center">
        <SearchForm />
      </div>
      <Link href="/" className="mt-8 inline-block rounded-md bg-brand px-5 py-2.5 font-medium text-white">
        Ver categorias
      </Link>
    </section>
  );
}

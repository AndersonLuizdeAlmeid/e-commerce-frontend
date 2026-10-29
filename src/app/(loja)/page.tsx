import Link from "next/link";
import { getCategories, getProducts } from "@/features/catalog/api";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";

export const revalidate = 300;

const NEW_ARRIVALS = 8;

export default async function HomePage() {
  const [categories, newArrivals] = await Promise.all([
    getCategories(),
    getProducts({ pageSize: NEW_ARRIVALS, sort: "createdAt:desc" }),
  ]);

  return (
    <>
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
        <p className="mt-2 text-muted">Escolha uma categoria para ver os produtos.</p>

        {categories.length === 0 ? (
          <p className="mt-8 text-muted">Nenhuma categoria disponível no momento.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="flex h-28 items-end rounded-lg border border-line bg-white p-4 font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16" aria-labelledby="novidades">
        <h2 id="novidades" className="text-2xl font-semibold tracking-tight">
          Novidades
        </h2>
        <div className="mt-6">
          <ProductGrid products={newArrivals.items} emptyMessage="Os produtos aparecem aqui assim que forem cadastrados." />
        </div>
      </section>
    </>
  );
}

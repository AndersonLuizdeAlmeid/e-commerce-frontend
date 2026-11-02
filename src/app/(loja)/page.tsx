import Image from "next/image";
import Link from "next/link";
import { getCategories, getCollections, getProducts, getShowcase, type CardTheme } from "@/features/catalog/api";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { SITE_SLOGAN } from "@/shared/lib/site";
import { ArrowIcon } from "@/shared/ui/icons";

export const revalidate = 300;

// A cartela da vez ocupa duas casas: 11 peças fecham fileiras inteiras em 2, 3 e 4 colunas.
const NEW_ARRIVALS = 11;
const COLLECTIONS_ON_HOME = 3;
const PIECES_PER_SECTION = 4;

/**
 * Home: a vitrine da entrada (specs/26 §4.1). A primeira cartela é a peça em destaque escolhida no painel ou, sem ela,
 * a novidade mais recente com estoque (RF-025 CA1). Depois alterna denso e calmo: categorias, ocasião e coleções.
 */
export default async function HomePage() {
  const [categories, newArrivals, showcase, collections] = await Promise.all([
    getCategories(),
    getProducts({ pageSize: NEW_ARRIVALS, sort: "createdAt:desc" }),
    getShowcase(),
    getCollections(),
  ]);

  const featured = showcase.featured;
  const vitrine = featured
    ? [featured.product, ...newArrivals.items.filter((product) => product.id !== featured.product.id)].slice(0, NEW_ARRIVALS)
    : newArrivals.items;
  const featuredColor = featured?.product.colors.find((color) => color.id === featured.colorId)?.slug;

  const mainCategories = categories.filter((category) => !category.parentId);
  const occasion = showcase.occasion;
  const collectionSections = (
    await Promise.all(
      collections.slice(0, COLLECTIONS_ON_HOME).map(async (collection) => ({
        collection,
        products: (await getProducts({ collection: collection.slug, pageSize: PIECES_PER_SECTION, sort: "createdAt:desc" })).items,
      })),
    )
  ).filter((section) => section.products.length > 0);

  return (
    <>
      <section aria-labelledby="slogan" className="vitrine">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-12">
          <h1 id="slogan" className="max-w-3xl font-display text-[2rem] leading-[1.02] tracking-[-0.02em] text-balance sm:text-6xl">
            {SITE_SLOGAN}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-vitrine-texto sm:mt-3 sm:text-base">
            Semijoias, acessórios e bolsas, para ela e para ele.
          </p>

          <div className="mt-5 sm:mt-12">
            <ProductGrid
              products={vitrine}
              highlightFirst
              corDaPrimeira={featuredColor}
              emptyMessage="As peças aparecem aqui assim que forem cadastradas."
            />
          </div>
        </div>
      </section>

      {mainCategories.length > 0 && (
        <section aria-labelledby="pelas-pecas" className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 id="pelas-pecas" className="font-display text-3xl leading-tight sm:text-4xl">
            Escolha pela peça
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
            {mainCategories.map((category) => (
              <li key={category.id} className="border-t border-linha">
                <Link
                  href={`/categoria/${category.slug}`}
                  className="group flex min-h-16 items-center justify-between gap-3 py-4 font-display text-xl leading-tight"
                >
                  {category.name}
                  <ArrowIcon className="shrink-0 text-tinta-suave transition-transform duration-300 ease-solta group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {occasion && (
        <section aria-labelledby="ocasiao" className="bg-vitrine-funda text-vitrine-tinta">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className={occasion.imageUrl ? "grid items-center gap-6 sm:grid-cols-2 sm:gap-10" : undefined}>
              <div>
                <h2 id="ocasiao" className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
                  {occasion.name}
                </h2>
                {occasion.text && <p className="mt-3 max-w-xl sm:text-lg">{occasion.text}</p>}
              </div>
              {occasion.imageUrl && (
                <div className="relative aspect-[3/2] overflow-hidden rounded-[3px]">
                  <Image src={occasion.imageUrl} alt="" fill sizes="(min-width: 1152px) 560px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
              )}
            </div>
            <div className="mt-10">
              <ProductGrid products={occasion.products.slice(0, PIECES_PER_SECTION)} fileiraDeQuatro tituloComo="h3" emptyMessage="" />
            </div>
          </div>
        </section>
      )}

      {collectionSections.length > 0 && (
        <div className="vitrine">
          <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:space-y-20 sm:py-20">
            {collectionSections.map(({ collection, products }) => (
              <section key={collection.id} aria-labelledby={`colecao-${collection.slug}`}>
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                  <h2 id={`colecao-${collection.slug}`} className="font-display text-3xl leading-tight sm:text-4xl">
                    {collection.name}
                  </h2>
                  <Link href={`/colecao/${collection.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline">
                    Ver a coleção
                    <span className="sr-only"> {collection.name}</span>
                  </Link>
                </div>
                <div className="mt-6">
                  <ProductGrid
                    products={products}
                    fileiraDeQuatro
                    tema={collection.cardTheme as CardTheme}
                    tituloComo="h3"
                    emptyMessage=""
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

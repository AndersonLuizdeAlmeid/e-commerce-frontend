import { getCategories, getCollections, getProducts, getShowcase, type CardTheme } from "@/features/catalog/api";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { FaixaDasLinhas, type Linha } from "@/features/vitrine/FaixaDasLinhas";
import { PecaEmCena } from "@/features/vitrine/PecaEmCena";
import { Prateleira, VitrinePorLinha } from "@/features/vitrine/Prateleira";
import { SemErrarOTamanho } from "@/features/vitrine/SemErrarOTamanho";
import { SITE_SLOGAN } from "@/shared/lib/site";

export const revalidate = 300;

const NOVIDADES = 12;
/** Peças que se revezam na abertura. */
const EM_CENA = 4;
const PECAS_POR_PRATELEIRA = 10;
const COLECOES_NA_HOME = 2;

/**
 * Home: a peça em cena abre a loja (com preço e sacola), a faixa mostra as linhas, e as prateleiras deslizantes
 * levam às peças: novidades, a vitrine por linha, a ocasião e as coleções. No meio, o medidor de aro e o guia do colar.
 */
export default async function HomePage() {
  const [categories, novidades, showcase, collections] = await Promise.all([
    getCategories(),
    getProducts({ pageSize: NOVIDADES, sort: "createdAt:desc" }),
    getShowcase(),
    getCollections(),
  ]);

  const featured = showcase.featured;
  const recentes = featured ? [featured.product, ...novidades.items.filter((product) => product.id !== featured.product.id)] : novidades.items;
  const featuredColor = featured?.product.colors.find((color) => color.id === featured.colorId)?.slug;
  const emCena = recentes.filter((product) => product.image).slice(0, EM_CENA);
  const mainCategories = categories.filter((category) => !category.parentId);
  const occasion = showcase.occasion;

  const [porLinha, porColecao] = await Promise.all([
    Promise.all(
      mainCategories.map(async (category) => ({
        slug: category.slug,
        name: category.name,
        products: (await getProducts({ category: category.slug, pageSize: PECAS_POR_PRATELEIRA, sort: "createdAt:desc" })).items,
      })),
    ),
    Promise.all(
      collections.slice(0, COLECOES_NA_HOME).map(async (collection) => ({
        collection,
        products: (await getProducts({ collection: collection.slug, pageSize: PECAS_POR_PRATELEIRA, sort: "createdAt:desc" })).items,
      })),
    ),
  ]);
  const linhasComPecas = porLinha.filter((linha) => linha.products.length > 0);

  const faixa: Linha[] = [
    ...collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      href: `/colecao/${collection.slug}`,
      imageUrl: porColecao.find((item) => item.collection.id === collection.id)?.products[0]?.image?.url ?? null,
    })),
    ...linhasComPecas.map((linha) => ({ id: linha.slug, name: linha.name, href: `/categoria/${linha.slug}`, imageUrl: linha.products[0]?.image?.url ?? null })),
  ];

  if (recentes.length === 0) {
    return (
      <section aria-labelledby="slogan" className="vitrine">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 id="slogan" className="max-w-3xl font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-balance sm:text-6xl">
            {SITE_SLOGAN}
          </h1>
          <div className="mt-10">
            <ProductGrid products={[]} emptyMessage="As peças aparecem aqui assim que forem cadastradas." />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PecaEmCena pecas={emCena} corDaPrimeira={featuredColor}>
        <h1 id="slogan" className="font-display text-[2.75rem] leading-[0.98] tracking-[-0.025em] text-balance sm:text-6xl lg:text-[4.5rem]">
          {SITE_SLOGAN}
        </h1>
        <p className="mt-3 max-w-md text-vitrine-texto sm:text-lg">Semijoias, acessórios e bolsas, para ela e para ele.</p>
      </PecaEmCena>

      <FaixaDasLinhas linhas={faixa} />

      <div className="vitrine pb-4 pt-16 sm:pt-24">
        <Prateleira id="novidades" titulo="Chegaram agora" href="/busca" verTudo="Ver todas as peças" products={recentes} />
      </div>

      <VitrinePorLinha linhas={linhasComPecas} />

      <SemErrarOTamanho />

      {occasion && occasion.products.length > 0 && (
        <div className="vitrine-nude border-y border-linha pb-4 pt-16 sm:pt-24">
          <Prateleira id="ocasiao" titulo={occasion.name} descricao={occasion.text} products={occasion.products} />
        </div>
      )}

      {porColecao
        .filter((item) => item.products.length > 0)
        .map(({ collection, products }) => (
          <div key={collection.id} className="vitrine pb-4 pt-16 sm:pt-24">
            <Prateleira
              id={`colecao-${collection.slug}`}
              titulo={collection.name}
              href={`/colecao/${collection.slug}`}
              verTudo="Ver a coleção"
              products={products}
              tema={collection.cardTheme as CardTheme}
            />
          </div>
        ))}
    </>
  );
}

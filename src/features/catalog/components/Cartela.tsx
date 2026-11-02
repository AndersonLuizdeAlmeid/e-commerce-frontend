import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/shared/lib/format";
import type { CardTheme, ProductSummary } from "../api";
import { Brilho } from "./Brilho";

const MAX_SWATCHES = 5;

/** Sombra da cartela apoiada na vitrine: tingida de rosé, nunca cinza. Quem for usar a cartela fora da grade a reaproveita. */
export const sombraCartela = "shadow-[0_1px_2px_rgb(74_40_44/0.14),0_14px_26px_-16px_rgb(74_40_44/0.45)]";

/**
 * "MO" impresso tom sobre tom no rodapé da cartela: a marca está lá sem gastar a folha dourada. Fica de propósito
 * quase invisível, então vem por `content` (não é texto da página nem entra na árvore de acessibilidade).
 * Quando o SVG do logo chegar (D-F06), o monograma entra no lugar do texto, no mesmo tom.
 */
function Relevo({ className = "text-linha" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-2.5 right-3 font-display text-xs tracking-[-0.02em] after:content-['MO'] ${className}`}
    />
  );
}

/** Ao ser apontada, a cartela ganha o fio de folha e uma sombra mais funda; o foco usa o mesmo aro. */
const realce =
  "group-hover:shadow-[0_0_0_1px_var(--color-folha-vitrine),0_22px_36px_-18px_rgb(74_40_44/0.55)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-folha-vitrine";

/** Na linha masculina a folha é prateada; o contorno de foco continua escuro, porque fica sobre a vitrine rosé. */
const realceGrafite =
  "group-hover:shadow-[0_0_0_1px_var(--color-prata),0_22px_36px_-18px_rgb(74_40_44/0.55)] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-grafite";

interface CartelaProps {
  product: ProductSummary;
  priority?: boolean;
  /**
   * A peça da vez (specs/26 §4.1): ocupa a largura no celular e, do tablet em diante, vira uma cartela larga
   * (foto de um lado, texto do outro), como a de colar, para nome, preço e ação caberem na primeira tela.
   */
  destaque?: boolean;
  /** Tema da coleção: grafite com folha prateada na linha "Eles" (specs/26 §2.2 e §4.2). */
  tema?: CardTheme;
  /** Abaixo de um título de seção, o nome da peça desce um nível. */
  tituloComo?: "h2" | "h3";
  /** Slug do acabamento que já abre escolhido na página da peça (RF-025). */
  cor?: string;
}

/** Cartão de produto da loja: a peça na cartela marfim da MO, com o brilho de folha (specs/26 §2.4 e §2.5). */
export function Cartela({ product, priority = false, destaque = false, tema = "Ivory", tituloComo: Titulo = "h2", cor }: CartelaProps) {
  const extraColors = product.colors.length - MAX_SWATCHES;
  const grafite = tema === "Graphite";
  const suave = grafite ? "text-prata" : "text-tinta-suave";

  return (
    <Link href={`/produto/${product.slug}${cor ? `?cor=${encodeURIComponent(cor)}` : ""}`} className="group block h-full outline-none">
      <Brilho
        className={`flex h-full flex-col overflow-hidden rounded-[3px] ${grafite ? `cartela-grafite ${realceGrafite}` : `cartela ${realce}`} ${sombraCartela} ${
          destaque ? "p-4 pb-6 sm:flex-row sm:gap-8 sm:p-6" : "p-3 pb-4"
        }`}
      >
        <div className={`relative shrink-0 overflow-hidden ${grafite ? "bg-prata/15" : "bg-linha/50"} ${destaque ? "aspect-square sm:w-[55%] sm:aspect-[4/5]" : "aspect-[4/5]"}`}>
          {product.image && (
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              priority={priority}
              sizes={destaque ? "(min-width: 1024px) 28vw, (min-width: 640px) 37vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
              className="object-cover"
            />
          )}
        </div>

        <div className={destaque ? "flex flex-col sm:flex-1 sm:justify-end sm:pb-2" : "contents"}>
          <Titulo
            className={`mt-3 font-display leading-[1.12] text-balance ${
              destaque ? "text-3xl sm:text-4xl" : "line-clamp-2 text-lg"
            }`}
          >
            {product.name}
          </Titulo>
          <p className={`numeros mt-1.5 ${destaque ? "text-base" : "text-sm"}`}>
            <span className={suave}>a partir de </span>
            {/* Na cartela da vez o preço é parte da peça, em Prata; nas pequenas fica em Jost tabular. */}
            <span className={destaque ? "font-display text-2xl" : "font-medium"}>{formatPrice(product.priceFrom)}</span>
          </p>

          {product.colors.length > 0 && (
            <ul className="mt-2.5 flex items-center gap-1.5" aria-label={`Acabamentos: ${product.colors.map((c) => c.name).join(", ")}`}>
              {product.colors.slice(0, MAX_SWATCHES).map((color) => (
                <li
                  key={color.id}
                  title={color.name}
                  className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {extraColors > 0 && <li className={`numeros text-xs ${suave}`}>+{extraColors}</li>}
            </ul>
          )}

          {/* Lugar do "Adicionar à sacola", que fica fora do link da cartela (ProductGrid). */}
          {destaque && <span aria-hidden="true" className="mt-4 block min-h-11 sm:mt-8" />}
        </div>

        <Relevo className={grafite ? "text-prata/30" : undefined} />
      </Brilho>
    </Link>
  );
}

/** Esqueleto de carregamento no formato da cartela, nunca um spinner (specs/26 §5). */
export function CartelaEsqueleto() {
  return (
    <div aria-hidden="true" className={`cartela rounded-[3px] p-3 pb-4 ${sombraCartela}`}>
      <div className="aspect-[4/5] animate-pulse bg-linha/60 motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-3/4 bg-linha/60" />
      <div className="mt-2 h-3 w-1/3 bg-linha/60" />
    </div>
  );
}

/**
 * Cartela sem peça: o estado vazio da vitrine (specs/26 §5). Os dois furos vazios são os da peça que não está
 * ali, a mesma linguagem do esgotado.
 */
export function CartelaVazia({ message, action }: { message: string; action?: { href: string; label: string } }) {
  return (
    <div className={`cartela relative mx-auto max-w-sm rounded-[3px] px-6 pb-8 pt-8 text-center ${sombraCartela}`}>
      <div aria-hidden="true" className="mx-auto flex w-24 justify-between">
        <span className="size-3 rounded-full bg-vitrine-funda shadow-[inset_0_1px_2px_rgb(74_40_44/0.45)]" />
        <span className="size-3 rounded-full bg-vitrine-funda shadow-[inset_0_1px_2px_rgb(74_40_44/0.45)]" />
      </div>
      <p className="mt-6 font-display text-xl leading-snug text-balance">{message}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-block text-sm font-medium underline">
          {action.label}
        </Link>
      )}
      <Relevo />
    </div>
  );
}

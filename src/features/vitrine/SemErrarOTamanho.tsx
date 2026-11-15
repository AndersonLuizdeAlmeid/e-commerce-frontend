import { GuiaDoColar } from "./GuiaDoColar";
import { AnelComAro, ChamadaDoMedidor } from "./MedidorDeAro";

/** Comprimentos mais comuns de colar; na página da peça o guia usa os comprimentos reais dela. */
const COMPRIMENTOS = [40, 45, 50, 60];

/**
 * As duas dúvidas que travam a compra de semijoia pela internet, resolvidas na própria loja: o aro do anel (medido
 * na tela) e onde o colar cai (no desenho).
 */
export function SemErrarOTamanho() {
  return (
    <section aria-labelledby="tamanho-titulo" className="vitrine">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h2 id="tamanho-titulo" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
            Sem errar o tamanho
          </h2>
          <p className="mt-3 text-vitrine-texto sm:text-lg">Descubra o seu aro com um anel que você já tem e veja onde cada colar cai, antes de comprar.</p>
        </div>

        <div className="mt-12 grid items-start gap-x-16 gap-y-14 lg:grid-cols-2">
          <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr] lg:pt-10">
            <div className="mx-auto w-48 px-3 sm:w-56">
              <AnelComAro />
            </div>
            <div>
              <h3 className="font-display text-2xl leading-tight sm:text-3xl">O seu aro, na tela</h3>
              <p className="mt-2 max-w-sm text-vitrine-texto">
                Encoste um anel que serve no dedo na tela do celular. A loja diz o aro, guarda e já deixa marcado em todos os anéis.
              </p>
              <ChamadaDoMedidor className="botao botao-tinta mt-5" />
            </div>
          </div>

          <div className="border-t border-[var(--fio-ouro)] pt-12 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <h3 className="font-display text-2xl leading-tight sm:text-3xl">Onde o colar cai</h3>
            <p className="mt-2 max-w-sm text-vitrine-texto">Toque num comprimento para ver a altura dele no colo.</p>
            <GuiaDoColar comprimentos={COMPRIMENTOS} className="mt-6" />
          </div>
        </div>
      </div>
    </section>
  );
}

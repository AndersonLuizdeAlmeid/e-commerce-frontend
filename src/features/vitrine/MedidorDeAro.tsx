"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { whatsappUrl } from "@/shared/lib/site";
import { CheckIcon, CloseIcon, PlusIcon, RulerIcon } from "@/shared/ui/icons";
import { ARO_MAXIMO, ARO_MINIMO, CARTAO_MM, diametroDoAro, medidas, useMedidas } from "./medidas";

interface MedidorValue {
  abrir: () => void;
}

const MedidorContext = createContext<MedidorValue>({ abrir: () => undefined });

export function useMedidor(): MedidorValue {
  return useContext(MedidorContext);
}

/** Pixels de CSS por milímetro antes da calibração: celular (~6) ou monitor (96 dpi nominais). */
function palpiteDeTela(): number {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 6.1 : 3.78;
}

const PX_MM_MINIMO = 2.6;
const PX_MM_MAXIMO = 7.2;
const ARO_PADRAO = 16;

/**
 * Medidor de aro na tela: a cliente ajusta a tela com um cartão (o lado menor mede 53,98 mm em qualquer cartão de
 * banco), encosta um anel que serve e a loja diz o aro. O aro fica guardado neste aparelho e já vem marcado nos anéis.
 */
export function MedidorProvider({ children, aneisHref }: { children: ReactNode; aneisHref?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sessao, setSessao] = useState(0);

  const abrir = useCallback(() => {
    setSessao((atual) => atual + 1);
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <MedidorContext.Provider value={{ abrir }}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="medidor-titulo"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="painel cartela fixed inset-x-0 bottom-0 top-auto m-0 max-h-[94dvh] w-full max-w-none overflow-y-auto rounded-t-[14px] p-0 text-tinta shadow-[0_-20px_60px_-30px_rgb(var(--sombra)/0.6)] sm:inset-0 sm:m-auto sm:h-fit sm:max-w-[28rem] sm:rounded-[6px] sm:shadow-[0_40px_80px_-40px_rgb(var(--sombra)/0.7)]"
      >
        {/* Só existe depois do primeiro toque: o palpite de tela depende do aparelho e não pode vir do servidor. */}
        {sessao > 0 && <Medidor key={sessao} fechar={() => dialog.current?.close()} aneisHref={aneisHref} />}
      </dialog>
    </MedidorContext.Provider>
  );
}

function Medidor({ fechar, aneisHref }: { fechar: () => void; aneisHref?: string }) {
  const guardadas = useMedidas();
  const [passo, setPasso] = useState<"tela" | "anel" | "pronto" | null>(null);
  const [pxPorMmEscolhido, setPxPorMm] = useState<number | null>(null);
  const [aroEscolhido, setAro] = useState<number | null>(null);

  const pxPorMm = pxPorMmEscolhido ?? guardadas.pxPorMm ?? palpiteDeTela();
  const aro = aroEscolhido ?? guardadas.aro ?? ARO_PADRAO;
  const etapa = passo ?? (guardadas.pxPorMm ? "anel" : "tela");
  const diametro = diametroDoAro(aro);
  const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function mudarAro(valor: number) {
    setAro(Math.min(ARO_MAXIMO, Math.max(ARO_MINIMO, valor)));
  }

  return (
    <div className="px-5 pb-6 pt-3 sm:px-7 sm:pb-7 sm:pt-5">
      <div className="flex items-start justify-between gap-4">
        <h2 id="medidor-titulo" className="pt-2 font-display text-2xl leading-tight">
          {etapa === "tela" ? "Primeiro, a sua tela" : etapa === "anel" ? "Agora, o anel" : `Seu aro é ${aro}`}
        </h2>
        <button type="button" onClick={fechar} aria-label="Fechar o medidor" className="controle -mr-2 border-transparent bg-transparent">
          <CloseIcon />
        </button>
      </div>

      {etapa === "tela" && (
        <>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-tinta-suave">
            Encoste o <strong className="font-medium text-tinta">lado menor</strong> de um cartão (de banco, CNH, crachá) na barra e ajuste até a barra ficar do tamanho dele.
          </p>
          <div className="mt-6 overflow-hidden py-3">
            <div
              aria-hidden="true"
              className="relative h-14 rounded-[3px] bg-tinta shadow-[inset_0_0_0_1px_rgb(201_162_107/0.55),0_14px_24px_-16px_rgb(var(--sombra)/0.6)]"
              style={{ width: `${pxPorMm * CARTAO_MM}px` }}
            >
              <span className="absolute inset-y-2 left-2 w-px bg-ouro-claro/70" />
              <span className="absolute inset-y-2 right-2 w-px bg-ouro-claro/70" />
              <span className="absolute inset-0 grid place-items-center text-xs uppercase tracking-[0.2em] text-ouro-claro">lado menor do cartão</span>
            </div>
          </div>
          <Ajuste
            rotulo="Tamanho da barra"
            valor={pxPorMm}
            minimo={PX_MM_MINIMO}
            maximo={PX_MM_MAXIMO}
            passo={0.01}
            passoFino={0.02}
            texto={`${numero.format(pxPorMm * CARTAO_MM)} pontos de tela`}
            onChange={setPxPorMm}
          />
          <button
            type="button"
            onClick={() => {
              medidas.guardar({ pxPorMm });
              setPasso("anel");
            }}
            className="botao botao-tinta mt-6 w-full"
          >
            Ficou do tamanho do cartão
          </button>
        </>
      )}

      {etapa === "anel" && (
        <>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-tinta-suave">
            Coloque sobre o círculo um anel que serve no dedo e ajuste até o círculo encostar na <strong className="font-medium text-tinta">borda de dentro</strong> dele.
          </p>
          <div className="mt-5 grid place-items-center overflow-hidden rounded-[4px] bg-vitrine py-6 shadow-[inset_0_0_0_1px_var(--fio-ouro)]" style={{ minHeight: `${diametroDoAro(ARO_MAXIMO) * pxPorMm + 56}px` }}>
            <div
              aria-hidden="true"
              className="relative rounded-full bg-cartela shadow-[0_0_0_2px_var(--color-tinta),0_0_0_3px_var(--color-ouro),0_18px_30px_-18px_rgb(var(--sombra)/0.7)]"
              style={{ width: `${diametro * pxPorMm}px`, height: `${diametro * pxPorMm}px` }}
            >
              <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--fio-ouro)]" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--fio-ouro)]" />
            </div>
          </div>
          <p aria-live="polite" className="numeros mt-4 flex items-baseline justify-between gap-4">
            <span className="font-display text-4xl leading-none">Aro {aro}</span>
            <span className="text-sm text-tinta-suave">{numero.format(diametro)} mm por dentro</span>
          </p>
          <Ajuste rotulo="Aro" valor={aro} minimo={ARO_MINIMO} maximo={ARO_MAXIMO} passo={1} passoFino={1} texto={`aro ${aro}`} onChange={(valor) => mudarAro(Math.round(valor))} />
          <button
            type="button"
            onClick={() => {
              medidas.guardar({ aro, pxPorMm });
              setPasso("pronto");
            }}
            className="botao botao-tinta mt-6 w-full"
          >
            Guardar o aro {aro}
          </button>
          <button type="button" onClick={() => setPasso("tela")} className="link-ouro mx-auto mt-3 flex min-h-11 items-center text-sm">
            Ajustar a tela de novo
          </button>
        </>
      )}

      {etapa === "pronto" && (
        <>
          <p className="mt-2 flex items-start gap-3 text-[0.9375rem] leading-relaxed text-tinta-suave">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-tinta text-ouro-claro">
              <CheckIcon width={16} height={16} />
            </span>
            Guardado neste aparelho. Nos anéis da loja, o aro {aro} já vem marcado para você.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-tinta-suave">
            A medida na tela é uma boa aproximação. Se o anel ficou entre dois círculos, fique com o maior, ou{" "}
            <a href={whatsappUrl(`Olá! Medi meu aro no site da MO e deu ${aro}. Pode me ajudar a confirmar?`)} target="_blank" rel="noopener noreferrer" className="link-ouro">
              confirme com a MO
              <span className="sr-only"> pelo WhatsApp (abre em outra aba)</span>
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {aneisHref && (
              <Link href={aneisHref} onClick={fechar} className="botao botao-tinta flex-1">
                Ver anéis no meu aro
              </Link>
            )}
            <button type="button" onClick={() => setPasso("anel")} className="botao botao-fio flex-1">
              Medir de novo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Ajuste({
  rotulo,
  valor,
  minimo,
  maximo,
  passo,
  passoFino,
  texto,
  onChange,
}: {
  rotulo: string;
  valor: number;
  minimo: number;
  maximo: number;
  passo: number;
  passoFino: number;
  texto: string;
  onChange: (valor: number) => void;
}) {
  const limitar = (novo: number) => onChange(Math.min(maximo, Math.max(minimo, novo)));
  return (
    <div className="mt-3 flex items-center gap-2">
      <button type="button" onClick={() => limitar(valor - passoFino)} aria-label={`Diminuir: ${rotulo.toLowerCase()}`} className="controle">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <input
        type="range"
        aria-label={rotulo}
        aria-valuetext={texto}
        min={minimo}
        max={maximo}
        step={passo}
        value={valor}
        onChange={(event) => limitar(Number(event.target.value))}
        className="deslizante"
      />
      <button type="button" onClick={() => limitar(valor + passoFino)} aria-label={`Aumentar: ${rotulo.toLowerCase()}`} className="controle">
        <PlusIcon width={18} height={18} />
      </button>
    </div>
  );
}

/** Chamada do medidor em qualquer página: mostra o aro guardado, quando há. */
export function ChamadaDoMedidor({ className = "botao botao-tinta" }: { className?: string }) {
  const { abrir } = useMedidor();
  const { aro } = useMedidas();
  return (
    <button type="button" onClick={abrir} className={className}>
      <RulerIcon />
      {aro ? `Seu aro é ${aro}: medir de novo` : "Medir meu aro na tela"}
    </button>
  );
}

/** O anel desenhado com o aro da cliente dentro (ou o convite para medir). */
export function AnelComAro() {
  const { aro } = useMedidas();
  return (
    <div className="relative grid aspect-square w-full max-w-[15rem] place-items-center rounded-full bg-cartela shadow-[0_0_0_10px_var(--color-vitrine-funda),0_0_0_11px_var(--fio-ouro),inset_0_0_0_1px_var(--fio-ouro),0_40px_60px_-36px_rgb(var(--sombra)/0.7)]">
      <span aria-hidden="true" className="absolute inset-x-6 top-1/2 h-px bg-[var(--fio-ouro)]" />
      <span aria-hidden="true" className="absolute inset-y-6 left-1/2 w-px bg-[var(--fio-ouro)]" />
      <p className="numeros relative bg-cartela px-3 text-center leading-none">
        <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-tinta-suave">{aro ? "seu aro" : "aro"}</span>
        <span className="mt-1 block font-display text-6xl">{aro ?? "?"}</span>
      </p>
    </div>
  );
}

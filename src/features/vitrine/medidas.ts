"use client";

import { useSyncExternalStore } from "react";

/**
 * As medidas da cliente: o aro que ela mediu na tela e a calibração da tela. Ficam só neste navegador
 * (localStorage); a loja usa o aro para já marcar o tamanho dela nos anéis.
 *
 * Aro brasileiro: o número é a circunferência interna em milímetros menos 40 (aro 16 = 56 mm = 17,8 mm de diâmetro).
 */
export const ARO_MINIMO = 8;
export const ARO_MAXIMO = 35;
/** Lado menor de um cartão de banco, CNH ou crachá no padrão ISO/IEC 7810 ID-1 (53,98 mm): cabe em qualquer celular. */
export const CARTAO_MM = 53.98;

export function aroDoDiametro(diametroMm: number): number {
  return Math.round(Math.PI * diametroMm - 40);
}

export function diametroDoAro(aro: number): number {
  return (aro + 40) / Math.PI;
}

/** "16" → 16; "40 cm" → null. Só nomes de tamanho que são um número de aro. */
export function aroDoNome(nome: string): number | null {
  const texto = nome.trim();
  if (!/^\d{1,2}$/.test(texto)) return null;
  const aro = Number(texto);
  return aro >= ARO_MINIMO && aro <= ARO_MAXIMO ? aro : null;
}

/** O rótulo de tamanho da categoria diz se a medida é aro (anéis) ou comprimento (colares). */
export function tipoDeMedida(rotulo: string): "aro" | "comprimento" | "outra" {
  const texto = rotulo.trim().toLowerCase();
  if (texto === "aro") return "aro";
  if (texto === "comprimento") return "comprimento";
  return "outra";
}

/** "45 cm" → 45. */
export function centimetrosDoNome(nome: string): number | null {
  const match = /^(\d{2,3})\s*cm$/i.exec(nome.trim());
  return match ? Number(match[1]) : null;
}

interface Medidas {
  aro: number | null;
  /** Pixels de CSS por milímetro, da calibração com o cartão. */
  pxPorMm: number | null;
}

const CHAVE = "mo:medidas";
const VAZIAS: Medidas = { aro: null, pxPorMm: null };
const ouvintes = new Set<() => void>();
let cache: { texto: string | null; valor: Medidas } = { texto: null, valor: VAZIAS };

function ler(): Medidas {
  let texto: string | null = null;
  try {
    texto = window.localStorage.getItem(CHAVE);
  } catch {
    return VAZIAS;
  }
  if (texto === cache.texto) return cache.valor;
  let valor = VAZIAS;
  try {
    const bruto = texto ? (JSON.parse(texto) as Partial<Medidas>) : {};
    valor = {
      aro: typeof bruto.aro === "number" && bruto.aro >= ARO_MINIMO && bruto.aro <= ARO_MAXIMO ? Math.round(bruto.aro) : null,
      pxPorMm: typeof bruto.pxPorMm === "number" && bruto.pxPorMm > 1 && bruto.pxPorMm < 20 ? bruto.pxPorMm : null,
    };
  } catch {
    valor = VAZIAS;
  }
  cache = { texto, valor };
  return valor;
}

export const medidas = {
  subscribe(ouvinte: () => void) {
    ouvintes.add(ouvinte);
    window.addEventListener("storage", ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
      window.removeEventListener("storage", ouvinte);
    };
  },
  getSnapshot: ler,
  getServerSnapshot: () => VAZIAS,
  guardar(novas: Partial<Medidas>) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({ ...ler(), ...novas }));
    } catch {
      // Sem armazenamento (navegação privada): a medida vale só enquanto o medidor está aberto.
    }
    ouvintes.forEach((ouvinte) => ouvinte());
  },
};

export function useMedidas(): Medidas {
  return useSyncExternalStore(medidas.subscribe, medidas.getSnapshot, medidas.getServerSnapshot);
}

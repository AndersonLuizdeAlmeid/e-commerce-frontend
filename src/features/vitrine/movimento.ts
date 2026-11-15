"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Decisão da MO (rodadas A4/A5): a vitrine se move para todo mundo. Com "reduzir movimento" ela anda mais devagar
 * e sempre com um botão de pausar à vista.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

function subscribeVisibility(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}

function usePaginaVisivel(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

/** Chama `callback` a cada `ms` enquanto `ativo` e a aba está visível. Sempre usa a versão mais nova do callback. */
export function useIntervalo(callback: () => void, ms: number, ativo: boolean) {
  const atual = useRef(callback);
  const visivel = usePaginaVisivel();

  useEffect(() => {
    atual.current = callback;
  });

  useEffect(() => {
    if (!ativo || !visivel) return;
    const id = window.setInterval(() => atual.current(), ms);
    return () => window.clearInterval(id);
  }, [ativo, visivel, ms]);
}

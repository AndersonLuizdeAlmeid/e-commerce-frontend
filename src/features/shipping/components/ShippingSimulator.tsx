"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { whatsappUrl } from "@/shared/lib/site";
import { deliveryLabel, isCompletePostalCode, maskPostalCode, rememberPostalCode, rememberedPostalCode, shippingApi, type ShippingItem, type ShippingQuotes } from "../api";

const subscribeNever = () => () => undefined;

interface ShippingSimulatorProps {
  /** Nulo enquanto falta escolher a peça. */
  items: ShippingItem[] | null;
  pendingHint?: string;
  /** Com CEP lembrado, já mostra o frete ao abrir e refaz quando as peças mudam (sacola). */
  auto?: boolean;
  id: string;
}

type Failure = { kind: "not-configured" } | { kind: "message"; text: string };

/** RF-032: frete por CEP, no produto e na sacola. O valor vem sempre da API, calculado com os dados dela. */
export function ShippingSimulator({ items, pendingHint, auto = false, id }: ShippingSimulatorProps) {
  const remembered = useSyncExternalStore(subscribeNever, rememberedPostalCode, () => "");
  const [typed, setTyped] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; quotes: ShippingQuotes } | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, setPending] = useState(false);
  const request = useRef(0);

  const postalCode = typed ?? remembered;
  const itemsKey = items ? JSON.stringify(items) : null;
  // Cotação de outras peças não vale: mudou a peça ou a quantidade, o valor mostrado some.
  const quotes = result && result.key === itemsKey ? result.quotes : null;

  /** Só a resposta mais recente vale: a anterior pode chegar depois e mostraria o frete de outra quantidade. */
  const quote = useCallback((code: string, lines: ShippingItem[], key: string) => {
    const current = ++request.current;
    const isLatest = () => current === request.current;
    return shippingApi.quote(code, lines).then(
      (response) => {
        if (isLatest()) {
          setFailure(null);
          setResult({ key, quotes: response });
          setPending(false);
        }
      },
      (error: unknown) => {
        if (isLatest()) {
          setResult(null);
          setFailure(
            error instanceof ApiError && error.problem?.code === "Shipping.NotConfigured"
              ? { kind: "not-configured" }
              : { kind: "message", text: errorMessage(error, "Não foi possível calcular o frete agora.") },
          );
          setPending(false);
        }
      },
    );
  }, []);

  useEffect(() => {
    if (auto && itemsKey && items && items.length > 0 && isCompletePostalCode(remembered)) {
      void quote(remembered, items, itemsKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `items` muda junto com `itemsKey`, que evita refazer à toa.
  }, [auto, itemsKey, remembered, quote]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCompletePostalCode(postalCode)) {
      setResult(null);
      setFailure({ kind: "message", text: "Informe os 8 números do CEP." });
      return;
    }
    if (items && itemsKey) {
      rememberPostalCode(postalCode);
      setFailure(null);
      setPending(true);
      void quote(postalCode, items, itemsKey);
    }
  }

  const inputId = `cep-${id}`;
  const canQuote = items !== null && items.length > 0;

  return (
    <section aria-labelledby={`${inputId}-titulo`}>
      <h2 id={`${inputId}-titulo`} className="text-xs font-medium uppercase tracking-[0.16em]">Calcular o frete</h2>
      <form onSubmit={submit} noValidate className="mt-2 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">CEP</label>
          <input
            id={inputId}
            value={postalCode}
            onChange={(event) => setTyped(maskPostalCode(event.target.value))}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            aria-invalid={failure?.kind === "message" ? true : undefined}
            className="numeros block min-h-11 w-full border-b border-current/40 bg-transparent py-2 text-base placeholder:opacity-60 focus-visible:border-current focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!canQuote || pending}
          aria-busy={pending}
          className="min-h-11 shrink-0 border border-current/40 px-4 text-sm font-medium transition-colors hover:border-current disabled:opacity-50"
        >
          {pending ? "Calculando…" : "Calcular"}
        </button>
      </form>

      {!canQuote && pendingHint && <p className="mt-2 text-sm opacity-80">{pendingHint}</p>}

      <div aria-live="polite" className="mt-3 text-sm empty:hidden">
        {failure?.kind === "message" && <p role="alert" className="font-medium">{failure.text}</p>}
        {failure?.kind === "not-configured" && (
          <p>
            <a href={whatsappUrl("Olá! Gostaria de saber o frete para o meu CEP.")} target="_blank" rel="noopener noreferrer" className="font-medium underline">
              Fale com a MO para saber o frete
            </a>
            <span className="sr-only"> (abre em outra aba)</span>
          </p>
        )}
        {quotes && (
          <>
            <ul className="divide-y divide-current/15">
              {quotes.options.map((option) => (
                <li key={option.serviceCode} className="flex items-baseline justify-between gap-4 py-2">
                  <span>
                    <span className="font-medium">{option.name}</span>
                    <span className="numeros ml-2 opacity-80">{deliveryLabel(option.deliveryDays)}</span>
                  </span>
                  <span className="numeros text-right">
                    {option.price !== option.originalPrice && (
                      <span className="mr-2 opacity-70">
                        <span className="sr-only">de </span>
                        <s>{formatPrice(option.originalPrice)}</s>
                        <span className="sr-only"> por </span>
                      </span>
                    )}
                    <span className="font-medium">{option.price === 0 ? "Grátis" : formatPrice(option.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
            {quotes.freeShippingRemaining !== null && (
              <p className="numeros mt-1 font-medium">Faltam {formatPrice(quotes.freeShippingRemaining)} para frete grátis.</p>
            )}
            {quotes.isFallback && <p className="mt-1 text-xs opacity-80">Valor estimado: não conseguimos consultar os Correios agora.</p>}
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addressesApi, type Address } from "@/features/addresses/api";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import { emptyAddressFields, formatAddressLine, formatAddressPlace, toAddressRequest } from "@/features/addresses/address-fields";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCart } from "@/features/cart/CartProvider";
import { deliveryLabel, shippingApi, type ShippingQuotes } from "@/features/shipping/api";
import { ApiError } from "@/shared/api/client";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert, primaryButtonClass } from "@/shared/ui/form";
import { ordersApi, type OutOfStockItem } from "../api";
import { GIFT_MESSAGE_MAX_LENGTH, giftMessageProblem } from "../gift";

type Step = "address" | "shipping" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "address", label: "Endereço" },
  { id: "shipping", label: "Envio" },
  { id: "review", label: "Revisão" },
];

const linkButton = "inline-flex min-h-11 items-center text-sm font-medium underline hover:text-tinta-suave";

/**
 * Checkout (RF-040, RF-047; arquivo 26 §4.6): um passo por tela, com o resumo recolhível no topo. Os valores da tela
 * são só uma prévia: o servidor recalcula frete e total ao criar o pedido.
 */
export function CheckoutFlow() {
  const { status, user } = useAuth();
  const { mode, customerCart, refresh } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuotes | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [wrapPrice, setWrapPrice] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<{ text: string; outOfStock?: OutOfStockItem[] } | null>(null);
  const [giftError, setGiftError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>("");

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/checkout");
    }
  }, [status, router]);

  const isCustomer = status === "authenticated" && user?.role !== "Admin";

  useEffect(() => {
    if (!isCustomer) {
      return;
    }
    let active = true;
    addressesApi
      .list()
      .then((loaded) => {
        if (!active) {
          return;
        }
        setAddresses(loaded);
        setAddressId((current) => current ?? loaded.find((address) => address.isDefault)?.id ?? null);
      })
      .catch(() => active && setAddresses([]));
    ordersApi
      .settings()
      .then((settings) => active && setWrapPrice(settings.giftWrapPrice))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isCustomer]);

  const items = useMemo(() => customerCart?.items ?? [], [customerCart]);
  const address = addresses?.find((candidate) => candidate.id === addressId) ?? null;
  const selected = quotes?.options.find((option) => option.serviceCode === service) ?? null;
  const wrapCost = isGift && giftWrap ? wrapPrice : 0;
  const total = (customerCart?.subtotal ?? 0) + (selected?.price ?? 0) + wrapCost;

  // A cotação depende do endereço e das peças; muda um dos dois, cota de novo.
  useEffect(() => {
    if (step !== "shipping" || !address || items.length === 0) {
      return;
    }
    let active = true;
    shippingApi
      .quote(address.postalCode, items.map(({ variantId, quantity }) => ({ variantId, quantity })))
      .then((loaded) => {
        if (!active) {
          return;
        }
        setQuotes(loaded);
        setQuoteError(null);
        setService((current) => (loaded.options.some((option) => option.serviceCode === current) ? current : (loaded.options[0]?.serviceCode ?? null)));
      })
      .catch((err: unknown) => active && setQuoteError(errorMessage(err, "Não foi possível calcular o frete agora.")));
    return () => {
      active = false;
    };
  }, [step, address, items]);

  if (status !== "authenticated" || !user) {
    return <p className="text-tinta-suave">Carregando…</p>;
  }

  if (user.role === "Admin" || mode !== "customer") {
    return <FormAlert kind="info">Esta é uma conta de administrador, que não faz compras pela loja.</FormAlert>;
  }

  if (!user.emailConfirmed) {
    return (
      <FormAlert kind="info">
        Confirme seu e-mail para finalizar a compra. O link está na sua caixa de entrada;{" "}
        <Link href="/conta" className="font-medium underline">
          reenvie em Minha conta
        </Link>
        .
      </FormAlert>
    );
  }

  if (!customerCart || addresses === null) {
    return <p className="text-tinta-suave">Preparando o checkout…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p>Sua sacola está vazia.</p>
        <Link href="/" className={primaryButtonClass}>
          Ver novidades
        </Link>
      </div>
    );
  }

  if (items.some((item) => item.status !== "Available")) {
    return (
      <FormAlert kind="info">
        Algumas peças da sacola mudaram de disponibilidade.{" "}
        <Link href="/carrinho" className="font-medium underline">
          Ajuste a sacola
        </Link>{" "}
        para seguir.
      </FormAlert>
    );
  }

  async function place() {
    const problem = isGift ? giftMessageProblem(giftMessage) : null;
    setGiftError(problem);
    if (problem || !address || !service) {
      return;
    }

    idempotencyKey.current ||= crypto.randomUUID();
    setPlacing(true);
    setPlaceError(null);
    try {
      const placed = await ordersApi.place(
        {
          addressId: address.id,
          shippingServiceCode: service,
          gift: isGift ? { wrap: giftWrap, message: giftMessage.trim() || null } : null,
        },
        idempotencyKey.current,
      );
      await refresh();
      router.replace(`/conta/pedidos/${placed.id}?novo=1`);
    } catch (err) {
      // Erro de regra: nada foi gravado, então a próxima tentativa é um pedido novo.
      idempotencyKey.current = "";
      const problem = err instanceof ApiError ? err.problem : null;
      const code = (problem as { code?: string } | null)?.code;
      if (code === "Ordering.OutOfStock") {
        const outOfStock = ((problem as { items?: OutOfStockItem[] }).items ?? []) as OutOfStockItem[];
        setPlaceError({ text: "Algumas peças acabaram enquanto você comprava.", outOfStock });
        void refresh();
      } else if (code === "Ordering.ShippingServiceUnavailable") {
        setPlaceError({ text: errorMessage(err) });
        setStep("shipping");
      } else {
        const fields = fieldErrors(err);
        setGiftError(fields.giftMessage ?? null);
        setPlaceError({ text: errorMessage(err) });
      }
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-8">
      <OrderSummary items={items} subtotal={customerCart.subtotal} shipping={selected?.price ?? null} wrap={wrapCost} total={total} />

      <ol className="flex gap-6 border-b border-linha text-sm" aria-label="Passos do checkout">
        {STEPS.map((candidate, index) => {
          const current = candidate.id === step;
          const done = STEPS.findIndex((other) => other.id === step) > index;
          return (
            <li key={candidate.id} aria-current={current ? "step" : undefined} className={`-mb-px border-b-2 pb-2 ${current ? "border-folha font-medium" : "border-transparent text-tinta-suave"}`}>
              {done ? (
                <button type="button" className="underline" onClick={() => setStep(candidate.id)}>
                  {candidate.label}
                </button>
              ) : (
                candidate.label
              )}
            </li>
          );
        })}
      </ol>

      {step === "address" && (
        <section aria-labelledby="passo-endereco" className="space-y-6">
          <h2 id="passo-endereco" className="font-display text-2xl leading-tight">
            Onde vamos entregar?
          </h2>

          {addingAddress || addresses.length === 0 ? (
            <AddressForm
              initial={emptyAddressFields}
              submitLabel="Usar este endereço"
              showDefaultOption={addresses.length > 0}
              onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
              onSubmit={async (fields, isDefault) => {
                const created = await addressesApi.create(toAddressRequest(fields, isDefault));
                setAddresses(await addressesApi.list());
                setAddressId(created.id);
                setAddingAddress(false);
                setStep("shipping");
              }}
            />
          ) : (
            <>
              <fieldset className="space-y-3">
                <legend className="sr-only">Endereços guardados</legend>
                {addresses.map((candidate) => (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer gap-3 border p-4 ${candidate.id === addressId ? "border-tinta" : "border-linha hover:border-tinta/40"}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={candidate.id}
                      checked={candidate.id === addressId}
                      onChange={() => setAddressId(candidate.id)}
                      className="mt-1 size-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{candidate.recipient}</span>
                      <span className="block text-sm">{formatAddressLine({ ...candidate, complement: candidate.complement ?? "" })}</span>
                      <span className="block text-sm text-tinta-suave">{formatAddressPlace(candidate)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <button type="button" className={linkButton} onClick={() => setAddingAddress(true)}>
                Entregar em outro endereço
              </button>
              <button type="button" disabled={!addressId} onClick={() => setStep("shipping")} className={primaryButtonClass}>
                Continuar
              </button>
            </>
          )}
        </section>
      )}

      {step === "shipping" && address && (
        <section aria-labelledby="passo-envio" className="space-y-6">
          <h2 id="passo-envio" className="font-display text-2xl leading-tight">
            Como prefere receber?
          </h2>
          <p className="text-sm text-tinta-suave">
            Para {address.recipient}, {formatAddressPlace(address)}.{" "}
            <button type="button" className="font-medium text-tinta underline" onClick={() => setStep("address")}>
              Alterar
            </button>
          </p>

          {placeError && step === "shipping" && <FormAlert kind="error">{placeError.text}</FormAlert>}
          {quoteError ? (
            <FormAlert kind="error">{quoteError}</FormAlert>
          ) : !quotes ? (
            <p role="status" className="text-sm text-tinta-suave">
              Calculando o frete…
            </p>
          ) : (
            <fieldset className="space-y-3">
              <legend className="sr-only">Opções de frete</legend>
              {quotes.options.map((option) => (
                <label
                  key={option.serviceCode}
                  className={`flex cursor-pointer items-center gap-3 border p-4 ${option.serviceCode === service ? "border-tinta" : "border-linha hover:border-tinta/40"}`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={option.serviceCode}
                    checked={option.serviceCode === service}
                    onChange={() => setService(option.serviceCode)}
                    className="size-4 shrink-0"
                  />
                  <span className="flex-1">
                    <span className="block font-medium">{option.name}</span>
                    <span className="block text-sm text-tinta-suave">{deliveryLabel(option.deliveryDays ?? null)}</span>
                  </span>
                  <span className="numeros text-right">
                    {option.price < option.originalPrice && <s className="block text-xs text-tinta-suave">{formatPrice(option.originalPrice)}</s>}
                    {option.price === 0 ? "Grátis" : formatPrice(option.price)}
                  </span>
                </label>
              ))}
              {quotes.isFallback && <p className="text-sm text-tinta-suave">Valores de referência: o prazo é confirmado depois do pagamento.</p>}
            </fieldset>
          )}

          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              setPlaceError(null);
              setStep("review");
            }}
            className={primaryButtonClass}
          >
            Continuar
          </button>
        </section>
      )}

      {step === "review" && address && selected && (
        <section aria-labelledby="passo-revisao" className="space-y-6">
          <h2 id="passo-revisao" className="font-display text-2xl leading-tight">
            Confira antes de fechar
          </h2>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.16em]">Entrega</dt>
              <dd className="mt-1">
                {address.recipient} · {formatAddressLine({ ...address, complement: address.complement ?? "" })}
                <br />
                <span className="text-tinta-suave">{formatAddressPlace(address)}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.16em]">Frete</dt>
              <dd className="mt-1">
                {selected.name} · {deliveryLabel(selected.deliveryDays ?? null)} · {selected.price === 0 ? "grátis" : formatPrice(selected.price)}{" "}
                <button type="button" className="font-medium underline" onClick={() => setStep("shipping")}>
                  Alterar
                </button>
              </dd>
            </div>
          </dl>

          <fieldset className="space-y-4 border-t border-linha pt-6">
            <legend className="font-display text-xl leading-tight">Presente</legend>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={isGift} onChange={(event) => setIsGift(event.target.checked)} className="size-4" />
              É para presentear alguém
            </label>
            {isGift && (
              <>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input type="checkbox" checked={giftWrap} onChange={(event) => setGiftWrap(event.target.checked)} className="size-4" />
                  Embalar para presente ({wrapPrice === 0 ? "grátis" : `+ ${formatPrice(wrapPrice)}`})
                </label>
                <div>
                  <label htmlFor="dedicatoria" className="block text-xs font-medium uppercase tracking-[0.16em]">
                    Dedicatória
                  </label>
                  <textarea
                    id="dedicatoria"
                    rows={4}
                    maxLength={GIFT_MESSAGE_MAX_LENGTH + 20}
                    value={giftMessage}
                    onChange={(event) => {
                      setGiftMessage(event.target.value);
                      setGiftError(null);
                    }}
                    aria-invalid={giftError ? true : undefined}
                    aria-describedby="dedicatoria-dica"
                    className={`mt-1 block w-full border bg-transparent p-3 text-base focus-visible:outline-none ${giftError ? "border-alerta" : "border-tinta/40 focus-visible:border-tinta"}`}
                  />
                  <p id="dedicatoria-dica" className={`mt-1.5 text-xs ${giftError ? "text-sm text-alerta" : "text-tinta-suave"}`}>
                    {giftError ?? `Opcional. ${giftMessage.trim().length}/${GIFT_MESSAGE_MAX_LENGTH} caracteres, até 6 linhas.`}
                  </p>
                </div>
              </>
            )}
          </fieldset>

          {placeError && (
            <FormAlert kind="error">
              <p>{placeError.text}</p>
              {placeError.outOfStock && placeError.outOfStock.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {placeError.outOfStock.map((item) => (
                    <li key={item.variantId}>
                      {item.productName}: {item.available === 0 ? "esgotou" : `restam ${item.available}`}
                    </li>
                  ))}
                </ul>
              )}
              {placeError.outOfStock && (
                <Link href="/carrinho" className="mt-2 inline-block font-medium underline">
                  Voltar à sacola
                </Link>
              )}
            </FormAlert>
          )}

          <div className="space-y-2">
            <button type="button" onClick={() => void place()} disabled={placing} aria-busy={placing} className={primaryButtonClass}>
              {placing ? "Fechando o pedido…" : `Fazer pedido · ${formatPrice(total)}`}
            </button>
            <p className="text-center text-xs text-tinta-suave">As peças ficam separadas para você por 48 horas, até o pagamento.</p>
          </div>
        </section>
      )}
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shipping,
  wrap,
  total,
}: {
  items: { variantId: string; productName: string; quantity: number; lineTotal: number; colorName: string | null; sizeName: string | null }[];
  subtotal: number;
  shipping: number | null;
  wrap: number;
  total: number;
}) {
  const pieces = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <details className="group border border-linha">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-sm">
        <span>
          {pieces === 1 ? "1 peça" : `${pieces} peças`} · <span className="underline group-open:no-underline">ver resumo</span>
        </span>
        <span className="numeros font-display text-lg">{formatPrice(total)}</span>
      </summary>
      <div className="border-t border-linha px-4 py-3 text-sm">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.variantId} className="flex justify-between gap-4">
              <span>
                {item.quantity}× {item.productName}
                {(item.colorName || item.sizeName) && <span className="text-tinta-suave"> · {[item.colorName, item.sizeName].filter(Boolean).join(" · ")}</span>}
              </span>
              <span className="numeros">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-linha pt-3">
          <div className="flex justify-between">
            <dt>Peças</dt>
            <dd className="numeros">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frete</dt>
            <dd className="numeros">{shipping === null ? "a escolher" : shipping === 0 ? "grátis" : formatPrice(shipping)}</dd>
          </div>
          {wrap > 0 && (
            <div className="flex justify-between">
              <dt>Embalagem para presente</dt>
              <dd className="numeros">{formatPrice(wrap)}</dd>
            </div>
          )}
        </dl>
      </div>
    </details>
  );
}

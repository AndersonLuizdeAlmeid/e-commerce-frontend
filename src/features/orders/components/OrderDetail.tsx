"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatAddressLine, formatAddressPlace } from "@/features/addresses/address-fields";
import { useAuth } from "@/features/auth/AuthProvider";
import { deliveryLabel } from "@/features/shipping/api";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import { ordersApi, type Order } from "../api";
import { cancellationLabel, orderStatusLabel, paymentCountdown } from "../gift";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

/** Detalhe do pedido (RF-042): situação, peças, entrega, presente, histórico e cancelamento (RF-043). */
export function OrderDetail({ id }: { id: string }) {
  const { status } = useAuth();
  const router = useRouter();
  const isNew = useSearchParams().get("novo") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=/conta/pedidos/${id}`);
    }
  }, [status, router, id]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    ordersApi
      .get(id)
      .then((loaded) => active && setOrder(loaded))
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError && err.status === 404 ? "Pedido não encontrado." : errorMessage(err, "Não foi possível carregar o pedido."));
        }
      });
    return () => {
      active = false;
    };
  }, [status, id]);

  if (error) {
    return <FormAlert kind="info">{error}</FormAlert>;
  }

  if (!order) {
    return <p className="text-tinta-suave">Carregando o pedido…</p>;
  }

  async function cancel() {
    setCancelling(true);
    setNotice(null);
    try {
      await ordersApi.cancel(id);
      setOrder(await ordersApi.get(id));
      setNotice({ kind: "success", text: "Pedido cancelado. As peças voltaram para a loja." });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  const pending = order.status === "PendingPayment";

  return (
    <div className="space-y-8">
      {isNew && pending && (
        <FormAlert kind="success">
          <p className="font-medium">Pedido {order.number} recebido.</p>
          <p className="mt-1">Mandamos o resumo para o seu e-mail. As peças ficam separadas para você até o pagamento.</p>
        </FormAlert>
      )}
      {notice && <FormAlert kind={notice.kind}>{notice.text}</FormAlert>}

      <section aria-labelledby="situacao">
        <h2 id="situacao" className="text-xs font-medium uppercase tracking-[0.16em]">
          Situação
        </h2>
        <p className="mt-1 font-display text-2xl leading-tight">
          {order.status === "Cancelled" ? cancellationLabel(order.cancellationReason) : orderStatusLabel(order.status)}
        </p>
        {pending && (
          <p className="mt-2 text-sm">
            Pague até {dateTime.format(new Date(order.paymentDueAt))} ({paymentCountdown(order.paymentDueAt)}). O pagamento por PIX e cartão
            entra nesta tela; enquanto isso, fale com a MO para combinar.
          </p>
        )}
      </section>

      <section aria-labelledby="pecas" className="space-y-3">
        <h2 id="pecas" className="font-display text-xl leading-tight">
          Peças
        </h2>
        <ul className="divide-y divide-linha border-y border-linha">
          {order.items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-3">
              <span className="relative block size-16 shrink-0 overflow-hidden bg-linha/50">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-medium">{item.productName}</span>
                {(item.colorName || item.sizeName) && <span className="block text-tinta-suave">{[item.colorName, item.sizeName].filter(Boolean).join(" · ")}</span>}
                <span className="block text-tinta-suave">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </span>
              </span>
              <span className="numeros text-sm">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Peças</dt>
            <dd className="numeros">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frete ({order.shipping.name})</dt>
            <dd className="numeros">{order.shippingFee === 0 ? "grátis" : formatPrice(order.shippingFee)}</dd>
          </div>
          {order.gift.wrap && (
            <div className="flex justify-between">
              <dt>Embalagem para presente</dt>
              <dd className="numeros">{order.giftWrapPrice === 0 ? "grátis" : formatPrice(order.giftWrapPrice)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-linha pt-2 font-medium">
            <dt>Total</dt>
            <dd className="numeros font-display text-xl">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="entrega" className="space-y-1 text-sm">
        <h2 id="entrega" className="font-display text-xl leading-tight">
          Entrega
        </h2>
        <p className="pt-2">{order.address.recipient}</p>
        <p>{formatAddressLine({ ...order.address, complement: order.address.complement ?? "" })}</p>
        <p className="text-tinta-suave">{formatAddressPlace(order.address)}</p>
        {order.status !== "Cancelled" && (
          <p className="pt-2">
            {order.shipping.name} · {deliveryLabel(order.shipping.deliveryDays ?? null)} depois do pagamento
          </p>
        )}
      </section>

      {order.gift.isGift && (
        <section aria-labelledby="presente" className="space-y-1 text-sm">
          <h2 id="presente" className="font-display text-xl leading-tight">
            Presente
          </h2>
          <p className="pt-2">{order.gift.wrap ? "Com embalagem para presente." : "Sem embalagem para presente."}</p>
          {order.gift.message && <p className="whitespace-pre-line border-l-2 border-folha pl-3 italic">{order.gift.message}</p>}
        </section>
      )}

      <section aria-labelledby="historico" className="space-y-2 text-sm">
        <h2 id="historico" className="font-display text-xl leading-tight">
          Histórico
        </h2>
        <ol className="space-y-1">
          {order.history.map((change) => (
            <li key={`${change.status}-${change.changedAt}`} className="flex justify-between gap-4">
              <span>{orderStatusLabel(change.status)}</span>
              <span className="text-tinta-suave">{dateTime.format(new Date(change.changedAt))}</span>
            </li>
          ))}
        </ol>
      </section>

      {order.canCancel && (
        <section className="border-t border-linha pt-6">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-x-5" role="group" aria-label="Confirmar cancelamento">
              <span className="text-sm">Cancelar o pedido {order.number}?</span>
              <button type="button" disabled={cancelling} onClick={() => void cancel()} className="inline-flex min-h-11 items-center text-sm font-medium underline disabled:opacity-60">
                {cancelling ? "Cancelando…" : "Sim, cancelar"}
              </button>
              <button type="button" disabled={cancelling} onClick={() => setConfirming(false)} className="inline-flex min-h-11 items-center text-sm font-medium underline">
                Não
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex min-h-11 items-center text-sm font-medium text-tinta-suave underline hover:text-tinta">
              Cancelar pedido
            </button>
          )}
        </section>
      )}

      <Link href="/conta/pedidos" className="inline-flex min-h-11 items-center text-sm font-medium underline">
        Todos os pedidos
      </Link>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { cancellationLabel, giftMessageProblem, orderStatusLabel, GIFT_MESSAGE_MAX_LENGTH } from "@/features/orders/gift";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  addressLines,
  backofficeApi,
  backofficeKeys,
  normalizeTrackingCode,
  primaryAction,
  variantLabel,
  type AdminOrder,
} from "../backoffice";
import { GiftTag, Modal, Notice, OrderStatusTag, ReasonDialog, formatDateTime, useNotice } from "./BackofficeUi";
import { adminButton, adminButtonGhost, adminLink, cellInput } from "./ui";

type Dialog = "cancel" | "confirm-payment" | "gift" | "return" | null;

/**
 * RF-053: o pedido da separação à entrega. O que fazer agora fica no topo (uma ação principal por situação), a
 * dedicatória em destaque para a separação (arquivo 26 §4.8) e uma versão de impressão para separar o pedido.
 */
export function OrderPanel({ id }: { id: string }) {
  const client = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useNotice();
  const order = useQuery({ queryKey: backofficeKeys.order(id), queryFn: () => backofficeApi.order(id) });

  /** A API responde o pedido atualizado: a tela troca na hora e a lista e o dashboard recarregam quando abertos. */
  const applied = (updated: AdminOrder, message: string) => {
    client.setQueryData(backofficeKeys.order(id), updated);
    void client.invalidateQueries({ queryKey: backofficeKeys.orders });
    void client.invalidateQueries({ queryKey: backofficeKeys.dashboard });
    setNotice(message);
  };

  if (order.isPending) return <p className="text-sm text-tinta-suave">Carregando o pedido…</p>;
  if (order.isError) {
    return (
      <>
        <BackLink />
        <FormAlert kind="error">{errorMessage(order.error, "Não foi possível abrir o pedido.")}</FormAlert>
      </>
    );
  }

  const data = order.data;
  const can = (action: AdminOrder["allowedActions"][number]) => data.allowedActions.includes(action);
  const cancelled = cancellationLabel(data.cancellationReason);

  return (
    <article className="max-w-5xl">
      <BackLink />
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="numeros font-display text-3xl leading-tight">{data.number}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
            <OrderStatusTag status={data.status} />
            <span>Feito em {formatDateTime(data.placedAt)}</span>
            {data.gift.isGift && <GiftTag />}
          </p>
          {cancelled && <p className="mt-1 text-sm text-alerta">{cancelled.replace("por você", "pela cliente")}</p>}
        </div>
        <button type="button" className={`${adminLink} print:hidden`} onClick={() => window.print()}>Imprimir separação</button>
      </header>

      {notice && <Notice>{notice}</Notice>}

      <NextStep order={data} onApplied={applied} onDialog={setDialog} />

      {data.gift.isGift && (
        <section aria-labelledby="presente-titulo" className="mb-6 border border-folha bg-cartela p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="presente-titulo" className="text-xs font-medium uppercase tracking-[0.16em] text-ouro-tinta">
              Presente {data.gift.wrap ? "· com embalagem" : "· sem embalagem"}
            </h2>
            {can("CorrectGiftMessage") && (
              <button type="button" className={`${adminLink} print:hidden`} onClick={() => setDialog("gift")}>Corrigir dedicatória</button>
            )}
          </div>
          {data.gift.message ? (
            <blockquote className="mt-3 whitespace-pre-line font-display text-2xl leading-snug">{data.gift.message}</blockquote>
          ) : (
            <p className="mt-2 text-sm text-tinta-suave">Sem dedicatória.</p>
          )}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-8">
          <Section title={`Peças (${data.items.reduce((sum, item) => sum + item.quantity, 0)})`}>
            <ul className="border-t border-tinta/30">
              {data.items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-3 border-b border-linha py-3">
                  <span className="relative block size-16 shrink-0 overflow-hidden bg-linha/60 print:size-12">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/admin/produtos/${item.productId}`} className="block text-sm font-medium hover:underline">{item.productName}</Link>
                    <span className="block text-sm">{variantLabel(item)}</span>
                    <span className="numeros block text-xs text-tinta-suave">SKU {item.sku}</span>
                  </span>
                  <span className="text-right">
                    <span className="numeros block text-lg leading-tight">{item.quantity}×</span>
                    <span className="numeros block text-xs text-tinta-suave">{formatPrice(item.unitPrice)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm">
              <Line label="Peças" value={formatPrice(data.subtotal)} />
              <Line label={`Frete (${data.shipping.name}${data.shipping.isFallback ? ", valor de contingência" : ""})`} value={data.shippingFee === 0 ? "Grátis" : formatPrice(data.shippingFee)} />
              {data.gift.wrap && <Line label="Embalagem para presente" value={data.giftWrapPrice === 0 ? "Grátis" : formatPrice(data.giftWrapPrice)} />}
              <Line label="Total" value={formatPrice(data.total)} strong />
            </dl>
          </Section>

          {data.notes && (
            <Section title="Observação da cliente">
              <p className="whitespace-pre-line text-sm">{data.notes}</p>
            </Section>
          )}

          <Section title="Histórico" className="print:hidden">
            <ol className="border-l border-linha pl-4">
              {data.history.map((change, index) => (
                <li key={`${change.changedAt}-${index}`} className="relative pb-4 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-tinta" />
                  <p className="text-sm">
                    {change.fromStatus === change.toStatus ? "Alteração" : orderStatusLabel(change.toStatus)}
                    <span className="text-tinta-suave"> · {change.changedBy ?? "Sistema"}</span>
                  </p>
                  <p className="numeros text-xs text-tinta-suave">{formatDateTime(change.changedAt)}</p>
                  {change.note && <p className="mt-1 text-sm">{change.note}</p>}
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="min-w-0 space-y-8">
          <Section title="Entrega">
            <AddressBlock order={data} />
            <dl className="mt-3 space-y-1 text-sm">
              <Line label="Serviço" value={data.shipping.deliveryDays ? `${data.shipping.name}, ${data.shipping.deliveryDays} dias úteis` : data.shipping.name} />
            </dl>
            {data.shipping.trackingCode && (
              <TrackingBlock order={data} onApplied={applied} />
            )}
          </Section>

          <Section title="Cliente">
            <p className="text-sm font-medium">{data.customer.name}</p>
            {data.customer.removed ? (
              <p className="text-sm text-tinta-suave">A cliente excluiu a conta. O pedido ficou só com valores, peças e datas.</p>
            ) : (
              <>
                <a href={`mailto:${data.customer.email}`} className="block text-sm underline">{data.customer.email}</a>
                {data.customer.phone && <p className="numeros text-sm">{data.customer.phone}</p>}
                <p className="mt-1 text-xs text-tinta-suave">
                  {data.customer.orderCount === 1 ? "Primeiro pedido" : `${data.customer.orderCount} pedidos na loja`} ·{" "}
                  <Link href={`/admin/pedidos?busca=${encodeURIComponent(data.customer.email)}`} className="underline print:hidden">ver pedidos</Link>
                </p>
              </>
            )}
          </Section>

          <Section title="Pagamento" className="print:hidden">
            {data.payments.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma tentativa de pagamento ainda.</p>}
            <ul className="space-y-3">
              {data.payments.map((payment) => (
                <li key={payment.id} className="border-l-2 border-linha pl-3 text-sm">
                  <p className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">
                      {PAYMENT_METHOD_LABELS[payment.method]}
                      {payment.installments && payment.installments > 1 ? ` em ${payment.installments}×` : ""}
                    </span>
                    <span className="numeros">{formatPrice(payment.amount)}</span>
                  </p>
                  <p className={payment.status === "RefundFailed" ? "text-alerta" : "text-tinta-suave"}>
                    {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status} · <span className="numeros">{formatDateTime(payment.approvedAt ?? payment.createdAt)}</span>
                  </p>
                  {payment.statusDetail && <p className="text-xs text-tinta-suave">{payment.statusDetail}</p>}
                  {payment.providerPaymentId && <p className="numeros text-xs text-tinta-suave">Mercado Pago {payment.providerPaymentId}</p>}
                </li>
              ))}
            </ul>
            {data.status === "PendingPayment" && (
              <p className="mt-3 text-xs text-tinta-suave">Vence em {formatDateTime(data.paymentDueAt)}; depois disso o pedido se cancela sozinho.</p>
            )}
          </Section>
        </aside>
      </div>

      {dialog === "cancel" && (
        <ReasonDialog
          title={`Cancelar ${data.number}?`}
          description={
            <>
              As peças voltam para o estoque{data.status === "PendingPayment" ? "" : " e o valor pago é estornado pelo Mercado Pago"}. A cliente recebe um e-mail
              dizendo que a loja cancelou; <strong className="font-medium text-tinta">o motivo fica só aqui no painel</strong>.
            </>
          }
          label="Motivo"
          placeholder="Ex.: peça com defeito, sem reposição"
          confirmLabel="Cancelar pedido"
          danger
          onConfirm={async (reason) => applied(await backofficeApi.cancel(id, reason), "Pedido cancelado. O estoque voltou.")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "confirm-payment" && (
        <ReasonDialog
          title="Confirmar o pagamento à mão?"
          description="Use só quando o dinheiro entrou fora do site e você conferiu no extrato. O pedido vai para “Para separar”, a cliente recebe a confirmação e o PIX aberto é cancelado."
          label="Como o pagamento foi conferido"
          placeholder="Ex.: PIX direto na conta da loja, conferido no extrato de 15/11"
          confirmLabel="Confirmar pagamento"
          onConfirm={async (reason) => applied(await backofficeApi.confirmPayment(id, reason), "Pagamento confirmado à mão.")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "return" && (
        <ReasonDialog
          title={`Registrar a devolução de ${data.number}?`}
          description={
            <>
              Use quando a peça voltou (arrependimento em até 7 dias ou troca sem reposição). O valor pago é estornado e a cliente recebe o e-mail do
              estorno. <strong className="font-medium text-tinta">O estoque não volta sozinho</strong>: confira a peça e lance a entrada em Estoque.
            </>
          }
          label="Motivo"
          placeholder="Ex.: arrependimento em 5 dias, peça conferida sem uso"
          confirmLabel="Registrar devolução"
          danger
          onConfirm={async (note) => applied(await backofficeApi.returnOrder(id, note), "Devolução registrada. O estorno foi pedido ao Mercado Pago.")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "gift" && <GiftMessageDialog order={data} onApplied={applied} onClose={() => setDialog(null)} />}
    </article>
  );
}

function BackLink() {
  return <Link href="/admin/pedidos" className={`${adminLink} mb-3 inline-block print:hidden`}>← Pedidos</Link>;
}

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.16em]">{title}</h2>
      {children}
    </section>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-tinta/30 pt-1 font-medium" : ""}`}>
      <dt className={strong ? "" : "text-tinta-suave"}>{label}</dt>
      <dd className="numeros text-right">{value}</dd>
    </div>
  );
}

const NEXT_STEP_TEXT: Partial<Record<AdminOrder["status"], string>> = {
  PendingPayment: "Esperando o pagamento. A confirmação chega sozinha pelo Mercado Pago.",
  PaymentConfirmed: "Pago. Separe as peças e marque quando começar.",
  Preparing: "Em separação. Ao despachar, cole o código de rastreio: a cliente recebe o e-mail com ele.",
  Shipped: "A caminho. Marque como entregue quando a transportadora confirmar.",
  Delivered: "Entregue. Se a peça voltar (arrependimento em até 7 dias ou troca), registre a devolução para estornar o valor.",
};

/** A ação do momento, em destaque; exceções (cancelar, confirmar à mão) ficam ao lado, mais discretas. */
function NextStep({ order, onApplied, onDialog }: { order: AdminOrder; onApplied: (order: AdminOrder, message: string) => void; onDialog: (dialog: Dialog) => void }) {
  const primary = primaryAction(order);
  const act = useMutation({
    mutationFn: async () => {
      if (primary === "StartPreparation") return [await backofficeApi.startPreparation(order.id), "Separação começou."] as const;
      return [await backofficeApi.deliver(order.id), "Pedido entregue. A cliente recebeu o aviso."] as const;
    },
    onSuccess: ([updated, message]) => onApplied(updated, message),
  });

  const text = NEXT_STEP_TEXT[order.status];
  const hasSecondary = ["ConfirmPayment", "Cancel", "Return"].some((action) => order.allowedActions.includes(action as AdminOrder["allowedActions"][number]));
  if (!text && !hasSecondary) return null;

  return (
    <section aria-label="Próximo passo" className="mb-6 border-y border-tinta/30 py-4 print:hidden">
      {text && <p className="text-sm">{text}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {primary === "Ship" && <ShipForm order={order} onApplied={onApplied} />}
        {(primary === "StartPreparation" || primary === "Deliver") && (
          <button type="button" className={adminButton} disabled={act.isPending} onClick={() => act.mutate()}>
            {primary === "StartPreparation" ? "Começar a separar" : "Marcar como entregue"}
          </button>
        )}
        {order.allowedActions.includes("ConfirmPayment") && (
          <button type="button" className={adminButtonGhost} onClick={() => onDialog("confirm-payment")}>Confirmar pagamento à mão</button>
        )}
        {order.allowedActions.includes("Cancel") && (
          <button type="button" className={`${adminLink} min-h-10 text-alerta`} onClick={() => onDialog("cancel")}>Cancelar pedido</button>
        )}
        {order.allowedActions.includes("Return") && (
          <button type="button" className={adminButtonGhost} onClick={() => onDialog("return")}>Registrar devolução</button>
        )}
      </div>
      {act.isError && <p role="alert" className="mt-2 text-sm text-alerta">{errorMessage(act.error)}</p>}
    </section>
  );
}

function ShipForm({ order, onApplied }: { order: AdminOrder; onApplied: (order: AdminOrder, message: string) => void }) {
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const ship = useMutation({
    mutationFn: (trackingCode: string) => backofficeApi.ship(order.id, trackingCode),
    onSuccess: (updated) => onApplied(updated, "Pedido enviado. A cliente recebeu o e-mail com o rastreio."),
    onError: (error) => setProblem(fieldErrors(error).trackingCode ?? errorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = normalizeTrackingCode(code);
    if ("error" in result) {
      setProblem(result.error);
      return;
    }
    setProblem(null);
    ship.mutate(result.code);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-wrap items-end gap-2">
      <label className="text-xs font-medium uppercase tracking-[0.12em]">
        Código de rastreio
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="AA123456789BR"
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? "rastreio-erro" : undefined}
          className={`${cellInput} numeros mt-1 w-56 text-base uppercase tracking-normal placeholder:normal-case placeholder:text-tinta-suave/60`}
        />
      </label>
      <button type="submit" className={adminButton} disabled={ship.isPending}>{ship.isPending ? "Enviando…" : "Marcar como enviado"}</button>
      {problem && <p id="rastreio-erro" role="alert" className="basis-full text-sm text-alerta">{problem}</p>}
    </form>
  );
}

function TrackingBlock({ order, onApplied }: { order: AdminOrder; onApplied: (order: AdminOrder, message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(order.shipping.trackingCode ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const update = useMutation({
    mutationFn: (trackingCode: string) => backofficeApi.updateTracking(order.id, trackingCode),
    onSuccess: (updated) => {
      setEditing(false);
      onApplied(updated, "Rastreio corrigido. A cliente não recebe outro e-mail.");
    },
    onError: (error) => setProblem(fieldErrors(error).trackingCode ?? errorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = normalizeTrackingCode(code);
    if ("error" in result) {
      setProblem(result.error);
      return;
    }
    update.mutate(result.code);
  }

  if (editing) {
    return (
      <form onSubmit={submit} noValidate className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Rastreio
          <input value={code} onChange={(e) => setCode(e.target.value)} autoFocus spellCheck={false} className={`${cellInput} numeros mt-1 w-48 text-base uppercase`} />
        </label>
        <button type="submit" className={adminButtonGhost} disabled={update.isPending}>Salvar</button>
        <button type="button" className={adminLink} onClick={() => setEditing(false)}>Cancelar</button>
        {problem && <p role="alert" className="basis-full text-sm text-alerta">{problem}</p>}
      </form>
    );
  }

  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span>Rastreio <span className="numeros font-medium">{order.shipping.trackingCode}</span></span>
      {order.shipping.trackingUrl && <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer" className="underline print:hidden">Acompanhar</a>}
      {order.allowedActions.includes("UpdateTracking") && (
        <button type="button" className={`${adminLink} print:hidden`} onClick={() => setEditing(true)}>Corrigir</button>
      )}
    </p>
  );
}

function AddressBlock({ order }: { order: AdminOrder }) {
  const lines = addressLines(order.address);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <address className="text-sm not-italic leading-relaxed">
        {lines.map((line) => <span key={line} className="block">{line}</span>)}
      </address>
      <button type="button" className={`${adminLink} mt-1 print:hidden`} onClick={() => void copy()} aria-live="polite">
        {copied ? "Endereço copiado" : "Copiar endereço"}
      </button>
    </div>
  );
}

function GiftMessageDialog({ order, onApplied, onClose }: { order: AdminOrder; onApplied: (order: AdminOrder, message: string) => void; onClose: () => void }) {
  const [message, setMessage] = useState(order.gift.message ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local = giftMessageProblem(message);
    if (local) {
      setProblem(local);
      return;
    }
    setPending(true);
    try {
      onApplied(await backofficeApi.correctGiftMessage(order.id, message), "Dedicatória corrigida.");
      onClose();
    } catch (error) {
      setProblem(fieldErrors(error).message ?? errorMessage(error));
      setPending(false);
    }
  }

  return (
    <Modal title="Corrigir a dedicatória" onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="mt-4">
        <label htmlFor="dedicatoria" className="block text-xs font-medium uppercase tracking-[0.16em]">Dedicatória</label>
        <textarea
          id="dedicatoria"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={GIFT_MESSAGE_MAX_LENGTH + 20}
          autoFocus
          className="mt-1.5 block w-full border border-tinta/40 bg-transparent p-2 font-display text-lg focus-visible:border-tinta focus-visible:outline-none"
        />
        <p className="numeros mt-1 text-right text-xs text-tinta-suave">{message.trim().length}/{GIFT_MESSAGE_MAX_LENGTH}</p>
        {problem && <p role="alert" className="mt-1 text-sm text-alerta">{problem}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={adminButtonGhost} onClick={onClose}>Voltar</button>
          <button type="submit" className={adminButton} disabled={pending}>{pending ? "Salvando…" : "Salvar dedicatória"}</button>
        </div>
      </form>
    </Modal>
  );
}


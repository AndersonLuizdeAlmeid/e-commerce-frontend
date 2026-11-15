"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { orderStatusLabel } from "@/features/orders/gift";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import { PERIOD_LABELS, STATUS_TABS, backofficeApi, backofficeKeys, periodRange, variantLabel, type Dashboard, type PeriodPreset } from "../backoffice";
import { PageHeader, cellInput } from "./ui";

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const dayLabel = (iso: string) => shortDate.format(new Date(`${iso}T12:00:00Z`)).replace(".", "");

/**
 * RF-055 (entrega 5 §3, P10 e P11): "quanto vendi" e "o que preciso fazer hoje" numa olhada. Os números são o produto
 * (sem gráfico onde um número basta); a única barra é a de pedidos por situação, uma série só, com o valor escrito.
 */
export function DashboardPanel() {
  const [preset, setPreset] = useState<PeriodPreset | null>("30d");
  const [range, setRange] = useState(() => periodRange("30d"));
  const dashboard = useQuery({
    queryKey: [...backofficeKeys.dashboard, range],
    queryFn: () => backofficeApi.dashboard(range.from, range.to),
    placeholderData: keepPreviousData,
  });

  const choose = (next: PeriodPreset) => {
    setPreset(next);
    setRange(periodRange(next));
  };

  /** Data escolhida à mão: o atalho deixa de valer. Campo apagado não muda o período. */
  const pick = (change: Partial<typeof range>) => {
    if (Object.values(change).some((value) => !value)) return;
    setPreset(null);
    setRange({ ...range, ...change });
  };

  const data = dashboard.data;

  return (
    <>
      <PageHeader title="Painel" description="O que espera por você agora e como foram as vendas no período." />

      {dashboard.isError && <FormAlert kind="error">{errorMessage(dashboard.error)}</FormAlert>}
      {dashboard.isPending && <p className="text-sm text-tinta-suave">Carregando…</p>}

      {data && (
        <div className={dashboard.isFetching ? "opacity-80 transition-opacity" : ""}>
          <ToDo data={data} />

          <section aria-labelledby="vendas-titulo" className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-linha pb-3">
              <h2 id="vendas-titulo" className="font-display text-2xl leading-tight">
                Vendas <span className="numeros text-base text-tinta-suave">{data.from === data.to ? dayLabel(data.from) : `${dayLabel(data.from)} a ${dayLabel(data.to)}`}</span>
              </h2>
              <div className="flex flex-wrap items-end gap-2">
                <div role="group" aria-label="Período" className="flex flex-wrap gap-1">
                  {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={preset === key}
                      onClick={() => choose(key)}
                      className={`min-h-10 px-3 text-sm ${preset === key ? "bg-tinta text-cartela" : "border border-tinta/30 hover:border-tinta"}`}
                    >
                      {PERIOD_LABELS[key]}
                    </button>
                  ))}
                </div>
                <label className="text-xs font-medium uppercase tracking-[0.12em]">
                  <span className="sr-only">Início do período</span>
                  <input
                    type="date"
                    value={range.from}
                    max={range.to}
                    onChange={(e) => pick({ from: e.target.value })}
                    className={`${cellInput} numeros min-h-10 w-36 normal-case tracking-normal`}
                  />
                </label>
                <label className="text-xs font-medium uppercase tracking-[0.12em]">
                  <span className="sr-only">Fim do período</span>
                  <input
                    type="date"
                    value={range.to}
                    min={range.from}
                    onChange={(e) => pick({ to: e.target.value })}
                    className={`${cellInput} numeros min-h-10 w-36 normal-case tracking-normal`}
                  />
                </label>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 xl:grid-cols-4">
              <Stat label="Faturamento" value={formatPrice(data.revenue)} note="pagamentos aprovados no período" />
              <Stat label="Pedidos pagos" value={String(data.paidOrders)} note={`de ${data.ordersPlaced} ${data.ordersPlaced === 1 ? "pedido feito" : "pedidos feitos"}`} />
              <Stat label="Ticket médio" value={data.paidOrders === 0 ? "—" : formatPrice(data.averageTicket)} note="faturamento ÷ pedidos pagos" />
              <Stat
                label="Estornado"
                value={formatPrice(data.refundedAmount)}
                note={data.refundedPayments === 0 ? "nada voltou para clientes" : `${data.refundedPayments} ${data.refundedPayments === 1 ? "pagamento" : "pagamentos"} do período`}
              />
            </dl>

            <StatusBars data={data} />
          </section>

          <LowStock data={data} />
        </div>
      )}
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">{label}</dt>
      {/* Valores longos (R$ 12.345,67) quebram em vez de sumir: o número é o produto desta tela. */}
      <dd className="numeros mt-1 font-display text-[clamp(1.5rem,4vw,2.25rem)] leading-tight [overflow-wrap:anywhere]">{value}</dd>
      <dd className="mt-0.5 text-xs text-tinta-suave">{note}</dd>
    </div>
  );
}

/** O que pede a loja agora, independente do período: cada linha leva à lista já filtrada. */
function ToDo({ data }: { data: Dashboard }) {
  const items = [
    { count: data.toDo.toPrepare, label: "pago, para separar", empty: "Nada para separar", href: "/admin/pedidos?situacao=PaymentConfirmed", urgent: true },
    { count: data.toDo.preparing, label: "em separação, para enviar", empty: "Nada em separação", href: "/admin/pedidos?situacao=Preparing", urgent: true },
    { count: data.toDo.pendingRefunds, label: "estorno pendente", empty: "Nenhum estorno pendente", href: "/admin/estornos", urgent: true },
    { count: data.toDo.inTransit, label: "a caminho da cliente", empty: "Nenhum pedido a caminho", href: "/admin/pedidos?situacao=Shipped", urgent: false },
    { count: data.toDo.awaitingPayment, label: "aguardando pagamento", empty: "Nenhum pedido aguardando pagamento", href: "/admin/pedidos?situacao=PendingPayment", urgent: false },
  ];
  const plural = (label: string) => label.replace(/^pago/, "pagos").replace(/^estorno pendente$/, "estornos pendentes");

  return (
    <section aria-labelledby="agora-titulo">
      <h2 id="agora-titulo" className="mb-3 font-display text-2xl leading-tight">Agora</h2>
      <ul className="grid gap-px border border-linha bg-linha sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => {
          const waiting = item.urgent && item.count > 0;
          return (
            <li key={item.href} className="bg-cartela">
              <Link href={item.href} className="group flex h-full min-h-24 flex-col justify-between p-4 hover:bg-linha/30">
                {item.count === 0 ? (
                  <span className="text-sm text-tinta-suave">{item.empty}</span>
                ) : (
                  <>
                    <span className={`numeros font-display text-4xl leading-none ${waiting ? "" : "text-tinta-suave"}`}>
                      {item.count}
                      {waiting && <span aria-hidden="true" className="ml-2 inline-block size-2 -translate-y-3 rounded-full bg-folha" />}
                    </span>
                    <span className="mt-2 text-sm group-hover:underline">{item.count === 1 ? item.label : plural(item.label)}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Pedidos feitos no período por situação: uma série, barras finas de uma cor, com o número escrito ao lado. */
function StatusBars({ data }: { data: Dashboard }) {
  const counts = new Map(data.ordersByStatus.map((item) => [item.status, item.count]));
  const max = Math.max(1, ...counts.values());
  if (data.ordersPlaced === 0) {
    return <p className="mt-8 text-sm text-tinta-suave">Nenhum pedido feito no período.</p>;
  }

  return (
    <figure className="mt-10 max-w-2xl">
      <figcaption className="mb-3 text-xs font-medium uppercase tracking-[0.16em]">Pedidos feitos no período, pela situação de hoje</figcaption>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr><th scope="col">Situação</th><th scope="col">Pedidos</th></tr>
        </thead>
        <tbody>
          {STATUS_TABS.map((status) => {
            const count = counts.get(status) ?? 0;
            return (
              <tr key={status} title={`${orderStatusLabel(status)}: ${count}`} className="hover:bg-linha/30">
                <th scope="row" className="w-48 py-1.5 pr-4 text-left font-normal">{orderStatusLabel(status)}</th>
                <td className="py-1.5">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 flex-1">
                      {count > 0 && (
                        <span
                          aria-hidden="true"
                          className={`block h-full rounded-r-[4px] ${status === "Cancelled" ? "bg-tinta-suave/50" : "bg-tinta"}`}
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      )}
                    </span>
                    <span className="numeros w-8 text-right">{count}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}

function LowStock({ data }: { data: Dashboard }) {
  return (
    <section aria-labelledby="estoque-titulo" className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="estoque-titulo" className="font-display text-2xl leading-tight">
          Estoque baixo <span className="numeros text-base text-tinta-suave">{data.lowStockCount}</span>
        </h2>
        {data.lowStockCount > 0 && <Link href="/admin/estoque" className="text-sm underline">Ver todo o estoque</Link>}
      </div>
      {data.lowStock.length === 0 ? (
        <p className="text-sm text-tinta-suave">Nenhuma peça à venda no limite de estoque baixo.</p>
      ) : (
        <ul className="border-t border-tinta/30">
          {data.lowStock.map((item) => (
            <li key={item.variantId} className="flex items-center justify-between gap-4 border-b border-linha py-2">
              <Link href={`/admin/estoque?busca=${encodeURIComponent(item.sku)}`} className="min-w-0 hover:underline">
                <span className="block truncate text-sm">{item.productName}</span>
                <span className="numeros block truncate text-xs text-tinta-suave">{variantLabel(item)} · {item.sku}</span>
              </Link>
              <span className={`numeros shrink-0 text-sm ${item.quantityOnHand === 0 ? "text-alerta" : ""}`}>
                {item.quantityOnHand === 0 ? "Esgotada" : `${item.quantityOnHand} (limite ${item.lowStockThreshold})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

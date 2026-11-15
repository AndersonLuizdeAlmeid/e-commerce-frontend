"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import {
  PAYMENT_METHOD_LABELS,
  STATUS_TABS,
  STATUS_TAB_LABELS,
  backofficeApi,
  backofficeKeys,
  type OrderFilters,
  type OrderStatus,
  type PaymentMethod,
} from "../backoffice";
import { EmptyState, GiftTag, OrderStatusTag, Pagination, formatDateTime } from "./BackofficeUi";
import { PageHeader, adminButtonGhost, adminLink, cellInput } from "./ui";

const STATUSES = new Set<string>(STATUS_TABS);
const METHODS = new Set<string>(Object.keys(PAYMENT_METHOD_LABELS));

/** Os filtros moram na URL: o dashboard e o e-mail de pedido pago levam direto à lista certa, e voltar funciona. */
function readFilters(params: URLSearchParams): OrderFilters {
  const status = params.get("situacao");
  const method = params.get("pagamento");
  return {
    page: Math.max(1, Number(params.get("pagina")) || 1),
    status: status && STATUSES.has(status) ? (status as OrderStatus) : null,
    search: params.get("busca") ?? "",
    from: params.get("de"),
    to: params.get("ate"),
    paymentMethod: method && METHODS.has(method) ? (method as PaymentMethod) : null,
    gift: params.get("presente") === "1",
  };
}

function writeFilters(filters: OrderFilters): string {
  const query = new URLSearchParams();
  if (filters.status) query.set("situacao", filters.status);
  if (filters.search.trim()) query.set("busca", filters.search.trim());
  if (filters.from) query.set("de", filters.from);
  if (filters.to) query.set("ate", filters.to);
  if (filters.paymentMethod) query.set("pagamento", filters.paymentMethod);
  if (filters.gift) query.set("presente", "1");
  if (filters.page > 1) query.set("pagina", String(filters.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}

/** RF-053: pedidos com filtros visíveis, situação em abas com contagem e presente marcado na linha (arquivo 26 §4.8). */
export function OrdersPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = readFilters(params);
  const update = (change: Partial<OrderFilters>) =>
    router.replace(`${pathname}${writeFilters({ ...filters, page: 1, ...change })}`, { scroll: false });

  const orders = useQuery({
    queryKey: [...backofficeKeys.orders, filters],
    queryFn: () => backofficeApi.orders(filters),
    placeholderData: keepPreviousData,
  });

  const counts = new Map(orders.data?.statusCounts.map((item) => [item.status, item.count]) ?? []);
  const all = orders.data?.statusCounts.reduce((sum, item) => sum + item.count, 0);
  const page = orders.data?.orders;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({ search: String(new FormData(event.currentTarget).get("q") ?? "") });
  }

  const hasFilters = Boolean(filters.search || filters.from || filters.to || filters.paymentMethod || filters.gift);

  return (
    <>
      <PageHeader title="Pedidos" description="Do pagamento à entrega. Os pedidos pagos esperam em “Para separar”; a cliente recebe um e-mail a cada passo." />

      <div role="group" aria-label="Situação" className="mb-4 flex flex-wrap gap-x-1 border-b border-linha">
        <Tab current={filters.status === null} onClick={() => update({ status: null })} label="Todos" count={all} />
        {STATUS_TABS.map((status) => (
          <Tab key={status} current={filters.status === status} onClick={() => update({ status })} label={STATUS_TAB_LABELS[status]} count={counts.get(status) ?? 0} />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <form onSubmit={search} role="search" className="flex min-w-60 flex-1 items-end gap-2">
          <label htmlFor="busca-pedidos" className="sr-only">Buscar por número, nome ou e-mail</label>
          <input
            id="busca-pedidos"
            name="q"
            type="search"
            key={filters.search}
            defaultValue={filters.search}
            placeholder="Número, nome ou e-mail"
            className={`${cellInput} min-h-10 placeholder:text-tinta-suave`}
          />
          <button type="submit" className={adminButtonGhost}>Buscar</button>
        </form>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          De
          <input type="date" value={filters.from ?? ""} max={filters.to ?? undefined} onChange={(e) => update({ from: e.target.value || null })} className={`${cellInput} numeros mt-1 min-h-10 normal-case tracking-normal`} />
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Até
          <input type="date" value={filters.to ?? ""} min={filters.from ?? undefined} onChange={(e) => update({ to: e.target.value || null })} className={`${cellInput} numeros mt-1 min-h-10 normal-case tracking-normal`} />
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Pago com
          <select
            value={filters.paymentMethod ?? ""}
            onChange={(e) => update({ paymentMethod: (e.target.value || null) as PaymentMethod | null })}
            className={`${cellInput} mt-1 min-h-10 cursor-pointer normal-case tracking-normal`}
          >
            <option value="">Qualquer forma</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={filters.gift} onChange={(e) => update({ gift: e.target.checked })} className="size-4 cursor-pointer accent-tinta" />
          Só presentes
        </label>
        {hasFilters && (
          <button type="button" className={`${adminLink} min-h-10`} onClick={() => update({ search: "", from: null, to: null, paymentMethod: null, gift: false })}>
            Limpar filtros
          </button>
        )}
      </div>

      {orders.isPending && <p className="text-sm text-tinta-suave">Carregando os pedidos…</p>}
      {orders.isError && <FormAlert kind="error">{errorMessage(orders.error)}</FormAlert>}
      {page && page.items.length === 0 && (
        <EmptyState>
          {filters.status === "PaymentConfirmed" && !hasFilters ? "Nenhum pedido pago esperando separação." : "Nenhum pedido com esses filtros."}
        </EmptyState>
      )}

      {page && page.items.length > 0 && (
        <>
          <div aria-hidden="true" className="hidden grid-cols-[minmax(9rem,1fr)_minmax(10rem,1.4fr)_minmax(12rem,2fr)_7rem_9rem_10rem] gap-4 border-b border-tinta/30 pb-2 text-xs font-medium uppercase tracking-[0.12em] text-tinta-suave xl:grid">
            <span>Pedido</span><span>Cliente</span><span>Peças</span><span className="text-right">Total</span><span>Pagamento</span><span>Situação</span>
          </div>
          <ul className={`border-t border-tinta/30 xl:border-t-0 ${orders.isFetching ? "opacity-70" : ""}`}>
            {page.items.map((order) => (
              <li key={order.id} className="border-b border-linha">
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 hover:bg-linha/30 xl:grid-cols-[minmax(9rem,1fr)_minmax(10rem,1.4fr)_minmax(12rem,2fr)_7rem_9rem_10rem] xl:items-center xl:gap-4"
                >
                  <span className="min-w-0">
                    <span className="numeros block font-medium">{order.number}</span>
                    <span className="numeros block text-xs text-tinta-suave">{formatDateTime(order.placedAt)}</span>
                  </span>
                  <span className="text-right xl:order-last xl:text-left"><OrderStatusTag status={order.status} /></span>
                  <span className="col-span-2 min-w-0 xl:col-span-1">
                    <span className="block truncate text-sm">{order.customerName}</span>
                    <span className="block truncate text-xs text-tinta-suave">{order.customerEmail}</span>
                  </span>
                  <span className="col-span-2 flex min-w-0 items-center gap-3 xl:col-span-1">
                    <span className="relative block size-10 shrink-0 overflow-hidden bg-linha/60">
                      {order.firstImageUrl && <Image src={order.firstImageUrl} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {order.firstProductName}
                        {order.itemCount > 1 && <span className="text-tinta-suave"> e mais {order.itemCount - 1}</span>}
                      </span>
                      {order.isGift && <GiftTag />}
                    </span>
                  </span>
                  <span className="numeros text-sm xl:text-right">{formatPrice(order.total)}</span>
                  <span className="text-right text-xs text-tinta-suave xl:text-left xl:text-sm">
                    {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "—"}
                    {order.trackingCode && <span className="numeros block text-xs">{order.trackingCode}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page.page} totalPages={page.totalPages} onPage={(next) => update({ page: next })} />
        </>
      )}

      <GiftWrapSettings />
    </>
  );
}

function Tab({ current, label, count, onClick }: { current: boolean; label: string; count: number | undefined; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={onClick}
      className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${
        current ? "border-tinta font-medium" : "border-transparent text-tinta-suave hover:text-tinta"
      }`}
    >
      {label}
      {count !== undefined && <span className={`numeros min-w-6 px-1 text-center text-xs ${current ? "bg-tinta text-cartela" : "bg-linha"}`}>{count}</span>}
    </button>
  );
}

/** Valor da embalagem para presente (RF-047 CA2): pendente da Fase 4, mora junto dos pedidos. */
function GiftWrapSettings() {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const settings = useQuery({ queryKey: backofficeKeys.orderingSettings, queryFn: backofficeApi.orderingSettings });
  const save = useMutation({
    mutationFn: (price: number) => backofficeApi.saveOrderingSettings(price),
    onSuccess: () => {
      setEditing(false);
      void client.invalidateQueries({ queryKey: backofficeKeys.orderingSettings });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(value.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(price) || price < 0 || price > 1000 || Math.round(price * 100) !== price * 100) {
      setProblem("Informe um valor entre R$ 0 e R$ 1.000, com até duas casas.");
      return;
    }
    setProblem(null);
    save.mutate(price);
  }

  const price = settings.data?.giftWrapPrice;

  return (
    <section aria-labelledby="embalagem-titulo" className="mt-10 border-t border-linha pt-5">
      <h2 id="embalagem-titulo" className="text-xs font-medium uppercase tracking-[0.16em]">Embalagem para presente</h2>
      {!editing && (
        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span>{price === undefined ? "…" : price === 0 ? "Grátis" : formatPrice(price)} por pedido. Mudar o valor não altera pedidos já feitos.</span>
          <button type="button" className={adminLink} onClick={() => { setValue(price ? String(price).replace(".", ",") : "0"); setEditing(true); }}>Mudar valor</button>
        </p>
      )}
      {editing && (
        <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.12em]">
            Valor (R$)
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" autoFocus className={`${cellInput} numeros mt-1 w-28 text-base`} />
          </label>
          <button type="submit" disabled={save.isPending} className={adminButtonGhost}>Salvar</button>
          <button type="button" className={adminLink} onClick={() => setEditing(false)}>Cancelar</button>
          {(problem || save.isError) && <p role="alert" className="basis-full text-sm text-alerta">{problem ?? errorMessage(save.error)}</p>}
        </form>
      )}
    </section>
  );
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type StockFilters, type StockItem, type StockMovement, type StockMovementType, type StockScanResult } from "../api";
import { parseMovementQuantity } from "../validation";
import { BarcodeScanner } from "./BarcodeScanner";
import { PageHeader, adminButton, adminButtonGhost, adminLink, cellInput } from "./ui";

const MOVEMENT_LABELS: Record<StockMovement["type"], string> = {
  In: "Entrada",
  Out: "Saída",
  Adjustment: "Ajuste",
  OrderPlaced: "Pedido",
  OrderCancelled: "Pedido cancelado",
};

const REASONS: Record<StockMovementType, string[]> = {
  In: ["Compra de fornecedor", "Devolução de cliente"],
  Out: ["Avaria", "Perda", "Venda fora do site", "Brinde"],
  Adjustment: ["Contagem de estoque"],
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

const variantName = (item: { colorName: string | null; sizeName: string | null }) =>
  [item.colorName, item.sizeName].filter(Boolean).join(" · ") || "Variação única";

const signed = (quantity: number) => (quantity > 0 ? `+${quantity}` : `${quantity}`.replace("-", "−"));

/** RF-052: saldo por variação, entrada, saída, ajuste e histórico. RF-059: entrada por leitura de código de barras. */
export function StockPanel() {
  const client = useQueryClient();
  const params = useSearchParams();
  const initialSearch = params.get("busca") ?? "";
  const [filters, setFilters] = useState<StockFilters>({ page: 1, search: initialSearch, lowStock: false });
  const [open, setOpen] = useState<{ variantId: string; view: "move" | "history" } | null>(null);
  const [scanning, setScanning] = useState(false);

  const stock = useQuery({
    queryKey: [...adminKeys.stock, filters],
    queryFn: () => adminApi.stock(filters),
    placeholderData: keepPreviousData,
  });

  const refresh = () => void client.invalidateQueries({ queryKey: adminKeys.stock });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(null);
    setFilters({ ...filters, page: 1, search: String(new FormData(event.currentTarget).get("q") ?? "").trim() });
  }

  const data = stock.data;

  return (
    <>
      <PageHeader
        title="Estoque"
        description="O saldo muda só por aqui, sempre com motivo. A peça aparece como esgotada na loja quando o saldo chega a zero."
        actions={<button type="button" className={adminButton} onClick={() => setScanning(true)}>Entrada por leitura</button>}
      />

      {scanning && <ScanDialog onRead={refresh} onClose={() => setScanning(false)} />}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <form onSubmit={search} role="search" className="flex min-w-60 flex-1 items-end gap-2">
          <label htmlFor="busca-estoque" className="sr-only">Buscar por nome, SKU ou código de barras</label>
          <input
            id="busca-estoque"
            name="q"
            type="search"
            defaultValue={initialSearch}
            placeholder="Nome, SKU ou código de barras"
            className={`${cellInput} min-h-10 placeholder:text-tinta-suave`}
          />
          <button type="submit" className={adminButtonGhost}>Buscar</button>
        </form>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.lowStock}
            onChange={(event) => setFilters({ ...filters, page: 1, lowStock: event.target.checked })}
            className="size-4 cursor-pointer accent-tinta"
          />
          Só estoque baixo
        </label>
      </div>

      {stock.isPending && <p className="text-sm text-tinta-suave">Carregando o estoque…</p>}
      {stock.isError && <FormAlert kind="error">{errorMessage(stock.error)}</FormAlert>}
      {data && data.items.length === 0 && (
        <p className="border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">
          {filters.lowStock ? "Nenhuma peça à venda com estoque baixo." : filters.search ? "Nenhuma variação com essa busca." : "Nenhuma variação ainda. Monte a grade no cadastro do produto."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="border-t border-tinta/30">
          {data.items.map((item) => (
            <StockRow
              key={item.variantId}
              item={item}
              view={open?.variantId === item.variantId ? open.view : null}
              onView={(view) => setOpen(view ? { variantId: item.variantId, view } : null)}
              onMoved={refresh}
            />
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-4 flex items-center gap-3 text-sm">
          <button type="button" className={adminButtonGhost} disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</button>
          <span className="numeros text-tinta-suave">Página {data.page} de {data.totalPages}</span>
          <button type="button" className={adminButtonGhost} disabled={filters.page >= data.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Próxima</button>
        </nav>
      )}
    </>
  );
}

interface StockRowProps {
  item: StockItem;
  view: "move" | "history" | null;
  onView: (view: "move" | "history" | null) => void;
  onMoved: () => void;
}

function StockRow({ item, view, onView, onMoved }: StockRowProps) {
  const isLow = item.isActive && item.quantityOnHand > 0 && item.quantityOnHand <= item.lowStockThreshold;

  return (
    <li className="border-b border-linha py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/admin/produtos/${item.productId}`} className="flex min-w-0 flex-1 basis-64 items-center gap-3 hover:underline">
          <span className="relative block size-11 shrink-0 overflow-hidden bg-linha/60">
            {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{item.productName}</span>
            <span className="numeros block truncate text-xs text-tinta-suave">{variantName(item)} · {item.sku}</span>
          </span>
        </Link>

        <p className="w-28 text-right">
          <span className="numeros block text-xl leading-tight">{item.quantityOnHand}</span>
          <span className={`block text-xs ${item.quantityOnHand === 0 && item.isActive ? "text-alerta" : "text-tinta-suave"}`}>
            {!item.isActive ? "Fora da loja" : item.quantityOnHand === 0 ? "Esgotada" : isLow ? "Estoque baixo" : "em estoque"}
          </span>
        </p>

        <div className="flex items-center gap-4">
          <button type="button" className={adminLink} aria-expanded={view === "move"} onClick={() => onView(view === "move" ? null : "move")}>
            Movimentar<span className="sr-only"> {item.productName}, {variantName(item)}</span>
          </button>
          <button type="button" className={adminLink} aria-expanded={view === "history"} onClick={() => onView(view === "history" ? null : "history")}>
            Histórico<span className="sr-only"> de {item.productName}, {variantName(item)}</span>
          </button>
        </div>
      </div>

      {view === "move" && <MovementForm item={item} onMoved={onMoved} onCancel={() => onView(null)} />}
      {view === "history" && <MovementHistory variantId={item.variantId} />}
    </li>
  );
}

function MovementForm({ item, onMoved, onCancel }: { item: StockItem; onMoved: () => void; onCancel: () => void }) {
  const [type, setType] = useState<StockMovementType>("In");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const move = useMutation({
    mutationFn: (amount: number) => adminApi.moveStock(item.variantId, type, amount, reason.trim()),
    onSuccess: ({ quantityOnHand }) => {
      setNotice(`Saldo agora: ${quantityOnHand}.`);
      setQuantity("");
      setReason("");
      onMoved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    move.reset();
    const amount = parseMovementQuantity(type, quantity);
    if (amount === null) {
      setFieldError(type === "Adjustment" ? "Informe o total contado, em números inteiros." : "Informe uma quantidade inteira, maior que zero.");
      return;
    }
    if (!reason.trim()) {
      setFieldError("Informe o motivo.");
      return;
    }
    setFieldError(null);
    move.mutate(amount);
  }

  const listId = `motivos-${item.variantId}`;

  return (
    <form onSubmit={submit} noValidate className="mt-3 border border-tinta/30 p-4">
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.12em]">Tipo</legend>
        <div className="mt-1 flex flex-wrap gap-x-5">
          {(["In", "Out", "Adjustment"] as const).map((option) => (
            <label key={option} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={`tipo-${item.variantId}`}
                checked={type === option}
                onChange={() => {
                  setType(option);
                  setFieldError(null);
                }}
                className="size-4 cursor-pointer accent-tinta"
              />
              {MOVEMENT_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="w-36 text-xs font-medium uppercase tracking-[0.12em]">
          {type === "Adjustment" ? "Total contado" : "Quantidade"}
          <input value={quantity} inputMode="numeric" autoComplete="off" onChange={(e) => setQuantity(e.target.value)} className={`${cellInput} numeros mt-1 text-base normal-case tracking-normal`} />
        </label>
        <label className="min-w-52 flex-1 text-xs font-medium uppercase tracking-[0.12em]">
          Motivo
          <input value={reason} list={listId} maxLength={200} autoComplete="off" onChange={(e) => setReason(e.target.value)} className={`${cellInput} mt-1 text-base normal-case tracking-normal`} />
          <datalist id={listId}>
            {REASONS[type].map((option) => <option key={option} value={option} />)}
          </datalist>
        </label>
        <button type="submit" className={adminButton} disabled={move.isPending} aria-busy={move.isPending}>
          {move.isPending ? "Salvando…" : "Registrar"}
        </button>
        <button type="button" className={adminButtonGhost} onClick={onCancel}>Fechar</button>
      </div>

      {type === "Adjustment" && <p className="mt-2 text-xs text-tinta-suave">Saldo atual: <span className="numeros">{item.quantityOnHand}</span>. O histórico registra a diferença.</p>}
      {fieldError && <p role="alert" className="mt-2 text-sm text-alerta">{fieldError}</p>}
      {move.isError && <p role="alert" className="mt-2 text-sm text-alerta">{errorMessage(move.error)}</p>}
      <p role="status" className="mt-2 text-sm text-tinta-suave empty:hidden">{notice}</p>
    </form>
  );
}

function MovementHistory({ variantId }: { variantId: string }) {
  const [page, setPage] = useState(1);
  const history = useQuery({
    queryKey: [...adminKeys.stock, "movements", variantId, page],
    queryFn: () => adminApi.stockMovements(variantId, page),
    placeholderData: keepPreviousData,
  });
  const data = history.data;

  return (
    <div className="mt-3 border border-tinta/30 p-4">
      {history.isPending && <p className="text-sm text-tinta-suave">Carregando o histórico…</p>}
      {history.isError && <FormAlert kind="error">{errorMessage(history.error)}</FormAlert>}
      {data && data.items.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma movimentação registrada. O histórico começa nesta versão do painel.</p>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                <th scope="col" className="py-1.5 pr-3 font-medium">Quando</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Tipo</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">Variação</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Motivo</th>
                <th scope="col" className="py-1.5 font-medium">Quem</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((movement) => (
                <tr key={movement.id} className="border-b border-linha align-top">
                  <td className="numeros whitespace-nowrap py-1.5 pr-3">{dateFormat.format(new Date(movement.createdAt))}</td>
                  <td className="py-1.5 pr-3">{MOVEMENT_LABELS[movement.type]}</td>
                  <td className="numeros py-1.5 pr-3 text-right">{signed(movement.quantity)}</td>
                  <td className="py-1.5 pr-3">{movement.reason ?? "—"}</td>
                  <td className="py-1.5 text-tinta-suave">{movement.performedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação do histórico" className="mt-3 flex items-center gap-3 text-sm">
          <button type="button" className={adminLink} disabled={page <= 1} onClick={() => setPage(page - 1)}>Mais recentes</button>
          <span className="numeros text-tinta-suave">Página {data.page} de {data.totalPages}</span>
          <button type="button" className={adminLink} disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Mais antigas</button>
        </nav>
      )}
    </div>
  );
}

type ScanRead =
  | { key: number; kind: "done"; result: StockScanResult; quantity: number; undone: boolean }
  | { key: number; kind: "unknown"; code: string }
  | { key: number; kind: "error"; code: string; message: string };

const MAX_READS_SHOWN = 8;

/** RF-059: o diálogo fica aberto e cada leitura soma. A leitura repetida é de propósito, por isso nada é reenviado sozinho. */
function ScanDialog({ onRead, onClose }: { onRead: () => void; onClose: () => void }) {
  const [quantity, setQuantity] = useState("1");
  const [reads, setReads] = useState<ScanRead[]>([]);
  const [undoError, setUndoError] = useState<string | null>(null);
  const perRead = parseMovementQuantity("In", quantity);

  const add = (read: ScanRead) => setReads((current) => [read, ...current].slice(0, MAX_READS_SHOWN));

  async function scan(code: string) {
    const key = Date.now() + Math.random();
    if (perRead === null) {
      add({ key, kind: "error", code, message: "Quantidade por leitura inválida: nada foi somado." });
      return;
    }
    try {
      const result = await adminApi.scanStock(code, perRead);
      add({ key, kind: "done", result, quantity: perRead, undone: false });
      onRead();
    } catch (error) {
      add(error instanceof ApiError && error.status === 404 ? { key, kind: "unknown", code } : { key, kind: "error", code, message: errorMessage(error) });
    }
  }

  async function undo(read: Extract<ScanRead, { kind: "done" }>) {
    setUndoError(null);
    try {
      await adminApi.moveStock(read.result.variantId, "Out", read.quantity, "Leitura desfeita");
      setReads((current) => current.map((item) => (item.key === read.key && item.kind === "done" ? { ...item, undone: true } : item)));
      onRead();
    } catch (error) {
      setUndoError(errorMessage(error));
    }
  }

  return (
    <BarcodeScanner continuous onCode={(code) => void scan(code)} onClose={onClose}>
      <label className="mt-4 flex items-center justify-between gap-3 text-sm">
        Quantidade por leitura
        <input value={quantity} inputMode="numeric" autoComplete="off" onChange={(e) => setQuantity(e.target.value)} className={`${cellInput} numeros w-20 text-right text-base`} />
      </label>

      {undoError && <p role="alert" className="mt-3 text-sm text-alerta">{undoError}</p>}

      <ul aria-label="Últimas leituras" aria-live="polite" className="mt-3 max-h-56 overflow-y-auto border-t border-linha empty:hidden">
        {reads.map((read) => (
          <li key={read.key} className="border-b border-linha py-2 text-sm">
            {read.kind === "done" && (
              <div className="flex items-start justify-between gap-3">
                <p className={read.undone ? "text-tinta-suave line-through" : ""}>
                  <span className="font-medium">{read.result.productName}</span>
                  <span className="numeros block text-xs text-tinta-suave">{variantName(read.result)} · +{read.quantity} · saldo {read.result.quantityOnHand}</span>
                </p>
                {read.undone ? <span className="shrink-0 text-xs text-tinta-suave">Desfeita</span> : (
                  <button type="button" className={`${adminLink} shrink-0`} onClick={() => void undo(read)}>Desfazer</button>
                )}
              </div>
            )}
            {read.kind === "unknown" && (
              <p>
                <span className="numeros">{read.code}</span> não está em nenhuma variação.{" "}
                <Link href="/admin/produtos" className="underline">Vincular em Produtos</Link>
              </p>
            )}
            {read.kind === "error" && <p className="text-alerta"><span className="numeros">{read.code}</span>: {read.message}</p>}
          </li>
        ))}
      </ul>
    </BarcodeScanner>
  );
}

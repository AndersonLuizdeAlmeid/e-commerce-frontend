"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { sombraCartela } from "@/features/catalog/components/Cartela";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { BagIcon } from "@/shared/ui/icons";
import { cartApi, type CartItem, type CartView } from "../api";
import { cartErrorMessage, useCart } from "../CartProvider";
import { MAX_QUANTITY_PER_ITEM, localCart, removeLine } from "../local-cart";

const UNDO_MS = 6000;

const quantityButton =
  "grid size-11 place-items-center text-lg leading-none transition-colors hover:bg-linha/70 disabled:opacity-40 disabled:hover:bg-transparent";

/** RF-030: cartelas pequenas, preço sempre atual e os avisos de estoque (specs/26 §4.5). */
export function CartPage() {
  const { mode, localLines, customerCart, refresh, setQuantity, remove, add, skippedOnMerge } = useCart();
  const { status, user } = useAuth();
  const [localView, setLocalView] = useState<CartView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [removed, setRemoved] = useState<CartItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  // Visitante: preço, foto e disponibilidade vêm da API a cada mudança. Variação que deixou de existir sai da sacola.
  useEffect(() => {
    if (mode !== "local") {
      return;
    }
    let active = true;
    cartApi
      .lookup(localLines)
      .then((view) => {
        if (!active) {
          return;
        }
        setLocalView(view);
        const known = new Set(view.items.map((item) => item.variantId));
        const gone = localLines.filter((line) => !known.has(line.variantId));
        if (gone.length > 0) {
          localCart.write(gone.reduce((lines, line) => removeLine(lines, line.variantId), localLines));
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(errorMessage(e));
        }
      });
    return () => {
      active = false;
    };
  }, [mode, localLines]);

  // Cliente: ao abrir a sacola, o preço e o saldo de agora, não os de quando ela foi carregada (RF-030 CA3).
  useEffect(() => {
    if (mode === "customer") {
      refresh().catch((e: unknown) => setError(errorMessage(e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `refresh` muda a cada resposta; só interessa ao abrir.
  }, [mode]);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  async function run(variantId: string, action: () => Promise<void>) {
    setError(null);
    setPending(variantId);
    try {
      await action();
    } catch (e) {
      setError(cartErrorMessage(e));
    } finally {
      setPending(null);
    }
  }

  function removeItem(item: CartItem) {
    void run(item.variantId, async () => {
      await remove(item.variantId);
      setRemoved(item);
      window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setRemoved(null), UNDO_MS);
    });
  }

  function undoRemove(item: CartItem) {
    window.clearTimeout(undoTimer.current);
    setRemoved(null);
    void run(item.variantId, () => add(item.variantId, item.quantity));
  }

  const view = mode === "customer" ? customerCart : localLines.length === 0 ? { items: [], subtotal: 0 } : localView;
  const loading = status === "loading" || view === null;
  const blocked = view?.items.some((item) => item.status !== "Available") ?? false;

  function checkout() {
    setNotice("A compra online chega na próxima etapa da loja. Sua sacola fica guardada.");
  }

  return (
    <article className="vitrine flex-1">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <h1 className="font-display text-4xl leading-[1.04] tracking-[-0.02em] sm:text-5xl">Sua sacola</h1>

        <div aria-live="polite" className="mt-4 space-y-2 empty:hidden">
          {removed && (
            <p className="flex flex-wrap items-center gap-x-3 text-sm">
              {removed.productName} saiu da sacola.
              <button type="button" className="inline-flex min-h-11 items-center font-medium underline" onClick={() => undoRemove(removed)}>Desfazer</button>
            </p>
          )}
          {skippedOnMerge > 0 && (
            <p className="text-sm">
              {skippedOnMerge === 1 ? "Uma peça da sua sacola anterior não está mais disponível." : `${skippedOnMerge} peças da sua sacola anterior não estão mais disponíveis.`}
            </p>
          )}
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium">{error}</p>}

        {loading && !error && <p role="status" className="mt-8 text-sm text-vitrine-texto">Abrindo a sacola…</p>}

        {view && view.items.length === 0 && !loading && (
          <div className={`cartela mx-auto mt-8 max-w-sm rounded-[3px] px-6 pb-8 pt-8 text-center ${sombraCartela}`}>
            <BagIcon aria-hidden="true" className="mx-auto size-16 text-tinta-suave [stroke-width:1]" />
            <p className="mt-4 font-display text-2xl leading-snug text-balance">Sua sacola está vazia.</p>
            <Link href="/" className="mt-5 inline-flex min-h-11 items-center bg-tinta px-6 pt-0.5 text-sm font-medium uppercase tracking-[0.18em] text-cartela transition-colors hover:bg-grafite">
              Ver novidades
            </Link>
          </div>
        )}

        {view && view.items.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <ul className="space-y-4">
              {view.items.map((item) => (
                <CartRow
                  key={item.variantId}
                  item={item}
                  busy={pending === item.variantId}
                  onQuantity={(quantity) => void run(item.variantId, () => setQuantity(item.variantId, quantity))}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </ul>

            <aside className={`cartela rounded-[3px] p-5 ${sombraCartela}`}>
              <p className="flex items-baseline justify-between gap-4">
                <span className="text-sm">Subtotal</span>
                <span className="numeros font-display text-2xl">{formatPrice(view.subtotal)}</span>
              </p>
              <p className="mt-1 text-xs text-tinta-suave">O frete aparece aqui quando o cálculo por CEP entrar na loja.</p>

              {blocked ? (
                <p className="mt-5 text-sm font-medium">Ajuste as peças destacadas para seguir.</p>
              ) : mode === "local" && user?.role !== "Admin" ? (
                <Link href="/login?next=/carrinho" className="mt-5 flex min-h-12 items-center justify-center bg-tinta px-4 pt-0.5 text-sm font-medium uppercase tracking-[0.18em] text-cartela transition-colors hover:bg-grafite">
                  Finalizar compra
                </Link>
              ) : (
                <button type="button" onClick={checkout} className="mt-5 flex min-h-12 w-full items-center justify-center bg-tinta px-4 pt-0.5 text-sm font-medium uppercase tracking-[0.18em] text-cartela transition-colors hover:bg-grafite">
                  Finalizar compra
                </button>
              )}
              <p role="status" className="mt-3 text-sm empty:hidden">{notice}</p>
            </aside>
          </div>
        )}
      </div>
    </article>
  );
}

function CartRow({ item, busy, onQuantity, onRemove }: { item: CartItem; busy: boolean; onQuantity: (quantity: number) => void; onRemove: () => void }) {
  const sellable = item.status === "Available" || item.status === "InsufficientStock";
  const details = [
    item.colorName && `${item.variantLabels.color}: ${item.colorName}`,
    item.sizeName && `${item.variantLabels.size}: ${item.sizeName}`,
  ].filter(Boolean);

  return (
    <li className={`cartela flex gap-4 rounded-[3px] p-3 ${sombraCartela}`}>
      <Link href={`/produto/${item.productSlug}`} className="relative block size-24 shrink-0 overflow-hidden bg-linha/50 sm:size-28">
        {item.imageUrl && <Image src={item.imageUrl} alt={item.imageAlt ?? item.productName} fill sizes="112px" className={`object-cover ${sellable ? "" : "opacity-50 grayscale"}`} />}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="font-display text-lg leading-tight">
            <Link href={`/produto/${item.productSlug}`} className="hover:underline">{item.productName}</Link>
          </h2>
          {sellable && <p className="numeros text-base font-medium">{formatPrice(item.lineTotal)}</p>}
        </div>
        {details.length > 0 && <p className="numeros mt-1 text-sm text-tinta-suave">{details.join(" · ")}</p>}

        {item.status === "OutOfStock" && <StockWarning>Esgotou. Tire da sacola para seguir.</StockWarning>}
        {item.status === "Unavailable" && <StockWarning>Saiu da loja. Tire da sacola para seguir.</StockWarning>}
        {item.status === "InsufficientStock" && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm font-medium">
            {item.availableQuantity === 1 ? "Só resta 1." : `Só restam ${item.availableQuantity}.`}
            <button type="button" className="inline-flex min-h-11 items-center underline disabled:opacity-60" disabled={busy} onClick={() => onQuantity(item.availableQuantity ?? 1)}>
              Ajustar para {item.availableQuantity}
            </button>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {sellable ? (
            <div role="group" aria-label={`Quantidade de ${item.productName}`} className="numeros flex items-center border border-tinta/30">
              <button type="button" aria-label="Diminuir" className={quantityButton} disabled={busy || item.quantity <= 1} onClick={() => onQuantity(item.quantity - 1)}>−</button>
              <span aria-live="polite" className="w-8 text-center text-sm">{item.quantity}</span>
              <button type="button" aria-label="Aumentar" className={quantityButton} disabled={busy || item.quantity >= MAX_QUANTITY_PER_ITEM} onClick={() => onQuantity(item.quantity + 1)}>+</button>
            </div>
          ) : <span />}
          <button type="button" className="inline-flex min-h-11 items-center text-sm underline disabled:opacity-60" disabled={busy} onClick={onRemove}>
            Remover<span className="sr-only"> {item.productName}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/** O furo vazio é a linguagem do esgotado na cartela (specs/26 §2.4); o texto é quem informa. */
function StockWarning({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
      <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-dashed border-current" />
      {children}
    </p>
  );
}

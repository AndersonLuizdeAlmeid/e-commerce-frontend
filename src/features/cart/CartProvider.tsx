"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/shared/api/problem";
import { cartApi, type CartView } from "./api";
import { MAX_ITEMS, MAX_QUANTITY_PER_ITEM, addLine, countPieces, localCart, removeLine, setLineQuantity, type CartLine } from "./local-cart";

interface CartContextValue {
  /** Cliente logado usa a API; visitante e admin, que não tem sacola na API (policy Customer), usam o navegador. */
  mode: "customer" | "local";
  localLines: CartLine[];
  /** Sacola do cliente; nula até a primeira resposta. */
  customerCart: CartView | null;
  count: number;
  /** Quantas peças da sacola do visitante não entraram na do cliente ao fazer login. */
  skippedOnMerge: number;
  add: (variantId: string, quantity?: number) => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

let syncing: Promise<{ cart: CartView; skipped: number }> | null = null;

/** Ao entrar: traz a sacola do visitante (RF-031). A cópia local só some depois do sucesso; se falhar, tenta no próximo acesso. */
function syncCustomerCart() {
  syncing ??= (async () => {
    const lines = localCart.getSnapshot();
    if (lines.length === 0) {
      return { cart: await cartApi.get(), skipped: 0 };
    }
    try {
      const merged = await cartApi.merge(lines);
      localCart.write([]);
      return { cart: merged.cart, skipped: merged.skippedVariantIds.length };
    } catch {
      return { cart: await cartApi.get(), skipped: 0 };
    }
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

const LIMIT_MESSAGES = {
  quantity: `A quantidade por peça vai até ${MAX_QUANTITY_PER_ITEM}.`,
  items: `A sacola tem até ${MAX_ITEMS} peças diferentes.`,
};

class CartLimitReached extends Error {}

/** O limite da sacola local já traz o texto; o resto vem da API ou da rede. */
export function cartErrorMessage(error: unknown): string {
  return error instanceof CartLimitReached ? error.message : errorMessage(error);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const localLines = useSyncExternalStore(localCart.subscribe, localCart.getSnapshot, localCart.getServerSnapshot);
  const customerId = status === "authenticated" && user?.role === "Customer" ? user.id : null;
  const [loaded, setLoaded] = useState<{ customerId: string; cart: CartView; skipped: number } | null>(null);

  // A sacola carregada só vale para quem a carregou: trocar de conta nunca mostra a da conta anterior.
  const current = customerId !== null && loaded?.customerId === customerId ? loaded : null;

  useEffect(() => {
    if (customerId === null) {
      return;
    }
    let active = true;
    syncCustomerCart()
      .then(({ cart, skipped }) => {
        if (active) {
          setLoaded({ customerId, cart, skipped });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [customerId]);

  const apply = useCallback(
    (cart: CartView) => {
      if (customerId !== null) {
        setLoaded((previous) => ({ customerId, cart, skipped: previous?.customerId === customerId ? previous.skipped : 0 }));
      }
    },
    [customerId],
  );

  const value = useMemo<CartContextValue>(() => {
    const isCustomer = customerId !== null;
    return {
      mode: isCustomer ? "customer" : "local",
      localLines,
      customerCart: current?.cart ?? null,
      count: isCustomer ? countPieces(current?.cart.items ?? []) : countPieces(localLines),
      skippedOnMerge: current?.skipped ?? 0,
      add: async (variantId, quantity = 1) => {
        if (isCustomer) {
          apply(await cartApi.add(variantId, quantity));
          return;
        }
        const next = addLine(localCart.getSnapshot(), variantId, quantity);
        if (typeof next === "string") {
          throw new CartLimitReached(LIMIT_MESSAGES[next]);
        }
        localCart.write(next);
      },
      setQuantity: async (variantId, quantity) => {
        if (isCustomer) {
          apply(await cartApi.setQuantity(variantId, quantity));
        } else {
          localCart.write(setLineQuantity(localCart.getSnapshot(), variantId, quantity));
        }
      },
      remove: async (variantId) => {
        if (isCustomer) {
          apply(await cartApi.remove(variantId));
        } else {
          localCart.write(removeLine(localCart.getSnapshot(), variantId));
        }
      },
      refresh: async () => {
        if (isCustomer) {
          apply(await cartApi.get());
        }
      },
    };
  }, [customerId, localLines, current, apply]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart precisa estar dentro do CartProvider.");
  }
  return context;
}

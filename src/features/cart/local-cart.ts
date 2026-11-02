/**
 * Sacola de quem não é cliente logado (arquivo 16 §6): só variação e quantidade, no `localStorage`. Preço e
 * disponibilidade nunca ficam aqui. As funções de lista são puras e testadas; o armazenamento pode faltar
 * (janela privada, dados bloqueados), e nesse caso a sacola dura até fechar a aba.
 */
export interface CartLine {
  variantId: string;
  quantity: number;
}

export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_ITEMS = 50;

const STORAGE_KEY = "mo-sacola";

export type CartLimitError = "quantity" | "items";

/** Conteúdo adulterado ou de outra versão não pode derrubar a loja: o que não for válido é ignorado. */
export function parseLines(raw: string | null): CartLine[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const lines = new Map<string, number>();
    for (const entry of parsed) {
      const { variantId, quantity } = (entry ?? {}) as Partial<CartLine>;
      if (typeof variantId === "string" && Number.isInteger(quantity) && (quantity as number) >= 1 && lines.size < MAX_ITEMS) {
        lines.set(variantId, Math.min((lines.get(variantId) ?? 0) + (quantity as number), MAX_QUANTITY_PER_ITEM));
      }
    }
    return [...lines].map(([variantId, quantity]) => ({ variantId, quantity }));
  } catch {
    return [];
  }
}

export function addLine(lines: CartLine[], variantId: string, quantity: number): CartLine[] | CartLimitError {
  const current = lines.find((line) => line.variantId === variantId);
  if (current) {
    return current.quantity + quantity > MAX_QUANTITY_PER_ITEM
      ? "quantity"
      : lines.map((line) => (line === current ? { ...line, quantity: line.quantity + quantity } : line));
  }
  if (lines.length >= MAX_ITEMS) {
    return "items";
  }
  return quantity > MAX_QUANTITY_PER_ITEM ? "quantity" : [...lines, { variantId, quantity }];
}

export function setLineQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  const clamped = Math.min(Math.max(quantity, 1), MAX_QUANTITY_PER_ITEM);
  return lines.map((line) => (line.variantId === variantId ? { ...line, quantity: clamped } : line));
}

export function removeLine(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((line) => line.variantId !== variantId);
}

export function countPieces(lines: readonly { quantity: number }[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

const EMPTY: CartLine[] = [];
let cached: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): CartLine[] {
  try {
    return parseLines(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** Loja externa para `useSyncExternalStore`: outra aba mexeu na sacola, esta acompanha. */
export const localCart = {
  getSnapshot(): CartLine[] {
    cached ??= readStorage();
    return cached;
  },
  getServerSnapshot(): CartLine[] {
    return EMPTY;
  },
  subscribe(listener: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        cached = null;
        notify();
      }
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  write(lines: CartLine[]) {
    cached = lines;
    try {
      if (lines.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
      }
    } catch {
      // Sem armazenamento, a sacola continua em memória até fechar a aba.
    }
    notify();
  },
};

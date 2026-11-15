"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { orderStatusLabel } from "@/features/orders/gift";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import type { OrderStatus } from "../backoffice";
import { adminButton, adminButtonGhost } from "./ui";

/** Peças da Fase 5 no modo Operate (arquivo 26 §4.8): densas, a marca só nos detalhes. */

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatShortDate = (iso: string) => dateOnly.format(new Date(iso));

/** Ponto da situação: folha no que pede ação da loja, tracejado no que já terminou. O texto é quem informa. */
const STATUS_MARK: Record<OrderStatus, string> = {
  PendingPayment: "border border-tinta-suave",
  PaymentConfirmed: "bg-folha",
  Preparing: "bg-folha",
  Shipped: "bg-tinta",
  Delivered: "border border-dashed border-tinta-suave",
  Cancelled: "border border-dashed border-alerta",
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${STATUS_MARK[status]}`} />
      <span className={status === "Cancelled" ? "text-alerta" : status === "Delivered" ? "text-tinta-suave" : ""}>{orderStatusLabel(status)}</span>
    </span>
  );
}

/** "Presente" na linha do pedido (arquivo 26 §4.8): a loja vê de longe o que precisa de embalagem e cartão. */
export function GiftTag() {
  return <span className="inline-flex items-center border border-folha px-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ouro-tinta">Presente</span>;
}

interface ModalProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/** Diálogo nativo (foco preso, Esc fecha), no mesmo desenho do leitor de código de barras. */
export function Modal({ title, description, onClose, children }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-cartela p-5 text-tinta shadow-[0_24px_48px_-16px_rgb(0_0_0/0.5)] backdrop:bg-tinta/50"
    >
      <h2 id={titleId} className="font-display text-2xl leading-tight">{title}</h2>
      {description && <div className="mt-2 text-sm text-tinta-suave">{description}</div>}
      {children}
    </dialog>
  );
}

interface ReasonDialogProps {
  title: string;
  description: ReactNode;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  danger?: boolean;
  /** Sem campo de texto: só a confirmação (ativar, promover...). */
  withoutReason?: boolean;
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Confirmação com motivo (cancelar, confirmar pagamento à mão, marcar devolução). O erro da API aparece aqui dentro, e
 * o diálogo só fecha quando a ação passou.
 */
export function ReasonDialog({ title, description, label, placeholder, confirmLabel, danger, withoutReason, onConfirm, onClose }: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fieldId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!withoutReason && reason.trim().length === 0) {
      setError("Escreva o motivo: ele fica no histórico.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (failure) {
      setError(Object.values(fieldErrors(failure))[0] ?? errorMessage(failure));
      setPending(false);
    }
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="mt-4">
        {!withoutReason && (
          <>
            <label htmlFor={fieldId} className="block text-xs font-medium uppercase tracking-[0.16em]">{label}</label>
            <textarea
              id={fieldId}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              autoFocus
              placeholder={placeholder}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-erro` : undefined}
              className="mt-1.5 block w-full border border-tinta/40 bg-transparent p-2 text-base placeholder:text-tinta-suave/70 focus-visible:border-tinta focus-visible:outline-none"
            />
          </>
        )}
        {error && <p id={`${fieldId}-erro`} role="alert" className="mt-2 text-sm text-alerta">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className={adminButtonGhost} onClick={onClose}>Voltar</button>
          <button type="submit" disabled={pending} className={danger ? `${adminButton} bg-alerta hover:bg-alerta/90` : adminButton}>
            {pending ? "Enviando…" : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Mensagem curta que some sozinha, para "Pedido marcado como enviado." */
export function useNotice(timeoutMs = 6000) {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [notice, timeoutMs]);
  return [notice, setNotice] as const;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mb-4 border-l-2 border-folha bg-linha/40 px-3 py-2 text-sm">
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">{children}</p>;
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginação" className="mt-4 flex items-center gap-3 text-sm">
      <button type="button" className={adminButtonGhost} disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
      <span className="numeros text-tinta-suave">Página {page} de {totalPages}</span>
      <button type="button" className={adminButtonGhost} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Próxima</button>
    </nav>
  );
}

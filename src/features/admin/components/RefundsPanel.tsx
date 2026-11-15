"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import { PAYMENT_METHOD_LABELS, backofficeApi, backofficeKeys, type PendingRefund, type PendingRefundKind } from "../backoffice";
import { EmptyState, Notice, ReasonDialog, formatDateTime, useNotice } from "./BackofficeUi";
import { PageHeader, adminButtonGhost, adminLink } from "./ui";

const KIND_TEXT: Record<PendingRefundKind, { title: string; help: string }> = {
  RefundFailed: {
    title: "O Mercado Pago recusou o estorno",
    help: "Tente de novo. Se continuar recusando, estorne pelo painel do Mercado Pago e depois toque em “Conferir no Mercado Pago”.",
  },
  RefundNotDone: {
    title: "O estorno não saiu",
    help: "O pedido foi cancelado e o pagamento continua aprovado: a plataforma ficou fora do ar nas tentativas. Tente de novo.",
  },
  ManualPayment: {
    title: "Pagamento confirmado à mão",
    help: "Esse dinheiro não passou pelo Mercado Pago: devolva à cliente por fora e registre aqui como foi.",
  },
};

/** Entrega 5 §3, P6: todo dinheiro preso de pedido cancelado, até ser devolvido. */
export function RefundsPanel() {
  const client = useQueryClient();
  const [notice, setNotice] = useNotice(8000);
  const [marking, setMarking] = useState<PendingRefund | null>(null);
  const refunds = useQuery({ queryKey: backofficeKeys.refunds, queryFn: backofficeApi.pendingRefunds });

  /** O estorno e a consulta vão pelo Outbox: a fila recarrega logo depois, quando a resposta da plataforma já chegou. */
  const refreshSoon = () => {
    void client.invalidateQueries({ queryKey: backofficeKeys.dashboard });
    window.setTimeout(() => void client.invalidateQueries({ queryKey: backofficeKeys.refunds }), 2500);
  };

  const act = useMutation({
    mutationFn: ({ refund, action }: { refund: PendingRefund; action: "Retry" | "Sync" }) =>
      action === "Retry" ? backofficeApi.retryRefund(refund.paymentId) : backofficeApi.syncPayment(refund.paymentId),
    onSuccess: (_, { refund, action }) => {
      setNotice(
        action === "Retry"
          ? `Estorno de ${refund.orderNumber} pedido de novo. A lista atualiza em instantes.`
          : `Conferindo ${refund.orderNumber} no Mercado Pago. A lista atualiza em instantes.`,
      );
      refreshSoon();
    },
  });

  return (
    <>
      <PageHeader
        title="Estornos pendentes"
        description="Dinheiro de pedido cancelado que ainda não voltou para a cliente. Some daqui quando o estorno é confirmado."
        actions={<button type="button" className={adminButtonGhost} onClick={() => void refunds.refetch()} disabled={refunds.isFetching}>Atualizar</button>}
      />

      {notice && <Notice>{notice}</Notice>}
      {act.isError && <FormAlert kind="error">{errorMessage(act.error)}</FormAlert>}
      {refunds.isPending && <p className="text-sm text-tinta-suave">Carregando…</p>}
      {refunds.isError && <FormAlert kind="error">{errorMessage(refunds.error)}</FormAlert>}
      {refunds.data && refunds.data.length === 0 && <EmptyState>Nenhum estorno pendente. Todo pagamento de pedido cancelado já voltou para a cliente.</EmptyState>}

      {refunds.data && refunds.data.length > 0 && (
        <ul className="border-t border-tinta/30">
          {refunds.data.map((refund) => {
            const text = KIND_TEXT[refund.kind];
            return (
              <li key={refund.paymentId} className="grid gap-x-6 gap-y-2 border-b border-linha py-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <Link href={`/admin/pedidos/${refund.orderId}`} className="numeros font-medium underline">{refund.orderNumber}</Link>
                    <span className="numeros text-lg">{formatPrice(refund.amount)}</span>
                    <span className="text-sm text-tinta-suave">{PAYMENT_METHOD_LABELS[refund.method]}</span>
                  </p>
                  <p className="text-sm">{refund.customerName} · <a href={`mailto:${refund.customerEmail}`} className="underline">{refund.customerEmail}</a></p>
                  <p className={`mt-2 text-sm font-medium ${refund.kind === "RefundFailed" ? "text-alerta" : ""}`}>{text.title}</p>
                  <p className="text-sm text-tinta-suave">{text.help}</p>
                  <p className="numeros mt-1 text-xs text-tinta-suave">
                    Cancelado em {formatDateTime(refund.cancelledAt)}
                    {refund.providerPaymentId && ` · Mercado Pago ${refund.providerPaymentId}`}
                    {refund.statusDetail && ` · ${refund.statusDetail}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  {refund.actions.includes("Retry") && (
                    <button type="button" className={adminButtonGhost} disabled={act.isPending} onClick={() => act.mutate({ refund, action: "Retry" })}>Tentar estornar de novo</button>
                  )}
                  {refund.actions.includes("Sync") && (
                    <button type="button" className={`${adminLink} min-h-10`} disabled={act.isPending} onClick={() => act.mutate({ refund, action: "Sync" })}>Conferir no Mercado Pago</button>
                  )}
                  {refund.actions.includes("MarkRefunded") && (
                    <button type="button" className={adminButtonGhost} onClick={() => setMarking(refund)}>Já devolvi</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {marking && (
        <ReasonDialog
          title={`Devolução de ${marking.orderNumber}`}
          description={`Registre como os ${formatPrice(marking.amount)} voltaram para ${marking.customerName}. O e-mail de estorno vai em seguida.`}
          label="Como foi devolvido"
          placeholder="Ex.: PIX para a chave da cliente em 15/11"
          confirmLabel="Registrar devolução"
          onConfirm={async (note) => {
            await backofficeApi.markRefunded(marking.paymentId, note);
            setNotice(`Devolução de ${marking.orderNumber} registrada.`);
            void client.invalidateQueries({ queryKey: backofficeKeys.refunds });
            void client.invalidateQueries({ queryKey: backofficeKeys.dashboard });
          }}
          onClose={() => setMarking(null)}
        />
      )}
    </>
  );
}

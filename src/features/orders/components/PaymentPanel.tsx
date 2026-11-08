"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert, primaryButtonClass } from "@/shared/ui/form";
import { ordersApi, type Payment } from "../api";
import { paymentCountdown } from "../gift";

/** Tempo entre consultas enquanto o QR está na tela (arquivo 26 §4.6: "atualização automática quando o pagamento cai"). */
const POLL_MS = 5_000;

/**
 * Pagamento do pedido (RF-044): PIX com QR grande, "Copiar código" e contagem do prazo. A tela só mostra o que a API
 * diz; a confirmação vem da plataforma pelo webhook (arquivo 21 §2), e esta tela só consulta até ela chegar.
 */
export function PaymentPanel({ orderId, onConfirmed }: { orderId: string; onConfirmed: () => void }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const idempotencyKey = useRef("");
  const confirmed = useRef(false);

  // Ao abrir: se já existe um PIX pendente, ele aparece direto.
  useEffect(() => {
    let active = true;
    ordersApi
      .currentPayment(orderId)
      .then((current) => active && setPayment(current))
      .catch((err: unknown) => {
        if (active && !(err instanceof ApiError && err.status === 404)) {
          setError(errorMessage(err, "Não foi possível carregar o pagamento."));
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orderId]);

  const waiting = payment?.status === "Pending";

  useEffect(() => {
    if (!waiting) {
      return;
    }
    const timer = window.setInterval(async () => {
      setNow(new Date());
      try {
        const current = await ordersApi.currentPayment(orderId);
        setPayment(current);
        if (current.orderStatus === "PaymentConfirmed" && !confirmed.current) {
          confirmed.current = true;
          onConfirmed();
        }
      } catch {
        // Uma consulta perdida não muda nada: a próxima tenta de novo.
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [waiting, orderId, onConfirmed]);

  async function payWithPix() {
    idempotencyKey.current ||= crypto.randomUUID();
    setStarting(true);
    setError(null);
    try {
      setPayment(await ordersApi.pay(orderId, { method: "Pix" }, idempotencyKey.current));
    } catch (err) {
      idempotencyKey.current = "";
      setError(errorMessage(err, "Não foi possível gerar o PIX agora. Tente de novo."));
    } finally {
      setStarting(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4_000);
    } catch {
      setError("Não deu para copiar. Toque e segure o código para copiar à mão.");
    }
  }

  if (loading) {
    return <p className="text-sm text-tinta-suave">Carregando o pagamento…</p>;
  }

  const showPix = payment?.method === "Pix" && payment.status === "Pending" && payment.pixQrCode;

  return (
    <section aria-labelledby="pagamento" className="space-y-4 border border-linha p-4">
      <h2 id="pagamento" className="font-display text-xl leading-tight">
        Pagamento
      </h2>

      {error && <FormAlert kind="error">{error}</FormAlert>}

      {showPix ? (
        <div className="space-y-4">
          <p className="text-sm">Abra o app do seu banco, escolha pagar com PIX e leia o QR, ou copie o código.</p>
          {payment.pixQrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem gerada pela plataforma, em data URI
            <img
              src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
              alt="QR Code do PIX"
              width={240}
              height={240}
              className="mx-auto block size-60 bg-white p-2 [image-rendering:pixelated]"
            />
          )}
          <div>
            <label htmlFor="pix-copia-e-cola" className="block text-xs font-medium uppercase tracking-[0.16em]">
              PIX copia e cola
            </label>
            <textarea
              id="pix-copia-e-cola"
              readOnly
              rows={3}
              value={payment.pixQrCode ?? ""}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-1 block w-full resize-none border border-tinta/40 bg-transparent p-2 font-mono text-xs break-all"
            />
          </div>
          <button type="button" onClick={() => void copyCode(payment.pixQrCode ?? "")} className={primaryButtonClass}>
            {copied ? "Código copiado" : "Copiar código"}
          </button>
          <p role="status" aria-live="polite" className="text-center text-sm text-tinta-suave">
            {copied ? "Código copiado. Cole no app do banco." : "Esperando o pagamento…"}
            {payment.expiresAt && ` Prazo: ${paymentCountdown(payment.expiresAt, now)}.`}
          </p>
          {payment.canSimulate && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await ordersApi.simulateApproval(orderId);
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
              className="inline-flex min-h-11 w-full items-center justify-center border border-dashed border-tinta/40 text-sm text-tinta-suave"
            >
              Simular pagamento aprovado (só em desenvolvimento)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {payment?.status === "Rejected" && (
            <FormAlert kind="error">O pagamento anterior foi recusado. Você pode tentar de novo com PIX.</FormAlert>
          )}
          {(payment?.status === "Expired" || payment?.status === "Cancelled") && (
            <FormAlert kind="info">O PIX anterior venceu. Gere um novo para pagar.</FormAlert>
          )}
          <button type="button" onClick={() => void payWithPix()} disabled={starting} aria-busy={starting} className={primaryButtonClass}>
            {starting ? "Gerando o PIX…" : "Pagar com PIX"}
          </button>
          <p className="text-center text-xs text-tinta-suave">A confirmação chega em segundos depois do pagamento.</p>
        </div>
      )}
    </section>
  );
}

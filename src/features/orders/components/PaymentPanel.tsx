"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert, primaryButtonClass } from "@/shared/ui/form";
import { ordersApi, type Payment, type PaymentOptions, type PayRequest } from "../api";
import { cardRejectionMessage } from "../card-messages";
import { paymentCountdown } from "../gift";
import { CardPayment } from "./CardPayment";

/** Tempo entre consultas enquanto o QR está na tela (arquivo 26 §4.6: "atualização automática quando o pagamento cai"). */
const POLL_MS = 5_000;

/**
 * Pagamento do pedido (RF-044): PIX com QR grande, "Copiar código" e contagem do prazo. A tela só mostra o que a API
 * diz; a confirmação vem da plataforma pelo webhook (arquivo 21 §2), e esta tela só consulta até ela chegar.
 */
export function PaymentPanel({
  orderId,
  amount,
  publicKey,
  onConfirmed,
}: {
  orderId: string;
  amount: number;
  /** Chave pública do Mercado Pago, lida em tempo de execução pelo servidor (entrega 4 §3, P9). */
  publicKey: string | null;
  onConfirmed: () => void;
}) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [method, setMethod] = useState<"Pix" | "CreditCard">("Pix");
  const [options, setOptions] = useState<PaymentOptions>({ canSimulate: false, maxInstallments: 1 });
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
      .paymentOptions()
      .then((loaded) => active && setOptions(loaded))
      .catch(() => undefined);
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

  async function payWithCard(request: PayRequest) {
    setError(null);
    try {
      const result = await ordersApi.pay(orderId, request, crypto.randomUUID());
      setPayment(result);
      if (result.status === "Rejected") {
        setError(cardRejectionMessage(result.statusDetail));
      } else if (result.orderStatus === "PaymentConfirmed" && !confirmed.current) {
        confirmed.current = true;
        onConfirmed();
      }
    } catch (err) {
      setError(errorMessage(err, "Não foi possível pagar com o cartão agora. Tente de novo."));
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
  const cardInReview = payment?.method === "CreditCard" && payment.status === "Pending";

  return (
    <section aria-labelledby="pagamento" className="space-y-4 border border-linha p-4">
      <h2 id="pagamento" className="font-display text-xl leading-tight">
        Pagamento
      </h2>

      {error && <FormAlert kind="error">{error}</FormAlert>}

      {!showPix && !cardInReview && (
        <div role="tablist" aria-label="Forma de pagamento" className="flex gap-6 border-b border-linha text-sm">
          {(["Pix", "CreditCard"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={method === option}
              onClick={() => {
                setMethod(option);
                setError(null);
              }}
              className={`-mb-px min-h-11 border-b-2 ${method === option ? "border-folha font-medium" : "border-transparent text-tinta-suave"}`}
            >
              {option === "Pix" ? "PIX" : "Cartão de crédito"}
            </button>
          ))}
        </div>
      )}

      {cardInReview ? (
        <p role="status" className="text-sm">
          O pagamento com cartão está em análise no Mercado Pago. Esta tela muda sozinha quando ele for aprovado.
        </p>
      ) : method === "CreditCard" && !showPix ? (
        <CardPayment publicKey={publicKey} canSimulate={options.canSimulate} amount={amount} maxInstallments={options.maxInstallments} onPay={payWithCard} />
      ) : showPix ? (
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
          {payment?.status === "Rejected" && !error && (
            <FormAlert kind="info">O pagamento anterior foi recusado. Você pode tentar de novo.</FormAlert>
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

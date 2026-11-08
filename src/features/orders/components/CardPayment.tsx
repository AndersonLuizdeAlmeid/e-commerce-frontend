"use client";

import { useEffect, useRef, useState } from "react";
import { FormAlert } from "@/shared/ui/form";
import type { PayRequest } from "../api";

/** SDK do Mercado Pago (Bricks). Carregado só quando a cliente escolhe cartão. */
const SDK_URL = "https://sdk.mercadopago.com/js/v2";

interface CardFormData {
  token: string;
  issuer_id?: string;
  payment_method_id: string;
  installments: number;
  payer?: { identification?: { type?: string; number?: string } };
}

interface BrickController {
  unmount: () => void;
}

interface MercadoPagoInstance {
  bricks: () => {
    create: (
      brick: "cardPayment",
      containerId: string,
      settings: {
        initialization: { amount: number };
        customization: { paymentMethods: { maxInstallments: number } };
        callbacks: {
          onReady: () => void;
          onSubmit: (formData: CardFormData) => Promise<void>;
          onError: (error: unknown) => void;
        };
      },
    ) => Promise<BrickController>;
  };
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options: { locale: string }) => MercadoPagoInstance;
  }
}

let sdkLoading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.MercadoPago) {
    return Promise.resolve();
  }
  sdkLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoading = null;
      reject(new Error("SDK do Mercado Pago indisponível"));
    };
    document.head.appendChild(script);
  });
  return sdkLoading;
}

interface CardPaymentProps {
  publicKey: string | null;
  canSimulate: boolean;
  amount: number;
  maxInstallments: number;
  onPay: (request: PayRequest) => Promise<void>;
}

/**
 * Cartão (RF-044, 4.4). Com a chave pública, o Card Payment Brick do Mercado Pago coleta os dados e devolve um token:
 * número e CVV nunca passam pela loja (SAQ-A, arquivo 21 §2). Sem chave e com a plataforma falsa, aparece o cartão de
 * teste do desenvolvimento.
 */
export function CardPayment({ publicKey, canSimulate, amount, maxInstallments, onPay }: CardPaymentProps) {
  if (publicKey) {
    return <CardBrick publicKey={publicKey} amount={amount} maxInstallments={maxInstallments} onPay={onPay} />;
  }

  if (canSimulate) {
    return <FakeCard onPay={onPay} />;
  }

  return <FormAlert kind="info">O pagamento com cartão está indisponível agora. Pague com PIX ou fale com a MO.</FormAlert>;
}

function CardBrick({ publicKey, amount, maxInstallments, onPay }: { publicKey: string; amount: number; maxInstallments: number; onPay: (request: PayRequest) => Promise<void> }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const onPayRef = useRef(onPay);

  useEffect(() => {
    onPayRef.current = onPay;
  }, [onPay]);

  useEffect(() => {
    let controller: BrickController | null = null;
    let cancelled = false;

    loadSdk()
      .then(async () => {
        if (cancelled || !window.MercadoPago) {
          return;
        }
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        controller = await mp.bricks().create("cardPayment", "cartao-brick", {
          initialization: { amount },
          customization: { paymentMethods: { maxInstallments } },
          callbacks: {
            onReady: () => !cancelled && setState("ready"),
            onSubmit: (formData) =>
              onPayRef.current({
                method: "CreditCard",
                cardToken: formData.token,
                paymentMethodId: formData.payment_method_id,
                issuerId: formData.issuer_id ?? null,
                installments: formData.installments,
                payerDocument: formData.payer?.identification?.number
                  ? { type: formData.payer.identification.type ?? "CPF", number: formData.payer.identification.number }
                  : null,
              }),
            onError: () => !cancelled && setState("error"),
          },
        });
        if (cancelled) {
          controller.unmount();
        }
      })
      .catch(() => !cancelled && setState("error"));

    return () => {
      cancelled = true;
      controller?.unmount();
    };
  }, [publicKey, amount, maxInstallments]);

  return (
    <div>
      {state === "loading" && <p className="text-sm text-tinta-suave">Abrindo o formulário seguro do Mercado Pago…</p>}
      {state === "error" && <FormAlert kind="error">Não foi possível abrir o formulário do cartão. Recarregue a página ou pague com PIX.</FormAlert>}
      <div id="cartao-brick" />
    </div>
  );
}

/** Só em desenvolvimento, com a plataforma falsa: os tokens que ela entende (entrega 4 §3, P3). */
function FakeCard({ onPay }: { onPay: (request: PayRequest) => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function pay(cardToken: string) {
    setBusy(true);
    try {
      await onPay({ method: "CreditCard", cardToken, paymentMethodId: "visa", installments: 1 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 border border-dashed border-tinta/40 p-3 text-sm">
      <p className="text-tinta-suave">Cartão de teste (só em desenvolvimento; com a chave do Mercado Pago aparece o formulário de verdade).</p>
      <div className="flex flex-wrap gap-x-5">
        <button type="button" disabled={busy} onClick={() => void pay("fake-approved")} className="inline-flex min-h-11 items-center font-medium underline disabled:opacity-60">
          Pagar com cartão aprovado
        </button>
        <button type="button" disabled={busy} onClick={() => void pay("fake-rejected")} className="inline-flex min-h-11 items-center font-medium underline disabled:opacity-60">
          Pagar com cartão recusado
        </button>
      </div>
    </div>
  );
}

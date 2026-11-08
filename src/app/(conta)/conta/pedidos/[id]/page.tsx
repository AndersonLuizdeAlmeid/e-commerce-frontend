import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/features/orders/components/OrderDetail";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

// Lida a cada requisição, não no build: a mesma imagem da loja serve sandbox e produção (entrega 4 §3, P9).
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || null;
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">Seu pedido</h1>
      <div className="mt-8">
        <Suspense>
          <OrderDetail id={id} publicKey={publicKey} />
        </Suspense>
      </div>
    </section>
  );
}

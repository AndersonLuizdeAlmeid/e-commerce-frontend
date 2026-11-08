import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/features/orders/components/OrderDetail";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">Seu pedido</h1>
      <div className="mt-8">
        <Suspense>
          <OrderDetail id={id} />
        </Suspense>
      </div>
    </section>
  );
}

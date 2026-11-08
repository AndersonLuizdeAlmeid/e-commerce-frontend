import type { Metadata } from "next";
import { CheckoutFlow } from "@/features/orders/components/CheckoutFlow";

// Formulários marfim lisos, fora do índice (arquivo 26 §4.6, arquivo 24 §1).
export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">Finalizar compra</h1>
      <div className="mt-8">
        <CheckoutFlow />
      </div>
    </section>
  );
}

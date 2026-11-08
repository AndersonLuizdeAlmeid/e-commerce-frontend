import type { Metadata } from "next";
import { AccountNav } from "@/features/auth/components/AccountNav";
import { MyOrders } from "@/features/orders/components/MyOrders";

// Área logada: renderizada no navegador e fora do índice (specs/16 ADR-F03, specs/24 §1).
export const metadata: Metadata = {
  title: "Meus pedidos",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">Minha conta</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      <div className="mt-10">
        <MyOrders />
      </div>
    </section>
  );
}

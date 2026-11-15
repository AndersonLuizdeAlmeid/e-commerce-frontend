import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersPanel } from "@/features/admin/components/OrdersPanel";

export const metadata: Metadata = { title: "Pedidos" };

// Suspense: os filtros moram na URL, e esta página é pré-renderizada no build.
export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersPanel />
    </Suspense>
  );
}

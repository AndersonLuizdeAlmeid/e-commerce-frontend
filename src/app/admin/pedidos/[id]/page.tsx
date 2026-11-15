import type { Metadata } from "next";
import { OrderPanel } from "@/features/admin/components/OrderPanel";

export const metadata: Metadata = { title: "Pedido" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderPanel id={id} />;
}

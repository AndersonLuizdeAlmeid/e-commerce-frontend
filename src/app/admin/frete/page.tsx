import type { Metadata } from "next";
import { ShippingPanel } from "@/features/admin/components/ShippingPanel";

export const metadata: Metadata = { title: "Frete" };

export default function AdminShippingPage() {
  return <ShippingPanel />;
}

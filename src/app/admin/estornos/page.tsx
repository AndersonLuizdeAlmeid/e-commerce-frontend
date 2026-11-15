import type { Metadata } from "next";
import { RefundsPanel } from "@/features/admin/components/RefundsPanel";

export const metadata: Metadata = { title: "Estornos pendentes" };

export default function AdminRefundsPage() {
  return <RefundsPanel />;
}

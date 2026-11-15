import type { Metadata } from "next";
import { DashboardPanel } from "@/features/admin/components/DashboardPanel";

export const metadata: Metadata = { title: "Painel" };

// O painel abre no que espera a loja agora (entrega 5 §3, P11).
export default function AdminHomePage() {
  return <DashboardPanel />;
}

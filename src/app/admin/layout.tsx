import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/AdminShell";

// Painel: renderizado no navegador e fora do índice (specs/16 ADR-F03, specs/24 §1).
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel MO" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}

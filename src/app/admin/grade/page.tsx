import type { Metadata } from "next";
import { GridOptionsPanel } from "@/features/admin/components/GridOptionsPanel";

export const metadata: Metadata = { title: "Acabamentos e tamanhos" };

export default function AdminGridOptionsPage() {
  return <GridOptionsPanel />;
}

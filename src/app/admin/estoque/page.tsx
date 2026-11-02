import type { Metadata } from "next";
import { Suspense } from "react";
import { StockPanel } from "@/features/admin/components/StockPanel";

export const metadata: Metadata = { title: "Estoque" };

// Suspense: o painel lê `?busca=` da URL, e esta página é pré-renderizada no build.
export default function AdminStockPage() {
  return (
    <Suspense>
      <StockPanel />
    </Suspense>
  );
}

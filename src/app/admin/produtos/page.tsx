import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsList } from "@/features/admin/components/ProductsList";

export const metadata: Metadata = { title: "Produtos" };

// Suspense: a lista lê `?colecao=` da URL, e esta página é pré-renderizada no build.
export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductsList />
    </Suspense>
  );
}

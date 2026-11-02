import type { Metadata } from "next";
import { NewProduct } from "@/features/admin/components/ProductEditor";

export const metadata: Metadata = { title: "Novo produto" };

export default function AdminNewProductPage() {
  return <NewProduct />;
}

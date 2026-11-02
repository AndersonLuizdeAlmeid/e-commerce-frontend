import type { Metadata } from "next";
import { ProductEditor } from "@/features/admin/components/ProductEditor";

export const metadata: Metadata = { title: "Produto" };

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}

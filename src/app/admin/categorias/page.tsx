import type { Metadata } from "next";
import { CategoriesPanel } from "@/features/admin/components/CategoriesPanel";

export const metadata: Metadata = { title: "Categorias" };

export default function AdminCategoriesPage() {
  return <CategoriesPanel />;
}

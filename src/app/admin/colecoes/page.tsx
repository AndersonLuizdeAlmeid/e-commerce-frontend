import type { Metadata } from "next";
import { CollectionsPanel } from "@/features/admin/components/CollectionsPanel";

export const metadata: Metadata = { title: "Coleções" };

export default function AdminCollectionsPage() {
  return <CollectionsPanel />;
}

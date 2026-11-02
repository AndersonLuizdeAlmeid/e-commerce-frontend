import type { Metadata } from "next";
import { ShowcasePanel } from "@/features/admin/components/ShowcasePanel";

export const metadata: Metadata = { title: "Vitrine" };

export default function AdminShowcasePage() {
  return <ShowcasePanel />;
}

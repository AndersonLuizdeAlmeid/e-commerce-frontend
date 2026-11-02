import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { findMovedCategorySlug, getCategoryBySlug } from "@/features/catalog/api";

interface CategoryLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

/** Decide aqui, e não na página: acima do `loading.tsx`, o redirect e o 404 saem com o status certo (SEO-02). */
export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    const movedSlug = await findMovedCategorySlug(slug);
    if (movedSlug) {
      permanentRedirect(`/categoria/${movedSlug}`);
    }
    notFound();
  }

  return children;
}

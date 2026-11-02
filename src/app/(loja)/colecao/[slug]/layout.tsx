import type { ReactNode } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { findMovedCollectionSlug, getCollectionBySlug } from "@/features/catalog/api";

interface CollectionLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Decide aqui, e não na página: o `loading.tsx` abre a resposta com 200 antes de a página rodar, e o redirect e o 404
 * viravam só um aviso no HTML. O layout fica acima desse limite, então o status sai certo (SEO-02, RF-024 CA4).
 */
export default async function CollectionLayout({ children, params }: CollectionLayoutProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    const movedSlug = await findMovedCollectionSlug(slug);
    if (movedSlug) {
      permanentRedirect(`/colecao/${movedSlug}`);
    }
    notFound();
  }

  return children;
}

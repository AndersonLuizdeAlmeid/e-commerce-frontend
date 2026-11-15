"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductDetails } from "@/features/catalog/api";
import { findVariant, initialSelection } from "@/features/catalog/variant-selection";
import { apiRequest } from "@/shared/api/browser-client";
import { BagIcon, CheckIcon } from "@/shared/ui/icons";
import { useCart } from "../CartProvider";

const className =
  "botao botao-tinta whitespace-nowrap";

/**
 * "Adicionar à sacola" na peça em destaque da home (specs/26 §4.1): o acabamento padrão já vem escolhido. Quando
 * ainda falta escolher o aro, ou a escolha esgotou, a peça abre na página dela. A grade só é buscada no toque, para
 * não pesar na home.
 */
export function AddFeaturedButton({ slug, colorSlug }: { slug: string; colorSlug?: string }) {
  const router = useRouter();
  const { add } = useCart();
  const [state, setState] = useState<"idle" | "pending" | "added">("idle");
  const productPath = `/produto/${slug}${colorSlug ? `?cor=${encodeURIComponent(colorSlug)}` : ""}`;

  async function addToBag() {
    setState("pending");
    try {
      const product = await apiRequest<ProductDetails>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`);
      const variant = findVariant(product, initialSelection(product, colorSlug));
      if (!variant?.available) {
        router.push(productPath);
        return;
      }
      await add(variant.id);
      setState("added");
    } catch {
      // Sem resposta ou limite da sacola: a página da peça mostra o motivo e deixa escolher de novo.
      router.push(productPath);
    }
  }

  if (state === "added") {
    return (
      <Link href="/carrinho" className={className}>
        <CheckIcon width={18} height={18} />
        <span role="status">Na sacola: ver</span>
      </Link>
    );
  }

  return (
    <button type="button" className={className} disabled={state === "pending"} aria-busy={state === "pending"} onClick={() => void addToBag()}>
      <BagIcon width={18} height={18} />
      Adicionar à sacola
    </button>
  );
}

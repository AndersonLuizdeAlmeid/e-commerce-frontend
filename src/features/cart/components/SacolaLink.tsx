"use client";

import Link from "next/link";
import { BagIcon } from "@/shared/ui/icons";
import { useCart } from "../CartProvider";

/** A sacola no topo: o saquinho de juta da MO, com o contador (specs/26 §2.4). */
export function SacolaLink() {
  const { count } = useCart();
  const label = count === 0 ? "Sacola vazia" : count === 1 ? "Sacola, 1 peça" : `Sacola, ${count} peças`;

  return (
    <Link href="/carrinho" aria-label={label} className="relative grid size-11 place-items-center">
      <BagIcon />
      {count > 0 && (
        <span aria-hidden="true" className="numeros absolute right-0 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-tinta px-1 text-[11px] font-medium leading-none text-cartela">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

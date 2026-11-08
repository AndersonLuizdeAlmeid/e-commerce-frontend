"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert, primaryButtonClass } from "@/shared/ui/form";
import { ordersApi, type OrdersPage } from "../api";
import { orderStatusLabel, paymentCountdown } from "../gift";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

/** Meus pedidos (RF-041; arquivo 26 §4.7): cada pedido é uma cartela pequena com a situação em texto. */
export function MyOrders() {
  const { status } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<OrdersPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/conta/pedidos");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    ordersApi
      .list(page)
      .then((loaded) => active && setOrders(loaded))
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 403
              ? "Esta é uma conta de administrador, que não faz compras pela loja."
              : errorMessage(err, "Não foi possível carregar seus pedidos."),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [status, page]);

  if (error) {
    return <FormAlert kind="info">{error}</FormAlert>;
  }

  if (!orders) {
    return <p className="text-tinta-suave">Carregando seus pedidos…</p>;
  }

  if (orders.items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-tinta-suave">Você ainda não fez nenhum pedido.</p>
        <Link href="/" className={primaryButtonClass}>
          Ver novidades
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-linha border-y border-linha">
        {orders.items.map((order) => (
          <li key={order.id}>
            <Link href={`/conta/pedidos/${order.id}`} className="flex gap-4 py-4 hover:bg-linha/20">
              <span className="relative block size-16 shrink-0 overflow-hidden bg-linha/50">
                {order.firstImageUrl && <Image src={order.firstImageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-medium">{order.number}</span>
                  <span className="numeros">{formatPrice(order.total)}</span>
                </span>
                <span className="block truncate text-sm">
                  {order.firstProductName}
                  {order.itemCount > 1 && <span className="text-tinta-suave"> e mais {order.itemCount - 1}</span>}
                </span>
                <span className="block text-sm text-tinta-suave">
                  {dateFormat.format(new Date(order.placedAt))} · {orderStatusLabel(order.status)}
                  {order.status === "PendingPayment" && ` — ${paymentCountdown(order.paymentDueAt)}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {orders.totalPages > 1 && (
        <nav aria-label="Páginas de pedidos" className="flex items-center justify-between text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-11 underline disabled:opacity-40">
            Anteriores
          </button>
          <span className="text-tinta-suave">
            Página {page} de {orders.totalPages}
          </span>
          <button type="button" disabled={page >= orders.totalPages} onClick={() => setPage(page + 1)} className="min-h-11 underline disabled:opacity-40">
            Seguintes
          </button>
        </nav>
      )}
    </div>
  );
}

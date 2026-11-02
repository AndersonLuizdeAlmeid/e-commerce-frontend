"use client";

import Link from "next/link";
import { UserIcon } from "@/shared/ui/icons";
import { useAuth } from "../AuthProvider";

/** Link do cabeçalho: "Entrar" para visitante, "Minha conta" para cliente, "Painel" para admin. */
export function AccountLink() {
  const { status, user } = useAuth();
  const authenticated = status === "authenticated";
  const isAdmin = user?.role === "Admin";
  const href = isAdmin ? "/admin" : authenticated ? "/conta" : "/login";
  const label = isAdmin ? "Painel" : authenticated ? "Minha conta" : "Entrar";

  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-1 text-sm font-medium hover:underline"
    >
      <UserIcon />
      <span className="max-sm:sr-only">{label}</span>
    </Link>
  );
}

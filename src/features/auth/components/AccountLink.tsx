"use client";

import Link from "next/link";
import { useAuth } from "../AuthProvider";

/** Link do cabeçalho: "Entrar" para visitante, "Minha conta" para quem está logado. */
export function AccountLink() {
  const { status } = useAuth();
  const authenticated = status === "authenticated";

  return (
    <Link
      href={authenticated ? "/conta" : "/login"}
      className="whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium text-ink hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      {authenticated ? "Minha conta" : "Entrar"}
    </Link>
  );
}

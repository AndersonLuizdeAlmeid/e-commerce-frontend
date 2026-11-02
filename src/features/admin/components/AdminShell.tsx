"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { StarMark } from "@/shared/ui/icons";

const NAV = [
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/colecoes", label: "Coleções" },
  { href: "/admin/vitrine", label: "Vitrine" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/grade", label: "Acabamentos e tamanhos" },
];

/**
 * Moldura do painel (modo Operate, arquivo 26 §4.8): marfim e tinta, sem a vitrine rosé. A guarda aqui é de
 * experiência; quem protege de verdade é a policy Admin na API (arquivo 09).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  const isAdmin = user?.role === "Admin";
  const signOut = () => void logout().then(() => router.replace("/"));

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && !isAdmin) {
      router.replace("/");
    }
  }, [status, isAdmin, pathname, router]);

  if (status !== "authenticated" || !isAdmin) {
    return (
      <p role="status" className="p-8 text-sm text-tinta-suave">
        Carregando o painel…
      </p>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-linha lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 px-4 py-3 lg:block lg:px-5 lg:py-6">
            <Link href="/admin" className="inline-flex items-end gap-2">
              <span className="relative font-display text-2xl leading-[0.8] tracking-[-0.04em]">
                MO
                <StarMark className="absolute -right-2.5 -top-1 text-folha" />
              </span>
              <span className="pl-2 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">Painel</span>
            </Link>
            <div className="flex items-center gap-4 text-sm lg:hidden">
              <Link href="/" className="underline">
                Ver a loja
              </Link>
              <button type="button" onClick={signOut} className="min-h-10 text-tinta-suave underline">
                Sair
              </button>
            </div>
          </div>
          <nav aria-label="Painel" className="overflow-x-auto px-2 pb-2 lg:px-3">
            <ul className="flex gap-1 lg:flex-col">
              {NAV.map((item) => {
                const current = pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={`flex min-h-10 items-center whitespace-nowrap px-3 text-sm transition-colors ${
                        current ? "bg-tinta font-medium text-cartela" : "hover:bg-linha/60"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden px-5 pt-8 text-sm lg:block">
            <Link href="/" className="block py-1 underline">
              Ver a loja
            </Link>
            <button type="button" onClick={signOut} className="block py-1 text-tinta-suave underline hover:text-tinta">
              Sair
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </QueryClientProvider>
  );
}

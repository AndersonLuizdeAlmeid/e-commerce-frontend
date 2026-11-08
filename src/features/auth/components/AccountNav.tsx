"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/conta", label: "Meus dados" },
  { href: "/conta/pedidos", label: "Pedidos" },
  { href: "/conta/enderecos", label: "Endereços" },
] as const;

/** Abas da área do cliente. O fio em folha marca a página atual; o texto continua em tinta (specs/26 §2.2). */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Minha conta" className="border-b border-linha">
      <ul className="-mb-px flex gap-6">
        {LINKS.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-sm font-medium ${
                  current ? "border-folha" : "border-transparent text-tinta-suave hover:text-tinta"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

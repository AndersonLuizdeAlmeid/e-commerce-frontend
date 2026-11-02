"use client";

import { usePathname } from "next/navigation";
import { whatsappUrl } from "@/shared/lib/site";
import { ChatIcon } from "./icons";

/**
 * Atendimento próximo a um toque (specs/26 §2.4). Na página do produto o link de WhatsApp já vai com o nome da
 * peça, e este botão ficaria por cima da barra de compra, então sai do caminho.
 */
export function FalarComAMO() {
  const pathname = usePathname();
  if (pathname.startsWith("/produto/")) {
    return null;
  }

  return (
    <a
      href={whatsappUrl("Olá! Vim pelo site da MO e queria tirar uma dúvida.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-tinta py-2.5 pl-3.5 pr-4 text-sm font-medium text-cartela shadow-[0_10px_24px_-10px_rgb(74_40_44/0.55)] transition-transform duration-300 ease-solta hover:-translate-y-0.5"
    >
      <ChatIcon />
      Falar com a MO
      <span className="sr-only"> pelo WhatsApp (abre em outra aba)</span>
    </a>
  );
}

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
      className="botao botao-tinta botao-pequeno fixed bottom-4 right-4 z-30 pl-3.5 pr-4"
    >
      <ChatIcon />
      Falar com a MO
      <span className="sr-only"> pelo WhatsApp (abre em outra aba)</span>
    </a>
  );
}

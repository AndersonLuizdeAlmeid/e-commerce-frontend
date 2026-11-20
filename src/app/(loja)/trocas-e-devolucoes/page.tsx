import type { Metadata } from "next";
import Link from "next/link";
import { WARRANTY_TEXT, whatsappUrl } from "@/shared/lib/site";
import { LegalPage, LegalSection, PendingDecision, StoreIdentityBlock } from "@/shared/ui/LegalPage";

// Rascunho da fase 6.3 (entrega 6 §6, itens 4 e 5). O arrependimento segue o art. 49 do Código de Defesa do
// Consumidor; o que é política da MO fica marcado até a loja decidir.
export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Como devolver em até 7 dias, trocar uma peça e receber o dinheiro de volta na MO.",
  alternates: { canonical: "/trocas-e-devolucoes" },
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Trocas e devoluções" updatedAt="20/11/2026">
      <LegalSection title="Desistiu? Você tem 7 dias">
        <p>
          Pelo Código de Defesa do Consumidor (art. 49), quem compra pela internet pode desistir em até <strong className="font-medium">7 dias
          corridos</strong> a partir do dia em que recebe a peça, sem precisar explicar o motivo.
        </p>
        <p>Nesse caso, a loja devolve o valor inteiro que você pagou, frete incluído.</p>
      </LegalSection>

      <LegalSection title="Como pedir">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Fale com a MO pelo{" "}
            <a href={whatsappUrl("Olá! Quero devolver ou trocar uma peça do pedido ")} target="_blank" rel="noopener noreferrer" className="underline">
              WhatsApp
            </a>{" "}
            ou pelo e-mail de atendimento, com o número do pedido (está em{" "}
            <Link href="/conta/pedidos" className="underline">
              Meus pedidos
            </Link>
            ).
          </li>
          <li>
            A loja responde com o jeito de enviar a peça de volta. <PendingDecision>se a loja manda um código de postagem ou se reembolsa o envio</PendingDecision>
          </li>
          <li>Quando a peça chega e é conferida, a loja registra a devolução e o valor é devolvido.</li>
        </ol>
        <p>Envie a peça sem sinais de uso, com a embalagem e os acessórios que vieram junto.</p>
      </LegalSection>

      <LegalSection title="Quando o dinheiro volta">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium">PIX:</strong> o valor volta para a conta de onde saiu, pelo Mercado Pago, em geral no mesmo dia.
          </li>
          <li>
            <strong className="font-medium">Cartão:</strong> o estorno aparece na fatura em uma ou duas faturas, conforme o banco.
          </li>
        </ul>
        <p>Você recebe um e-mail quando o estorno é feito.</p>
      </LegalSection>

      <LegalSection title="Troca de tamanho ou de modelo">
        <p>
          <PendingDecision>prazo para pedir troca fora do arrependimento, e quem paga o frete da troca</PendingDecision>
        </p>
        <p>Se a peça que você quer não tiver em estoque, a troca vira devolução, com o valor de volta.</p>
      </LegalSection>

      <LegalSection title="Peça com defeito">
        <p>
          Peça com defeito pode ser trocada ou devolvida em até 90 dias do recebimento (art. 26 do Código de Defesa do Consumidor), com o frete por conta
          da loja. {WARRANTY_TEXT}
        </p>
        <p>
          <PendingDecision>o que a garantia do banho cobre e o que é considerado uso incorreto</PendingDecision>
        </p>
      </LegalSection>

      <LegalSection title="Atendimento">
        <StoreIdentityBlock />
      </LegalSection>
    </LegalPage>
  );
}

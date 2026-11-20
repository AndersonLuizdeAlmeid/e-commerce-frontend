import type { Metadata } from "next";
import Link from "next/link";
import { WARRANTY_TEXT } from "@/shared/lib/site";
import { LegalPage, LegalSection, PendingDecision, StoreIdentityBlock } from "@/shared/ui/LegalPage";

// Rascunho da fase 6.3 (entrega 6 §6, itens 4 e 5): descreve as regras que o sistema já aplica (conta obrigatória,
// e-mail confirmado, PIX e cartão, cancelamento em 48 h). O texto final passa pela revisão jurídica.
export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de compra na MO: conta, preços, pagamento, entrega, cancelamento e garantia.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updatedAt="20/11/2026">
      <LegalSection title="A loja">
        <StoreIdentityBlock />
        <p>Ao comprar no site, você concorda com estas regras, que seguem o Código de Defesa do Consumidor.</p>
      </LegalSection>

      <LegalSection title="Sua conta">
        <p>
          Para comprar é preciso ter uma conta e confirmar o e-mail. Você responde pela senha e pelos dados que informa. Pode corrigir os dados, baixá-los
          ou excluir a conta a qualquer momento em{" "}
          <Link href="/conta" className="underline">
            Minha conta
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Preços e disponibilidade">
        <p>
          Os preços são em reais e valem no momento da compra. O estoque é conferido quando você finaliza o pedido: se uma peça acabar enquanto você
          compra, a loja avisa antes de cobrar. As fotos mostram a peça com fidelidade, mas cor e brilho podem variar um pouco conforme a tela.
        </p>
      </LegalSection>

      <LegalSection title="Pagamento">
        <p>
          O pagamento é por PIX ou cartão de crédito, processado pelo Mercado Pago. Pedido sem pagamento confirmado em 48 horas é cancelado
          automaticamente, e as peças voltam para a vitrine. <PendingDecision>parcelamento: número de parcelas e se há juros</PendingDecision>
        </p>
      </LegalSection>

      <LegalSection title="Entrega">
        <p>
          O frete e o prazo aparecem antes de você pagar, calculados para o seu CEP. O prazo conta a partir da confirmação do pagamento e soma o tempo de
          preparo da loja ao da transportadora. Quando o pedido é enviado, você recebe o código de rastreio por e-mail.
        </p>
      </LegalSection>

      <LegalSection title="Cancelamento">
        <p>
          Você mesma cancela em{" "}
          <Link href="/conta/pedidos" className="underline">
            Meus pedidos
          </Link>{" "}
          enquanto ele aguarda pagamento ou já foi pago mas ainda não começou a ser separado. Se já estava pago, o valor é estornado. Depois disso, fale
          com a loja.
        </p>
      </LegalSection>

      <LegalSection title="Trocas, devoluções e garantia">
        <p>
          Você pode desistir em até 7 dias do recebimento. {WARRANTY_TEXT} Os detalhes estão em{" "}
          <Link href="/trocas-e-devolucoes" className="underline">
            Trocas e devoluções
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Privacidade">
        <p>
          O que a loja faz com seus dados está na{" "}
          <Link href="/privacidade" className="underline">
            política de privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Dúvidas e reclamações">
        <p>
          Fale primeiro com a loja pelos contatos acima. Se não resolver, você pode procurar o Procon ou o consumidor.gov.br. Qualquer disputa pode ser
          levada ao foro da sua cidade.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, StoreIdentityBlock } from "@/shared/ui/LegalPage";

// Rascunho da fase 6.3 (entrega 6 §6, itens 4 e 5): estrutura e conteúdo fiéis ao que o sistema faz; o texto final
// passa pela revisão jurídica antes do lançamento.
export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Quais dados a MO guarda, para quê, com quem compartilha e como você exerce seus direitos pela LGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Política de privacidade" updatedAt="20/11/2026">
      <p>
        Esta política explica quais dados pessoais a loja guarda quando você compra, para que eles servem e como você pode ver, corrigir, baixar ou
        apagar esses dados, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>

      <LegalSection title="Quem cuida dos seus dados">
        <p>A controladora dos dados é a loja:</p>
        <StoreIdentityBlock />
        <p>Dúvidas e pedidos sobre seus dados podem ser feitos pelo e-mail de atendimento acima.</p>
      </LegalSection>

      <LegalSection title="Quais dados guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium">Cadastro:</strong> nome, e-mail, celular e, se você informar, CPF.
          </li>
          <li>
            <strong className="font-medium">Endereços</strong> que você guarda para entrega.
          </li>
          <li>
            <strong className="font-medium">Pedidos:</strong> peças, valores, endereço de entrega, dedicatória de presente, observação e situação.
          </li>
          <li>
            <strong className="font-medium">Pagamentos:</strong> forma de pagamento, valor e situação. Os dados do cartão não passam pela loja: vão
            direto para o Mercado Pago.
          </li>
          <li>
            <strong className="font-medium">Segurança:</strong> registros técnicos de acesso, como o endereço IP do login, para proteger sua conta.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Para que usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Entregar o que você comprou, cobrar e avisar sobre o pedido por e-mail (execução do contrato).</li>
          <li>Guardar o registro das vendas pelo prazo que a lei fiscal exige (obrigação legal).</li>
          <li>Proteger sua conta contra acesso indevido e fraude (legítimo interesse).</li>
        </ul>
        <p>A loja não envia e-mail de propaganda e não vende nem aluga dados.</p>
      </LegalSection>

      <LegalSection title="Com quem compartilhamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Mercado Pago, para processar o pagamento.</li>
          <li>Melhor Envio e a transportadora escolhida (Correios ou outra), para calcular o frete e entregar.</li>
          <li>O serviço de envio de e-mails, para as mensagens do pedido e da conta.</li>
          <li>Os serviços de hospedagem e de proteção do site, que guardam os dados em nome da loja.</li>
        </ul>
        <p>Cada um recebe só o necessário para a sua parte.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          A loja usa um único cookie, essencial, para manter você conectada à sua conta. Não há cookies de publicidade, de análise de navegação nem
          pixels de redes sociais. Por isso não pedimos consentimento para cookies: se isso mudar, você será perguntada antes.
        </p>
      </LegalSection>

      <LegalSection title="Por quanto tempo">
        <ul className="list-disc space-y-1 pl-5">
          <li>Cadastro e endereços: enquanto a conta existir.</li>
          <li>Pedidos: pelo prazo da legislação fiscal. Se você excluir a conta, eles ficam sem nenhum dado que identifique você.</li>
          <li>Registro dos e-mails enviados: 180 dias, só com o endereço mascarado.</li>
          <li>Registros técnicos de acesso: até 14 dias.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Seus direitos">
        <p>Você pode, sem precisar falar com ninguém:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            ver e corrigir seus dados em{" "}
            <Link href="/conta" className="underline">
              Minha conta
            </Link>
            ;
          </li>
          <li>
            baixar tudo o que a loja guarda sobre você e excluir sua conta em{" "}
            <Link href="/conta/privacidade" className="underline">
              Minha conta → Privacidade
            </Link>
            .
          </li>
        </ul>
        <p>
          Para os outros direitos da LGPD (saber com quem os dados foram compartilhados, revogar consentimento, se opor a um tratamento), escreva para o
          e-mail de atendimento. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="Segurança">
        <p>
          A conexão com a loja é sempre criptografada, as senhas são guardadas de forma que nem a loja consegue lê-las, e o acesso ao painel é restrito
          a quem administra a loja.
        </p>
      </LegalSection>

      <LegalSection title="Mudanças nesta política">
        <p>Quando esta política mudar, a data no topo da página muda junto. Mudanças importantes são avisadas por e-mail.</p>
      </LegalSection>
    </LegalPage>
  );
}

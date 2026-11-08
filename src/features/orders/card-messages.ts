/**
 * Motivo da recusa do cartão em português (RF-044 CA3). Os códigos são os do Mercado Pago (`status_detail`); o que não
 * estiver aqui recebe a mensagem geral, sem expor o código para a cliente.
 */
const REJECTIONS: Record<string, string> = {
  cc_rejected_bad_filled_card_number: "Confira o número do cartão.",
  cc_rejected_bad_filled_date: "Confira a validade do cartão.",
  cc_rejected_bad_filled_security_code: "Confira o código de segurança (CVV).",
  cc_rejected_bad_filled_other: "Confira os dados do cartão.",
  cc_rejected_insufficient_amount: "O cartão não tem limite para esta compra.",
  cc_rejected_call_for_authorize: "O banco pediu autorização: ligue para o seu banco e tente de novo.",
  cc_rejected_card_disabled: "O cartão está bloqueado. Fale com o seu banco para liberar.",
  cc_rejected_duplicated_payment: "Já existe um pagamento igual a este. Confira seu extrato antes de tentar de novo.",
  cc_rejected_max_attempts: "Muitas tentativas com este cartão. Use outro cartão ou pague com PIX.",
  cc_rejected_high_risk: "O pagamento não foi aprovado por segurança. Use outro cartão ou pague com PIX.",
  cc_rejected_invalid_installments: "O cartão não aceita esse número de parcelas.",
  cc_rejected_blacklist: "O pagamento não foi aprovado. Use outro cartão ou pague com PIX.",
};

export function cardRejectionMessage(statusDetail: string | null | undefined): string {
  return (statusDetail && REJECTIONS[statusDetail]) ?? "O pagamento não foi aprovado. Tente outro cartão ou pague com PIX.";
}

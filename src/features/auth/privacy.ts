// Regras puras da área de privacidade (entrega 6 §3, P7 e P8), testadas em privacy.test.ts.

/** O que some e o que fica quando a conta é excluída: a tela mostra isso antes de pedir a senha. */
export const DELETION_REMOVES = [
  "Nome, e-mail, celular e CPF",
  "Endereços guardados e a sacola",
  "Destinatário, endereço de entrega, dedicatória e observação dos pedidos",
] as const;

export const DELETION_KEEPS = [
  "Peças, valores e datas dos pedidos, que a loja precisa guardar por obrigação fiscal, sem nada que identifique você",
] as const;

/** "mo-meus-dados-2026-11-20.json", com o dia de Brasília. */
export function exportFileName(now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return `mo-meus-dados-${day}.json`;
}

/** Validação local antes de chamar a API. Nulo: pode enviar. */
export function deletionProblem(password: string, understood: boolean): { field: "password" | "understood"; message: string } | null {
  if (!password) {
    return { field: "password", message: "Informe sua senha para confirmar." };
  }
  if (!understood) {
    return { field: "understood", message: "Confirme que entendeu que a exclusão não pode ser desfeita." };
  }
  return null;
}

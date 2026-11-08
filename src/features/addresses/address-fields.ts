/**
 * Validação do endereço no navegador, só para resposta rápida (ADR-F02). A regra que vale é a da API, que também
 * confere a UF com a faixa do CEP e devolve o erro no campo `state`.
 */

export interface AddressFields {
  recipient: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export const emptyAddressFields: AddressFields = {
  recipient: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

export const BRAZILIAN_STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

const LIMITS = { recipient: 120, street: 120, number: 20, complement: 60, district: 80, city: 80 } as const;

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateAddress(fields: AddressFields): Partial<Record<keyof AddressFields, string>> {
  const errors: Partial<Record<keyof AddressFields, string>> = {};
  const recipient = clean(fields.recipient);
  if (recipient.length < 3 || recipient.length > LIMITS.recipient) {
    errors.recipient = "Informe quem vai receber.";
  }
  if (fields.postalCode.replace(/\D/g, "").length !== 8) {
    errors.postalCode = "CEP inválido: informe os 8 números.";
  }
  if (!clean(fields.street) || clean(fields.street).length > LIMITS.street) {
    errors.street = "Informe a rua.";
  }
  if (!clean(fields.number) || clean(fields.number).length > LIMITS.number) {
    errors.number = "Informe o número, ou \"S/N\".";
  }
  if (clean(fields.complement).length > LIMITS.complement) {
    errors.complement = `O complemento tem até ${LIMITS.complement} caracteres.`;
  }
  if (!clean(fields.district) || clean(fields.district).length > LIMITS.district) {
    errors.district = "Informe o bairro.";
  }
  if (!clean(fields.city) || clean(fields.city).length > LIMITS.city) {
    errors.city = "Informe a cidade.";
  }
  if (!(BRAZILIAN_STATES as readonly string[]).includes(fields.state.trim().toUpperCase())) {
    errors.state = "Escolha a UF.";
  }
  return errors;
}

/** Corpo da API: complemento vazio vai como nulo, CEP só com números. */
export function toAddressRequest(fields: AddressFields, isDefault = false) {
  return {
    recipient: clean(fields.recipient),
    postalCode: fields.postalCode.replace(/\D/g, ""),
    street: clean(fields.street),
    number: clean(fields.number),
    complement: clean(fields.complement) || null,
    district: clean(fields.district),
    city: clean(fields.city),
    state: fields.state.trim().toUpperCase(),
    isDefault,
  };
}

/** Uma linha para listas e para o resumo do checkout: "Rua Augusta, 100 · Apto 12". */
export function formatAddressLine(address: Pick<AddressFields, "street" | "number" | "complement">): string {
  return `${address.street}, ${address.number}${address.complement ? ` · ${address.complement}` : ""}`;
}

/** "Consolação · São Paulo/SP · 01305-000". */
export function formatAddressPlace(address: Pick<AddressFields, "district" | "city" | "state" | "postalCode">): string {
  const cep = address.postalCode.replace(/\D/g, "");
  return `${address.district} · ${address.city}/${address.state} · ${cep.slice(0, 5)}-${cep.slice(5)}`;
}

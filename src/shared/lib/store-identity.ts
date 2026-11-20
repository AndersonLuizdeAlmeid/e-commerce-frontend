// Identificação da loja exigida no site pelo Decreto 7.962/2013 (art. 2º): razão social, CNPJ, endereço e contato.
// Os valores vêm da configuração de cada ambiente (entrega 6 §4.4), nunca do código. Como são NEXT_PUBLIC_*, entram
// no build da imagem, junto com os outros endereços.

export interface StoreIdentity {
  legalName: string | null;
  cnpj: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export type StoreIdentityField = keyof StoreIdentity;

export const STORE_IDENTITY_LABELS: Record<StoreIdentityField, string> = {
  legalName: "razão social",
  cnpj: "CNPJ",
  address: "endereço",
  email: "e-mail de atendimento",
  phone: "telefone de atendimento",
};

const clean = (value: string | undefined): string | null => (value?.trim() ? value.trim() : null);

/** Monta a identidade a partir dos valores crus; vazio vira nulo e o CNPJ ganha a máscara. */
export function buildStoreIdentity(raw: Partial<Record<StoreIdentityField, string | undefined>>): StoreIdentity {
  const cnpj = clean(raw.cnpj);
  return {
    legalName: clean(raw.legalName),
    cnpj: cnpj ? formatCnpj(cnpj) : null,
    address: clean(raw.address),
    email: clean(raw.email),
    phone: clean(raw.phone),
  };
}

/** Lê do ambiente. Cada variável é escrita por extenso porque o Next.js só substitui o acesso literal no build. */
export function storeIdentity(): StoreIdentity {
  return buildStoreIdentity({
    legalName: process.env.NEXT_PUBLIC_STORE_LEGAL_NAME,
    cnpj: process.env.NEXT_PUBLIC_STORE_CNPJ,
    address: process.env.NEXT_PUBLIC_STORE_ADDRESS,
    email: process.env.NEXT_PUBLIC_STORE_EMAIL,
    phone: process.env.NEXT_PUBLIC_STORE_PHONE,
  });
}

/** O que ainda falta: com qualquer item aqui, as páginas legais avisam que são rascunho. */
export function missingStoreIdentity(identity: StoreIdentity): StoreIdentityField[] {
  return (Object.keys(STORE_IDENTITY_LABELS) as StoreIdentityField[]).filter((field) => identity[field] === null);
}

/** "12345678000190" → "12.345.678/0001-90". Outro formato fica como veio. */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14 ? digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : value.trim();
}

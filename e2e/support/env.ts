/** Endereços da pilha de E2E (e2e/compose.yml). */
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:5101";
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://localhost:8125";

/** Administradora do seed de desenvolvimento (appsettings.Development.json do backend). */
export const ADMIN = { email: "admin@loja.local", password: "Admin-Loja-12345" } as const;

/** Senha das clientes criadas pelos testes. Só existe neste banco descartável. */
export const CUSTOMER_PASSWORD = "E2e-Senha-123";

/** Peça do seed de desenvolvimento com uma variação só e sem tamanho: entra na sacola num clique. */
export const PIECE = { slug: "brinco-gota-cristal", name: "Brinco Gota Cristal" } as const;

/** E-mail único por teste, para nenhum depender do que outro deixou no banco. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@e2e.teste`;
}

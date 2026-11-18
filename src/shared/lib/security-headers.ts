/**
 * Headers de segurança da loja (arquivo 17 §2, entrega 6 §3 P5), montados no build pelo `next.config.ts`.
 *
 * A CSP não usa nonce: nonce obriga renderização dinâmica e acabaria com o ISR, que é a base do SEO. Por isso
 * `script-src` aceita `'unsafe-inline'` (os scripts de hidratação do Next são inline); o resto barra o que importa:
 * `<object>`, `<base>`, formulário para fora, a loja dentro de iframe alheio e scripts de qualquer outro domínio.
 *
 * Começa em `Report-Only` (`CSP_MODE` vazio): as violações vão para `/api/csp-report` e para o console, sem bloquear
 * nada. Vira obrigatória com `CSP_MODE=enforce` quando o checkout com cartão e o PIX passarem sem violação (critério C5).
 */

/** Mercado Pago: SDK, Bricks, campos seguros do cartão e antifraude (lista conferida no navegador, entrega 6 C5). */
export const MERCADO_PAGO_SOURCES = [
  "https://sdk.mercadopago.com",
  "https://*.mercadopago.com",
  "https://*.mercadolibre.com",
  "https://*.mlstatic.com",
] as const;

export const CSP_REPORT_PATH = "/api/csp-report";

export interface SecurityHeaderOptions {
  /** `NEXT_PUBLIC_API_URL`: o navegador chama a API direto (login, sacola, checkout). */
  apiUrl: string;
  /** `NEXT_PUBLIC_SITE_URL`: com https, liga o HSTS e o upgrade de requisições. */
  siteUrl: string;
  /** `NEXT_PUBLIC_IMAGES_URL`: bucket das fotos (R2 em produção). */
  imagesUrl?: string;
  /** `CSP_MODE`: `enforce` bloqueia; qualquer outro valor só reporta. */
  cspMode?: string;
  /** `next dev` precisa de `eval` e do WebSocket do recarregamento. */
  development: boolean;
}

export interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

const origin = (url: string | undefined): string | null => {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export function contentSecurityPolicy(options: SecurityHeaderOptions): string {
  const api = origin(options.apiUrl);
  const images = origin(options.imagesUrl);
  const https = options.siteUrl.startsWith("https://");
  const list = (...sources: (string | null | false)[]) => sources.filter(Boolean).join(" ");

  const directives: [string, string][] = [
    ["default-src", "'self'"],
    ["script-src", list("'self'", "'unsafe-inline'", options.development && "'unsafe-eval'", ...MERCADO_PAGO_SOURCES)],
    ["style-src", "'self' 'unsafe-inline'"],
    ["img-src", list("'self'", "data:", "blob:", images, ...MERCADO_PAGO_SOURCES)],
    ["font-src", list("'self'", "data:", "https://*.mlstatic.com")],
    ["connect-src", list("'self'", api, options.development && "ws:", ...MERCADO_PAGO_SOURCES)],
    ["frame-src", list(...MERCADO_PAGO_SOURCES)],
    ["media-src", "'self' blob:"],
    ["worker-src", "'self' blob:"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ["report-uri", CSP_REPORT_PATH],
  ];
  if (https && !options.development) {
    directives.push(["upgrade-insecure-requests", ""]);
  }

  return directives.map(([name, value]) => (value ? `${name} ${value}` : name)).join("; ");
}

export function securityHeaders(options: SecurityHeaderOptions): HeaderRule[] {
  const enforce = options.cspMode === "enforce";
  const common = [
    { key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: contentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
  if (options.siteUrl.startsWith("https://") && !options.development) {
    common.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }

  // Câmera só no painel (leitor de código de barras, RF-059); a vitrine não pede nada do aparelho.
  const permissions = (camera: string) => `camera=${camera}, microphone=(), geolocation=(), usb=()`;

  return [
    { source: "/((?!admin).*)", headers: [...common, { key: "Permissions-Policy", value: permissions("()") }] },
    { source: "/admin", headers: [...common, { key: "Permissions-Policy", value: permissions("(self)") }] },
    { source: "/admin/:path*", headers: [...common, { key: "Permissions-Policy", value: permissions("(self)") }] },
  ];
}

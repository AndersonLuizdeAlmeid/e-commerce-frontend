import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const production = {
  apiUrl: "https://api.loja.com.br",
  siteUrl: "https://loja.com.br",
  imagesUrl: "https://fotos.loja.com.br/mo-images",
  development: false,
};

const header = (rules: ReturnType<typeof securityHeaders>, source: string, key: string) =>
  rules.find((rule) => rule.source === source)?.headers.find((h) => h.key === key)?.value;

describe("CSP da loja (entrega 6 §3, P5)", () => {
  it("libera só a própria loja, a API, as fotos e o Mercado Pago", () => {
    const csp = contentSecurityPolicy(production);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https://api.loja.com.br https://sdk.mercadopago.com");
    expect(csp).toContain("img-src 'self' data: blob: https://fotos.loja.com.br");
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline' https:\/\/sdk\.mercadopago\.com/);
    expect(csp).toContain("frame-src https://sdk.mercadopago.com https://*.mercadopago.com");
  });

  it("barra object, base, formulário para fora e a loja dentro de iframe", () => {
    const csp = contentSecurityPolicy(production);

    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).toContain("report-uri /api/csp-report");
  });

  it("só libera eval e WebSocket no next dev", () => {
    expect(contentSecurityPolicy(production)).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy(production)).not.toContain("ws:");

    const dev = contentSecurityPolicy({ apiUrl: "http://localhost:5001", siteUrl: "http://localhost:3000", development: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });

  it("ignora endereço de fotos inválido em vez de quebrar a política", () => {
    expect(contentSecurityPolicy({ ...production, imagesUrl: "não é url" })).toContain("img-src 'self' data: blob: https://sdk.mercadopago.com");
  });
});

describe("headers de segurança", () => {
  it("começa só reportando e bloqueia com CSP_MODE=enforce", () => {
    const reportOnly = securityHeaders(production);
    expect(header(reportOnly, "/((?!admin).*)", "Content-Security-Policy-Report-Only")).toBeDefined();
    expect(header(reportOnly, "/((?!admin).*)", "Content-Security-Policy")).toBeUndefined();

    const enforced = securityHeaders({ ...production, cspMode: "enforce" });
    expect(header(enforced, "/((?!admin).*)", "Content-Security-Policy")).toBeDefined();
    expect(header(enforced, "/((?!admin).*)", "Content-Security-Policy-Report-Only")).toBeUndefined();
  });

  it("libera a câmera só no painel", () => {
    const rules = securityHeaders(production);

    expect(header(rules, "/((?!admin).*)", "Permissions-Policy")).toContain("camera=()");
    expect(header(rules, "/admin", "Permissions-Policy")).toContain("camera=(self)");
    expect(header(rules, "/admin/:path*", "Permissions-Policy")).toContain("camera=(self)");
  });

  it("manda HSTS só em produção com https", () => {
    expect(header(securityHeaders(production), "/admin", "Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
    expect(header(securityHeaders({ ...production, siteUrl: "http://loja.local" }), "/admin", "Strict-Transport-Security")).toBeUndefined();
    expect(header(securityHeaders({ ...production, development: true }), "/admin", "Strict-Transport-Security")).toBeUndefined();
  });

  it("sempre manda nosniff, DENY e a política de referrer", () => {
    for (const rule of securityHeaders(production)) {
      const keys = Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
      expect(keys["X-Content-Type-Options"]).toBe("nosniff");
      expect(keys["X-Frame-Options"]).toBe("DENY");
      expect(keys["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    }
  });
});

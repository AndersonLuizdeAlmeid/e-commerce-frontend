/**
 * Relatórios de violação da CSP (entrega 6 §3 P5). Enquanto a política estiver em `Report-Only`, é por aqui que se
 * descobre o que a CSP bloquearia (domínio do Mercado Pago que faltou, script inesperado). Grava uma linha JSON no
 * log do container, com só os campos que ajudam a decidir, e nunca a URL completa da página (pode ter parâmetros).
 */
const MAX_BYTES = 8 * 1024;

interface LegacyReport {
  "csp-report"?: Record<string, unknown>;
}

interface ReportingApiEntry {
  type?: string;
  body?: Record<string, unknown>;
}

const text = (value: unknown, max = 300): string | undefined =>
  typeof value === "string" ? value.slice(0, max) : undefined;

const pathOf = (value: unknown): string | undefined => {
  const url = text(value, 2000);
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).pathname;
  } catch {
    return url.slice(0, 100);
  }
};

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  if (body.length === 0 || body.length > MAX_BYTES) {
    return new Response(null, { status: 204 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return new Response(null, { status: 204 });
  }

  // Formato antigo (report-uri): { "csp-report": {...} }. Formato novo (Reporting API): [{ type, body }].
  const reports = Array.isArray(parsed)
    ? (parsed as ReportingApiEntry[]).filter((entry) => entry?.type === "csp-violation").map((entry) => entry.body ?? {})
    : [(parsed as LegacyReport)["csp-report"] ?? {}];

  for (const report of reports.slice(0, 10)) {
    console.warn(
      JSON.stringify({
        event: "csp-violation",
        disposition: text(report.disposition ?? report["disposition"]),
        directive: text(report["effective-directive"] ?? report.effectiveDirective ?? report["violated-directive"]),
        blocked: text(report["blocked-uri"] ?? report.blockedURL, 500),
        page: pathOf(report["document-uri"] ?? report.documentURL),
        source: pathOf(report["source-file"] ?? report.sourceFile),
      }),
    );
  }

  return new Response(null, { status: 204 });
}

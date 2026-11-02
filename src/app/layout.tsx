import type { Metadata } from "next";
import { Jost, Prata } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { organizationJsonLd, websiteJsonLd } from "@/features/catalog/json-ld";
import { SITE_NAME, SITE_SLOGAN, siteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/JsonLd";
import "./globals.css";

// Prata (Didone feita para tela) ecoa o monograma "MO"; Jost é a voz da interface (specs/26 §2.3).
const prata = Prata({ weight: "400", subsets: ["latin"], variable: "--font-prata", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  // Torna canonical/Open Graph absolutos (SEO-04, SEO-13).
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — ${SITE_SLOGAN}`, template: `%s | ${SITE_NAME}` },
  description: "Semijoias, acessórios e bolsas, para ela e para ele, com entrega para todo o Brasil.",
  openGraph: { siteName: SITE_NAME, locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${prata.variable} ${jost.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <JsonLd data={[organizationJsonLd(siteUrl(), SITE_NAME), websiteJsonLd(siteUrl(), SITE_NAME)]} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

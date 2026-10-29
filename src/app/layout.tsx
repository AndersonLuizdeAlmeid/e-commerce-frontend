import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { AccountLink } from "@/features/auth/components/AccountLink";
import { getCategories } from "@/features/catalog/api";
import { organizationJsonLd, websiteJsonLd } from "@/features/catalog/json-ld";
import { SITE_NAME, siteUrl } from "@/shared/lib/site";
import { JsonLd } from "@/shared/ui/JsonLd";
import { SearchForm } from "@/shared/ui/SearchForm";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  // Torna canonical/Open Graph absolutos (SEO-04, SEO-13).
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Roupas e acessórios com entrega para todo o Brasil.",
  openGraph: { siteName: SITE_NAME, locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await getCategories();

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <JsonLd data={[organizationJsonLd(siteUrl(), SITE_NAME), websiteJsonLd(siteUrl(), SITE_NAME)]} />
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                {SITE_NAME}
              </Link>
              <nav aria-label="Categorias" className="order-3 w-full overflow-x-auto sm:order-none sm:w-auto">
                <ul className="flex gap-5 text-sm">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link href={`/categoria/${category.slug}`} className="whitespace-nowrap text-muted hover:text-brand">
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="ml-auto flex items-center gap-3">
                <SearchForm />
                <AccountLink />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

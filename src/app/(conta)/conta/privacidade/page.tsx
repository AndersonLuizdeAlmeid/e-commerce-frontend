import type { Metadata } from "next";
import { AccountNav } from "@/features/auth/components/AccountNav";
import { PrivacyPanel } from "@/features/auth/components/PrivacyPanel";

// Direitos da LGPD na própria conta (entrega 6 §3, P7 e P8). Fora do índice, como o resto da área logada.
export const metadata: Metadata = {
  title: "Privacidade",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">Minha conta</h1>
      <div className="mt-6">
        <AccountNav />
      </div>
      <div className="mt-10">
        <PrivacyPanel />
      </div>
    </section>
  );
}

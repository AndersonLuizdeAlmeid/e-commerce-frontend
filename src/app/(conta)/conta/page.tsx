import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPanel } from "@/features/auth/components/AccountPanel";

// Área logada: renderizada no navegador e fora do índice (specs/16 ADR-F03, specs/24 §1).
export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
      <div className="mt-8">
        <Suspense>
          <AccountPanel />
        </Suspense>
      </div>
    </section>
  );
}

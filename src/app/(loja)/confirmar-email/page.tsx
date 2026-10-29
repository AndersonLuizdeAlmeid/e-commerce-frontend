import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmEmailPanel } from "@/features/auth/components/PasswordRecovery";
import { AuthCard } from "@/shared/ui/form";

// Áreas de conta ficam fora do índice (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Confirmar e-mail",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard title="Confirmar e-mail" description="Falta só um clique para confirmar o seu e-mail.">
      <Suspense>
        <ConfirmEmailPanel />
      </Suspense>
    </AuthCard>
  );
}

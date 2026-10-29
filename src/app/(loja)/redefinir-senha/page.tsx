import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/PasswordRecovery";
import { AuthCard } from "@/shared/ui/form";

// Áreas de conta ficam fora do índice (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Criar nova senha",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard title="Criar nova senha" description="Escolha uma senha nova para a sua conta.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}

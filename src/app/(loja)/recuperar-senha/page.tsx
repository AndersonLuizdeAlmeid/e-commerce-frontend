import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/components/PasswordRecovery";
import { AuthCard } from "@/shared/ui/form";

// Áreas de conta ficam fora do índice (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Esqueci minha senha",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard title="Esqueci minha senha" description="Informe o e-mail da conta e enviaremos um link para criar uma nova senha.">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthCard>
  );
}

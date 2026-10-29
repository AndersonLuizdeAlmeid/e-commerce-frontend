import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { AuthCard } from "@/shared/ui/form";

// Áreas de conta ficam fora do índice (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Criar conta",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard title="Criar conta" description="Leva um minuto. Você precisa de conta para finalizar a compra.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}

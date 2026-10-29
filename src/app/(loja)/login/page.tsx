import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthCard } from "@/shared/ui/form";

// Áreas de conta ficam fora do índice (specs/24-seo.md §1).
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthCard title="Entrar" description="Acesse sua conta para acompanhar pedidos e finalizar compras.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

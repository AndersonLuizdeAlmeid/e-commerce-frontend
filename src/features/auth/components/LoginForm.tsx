"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert, SubmitButton, TextField } from "@/shared/ui/form";
import { useAuth } from "../AuthProvider";
import { safeNextPath, validateEmail } from "../validation";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const invalidEmail = validateEmail(email);
    setEmailError(invalidEmail);
    if (invalidEmail || !password) {
      setError(password ? null : "Informe a senha.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err, "Não foi possível entrar. Tente novamente."));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <TextField label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required error={emailError} />
      <TextField label="Senha" name="password" type="password" autoComplete="current-password" required />
      <div className="text-right text-sm">
        <Link href="/recuperar-senha" className="text-brand underline-offset-4 hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href={next === "/conta" ? "/cadastro" : `/cadastro?next=${encodeURIComponent(next)}`} className="font-medium text-brand hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, SubmitButton, TextField } from "@/shared/ui/form";
import { useAuth } from "../AuthProvider";
import { safeNextPath, validateCpf, validateEmail, validateFullName, validatePassword, validatePhone } from "../validation";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "cpf" | "password" | "confirmPassword", string>>;

/** RF-001: cadastro já entra logado e manda o e-mail de confirmação (EM-01). */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "");

    const found: Errors = {
      fullName: validateFullName(value("fullName")) ?? undefined,
      email: validateEmail(value("email")) ?? undefined,
      phone: validatePhone(value("phone")) ?? undefined,
      cpf: validateCpf(value("cpf")) ?? undefined,
      password: validatePassword(value("password")) ?? undefined,
      confirmPassword: value("password") === value("confirmPassword") ? undefined : "As senhas não conferem.",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setError("Confira os campos destacados.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await register({
        fullName: value("fullName").trim(),
        email: value("email").trim(),
        phone: value("phone"),
        cpf: value("cpf") || null,
        password: value("password"),
      });
      router.replace(next === "/conta" ? "/conta?bem-vindo=1" : next);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err, "Não foi possível criar a conta. Tente novamente."));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <TextField label="Nome completo" name="fullName" autoComplete="name" required error={errors.fullName} />
      <TextField label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required error={errors.email} />
      <TextField label="Celular" name="phone" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="(11) 98765-4321" required error={errors.phone} />
      <TextField
        label="CPF (opcional)"
        name="cpf"
        inputMode="numeric"
        autoComplete="off"
        hint="Pode ser pedido depois, no pagamento."
        error={errors.cpf}
      />
      <TextField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
        error={errors.password}
      />
      <TextField label="Confirme a senha" name="confirmPassword" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
      <SubmitButton pending={pending}>Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

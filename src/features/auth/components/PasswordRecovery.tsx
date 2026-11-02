"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, SubmitButton, TextField, primaryButtonClass } from "@/shared/ui/form";
import { confirmEmail, forgotPassword, resetPassword } from "../api";
import { useAuth } from "../AuthProvider";
import { validateEmail, validatePassword } from "../validation";

/** RF-008: a resposta é sempre a mesma, exista ou não a conta. */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <FormAlert kind="success">
        Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha. O link vale por 1 hora.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <TextField label="E-mail da conta" name="email" type="email" autoComplete="email" inputMode="email" required />
      <SubmitButton pending={pending}>Enviar link</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  if (!token) {
    return <InvalidLink action="/recuperar-senha" label="Pedir um novo link" />;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    const found: Record<string, string> = {};
    const weak = validatePassword(password);
    if (weak) {
      found.newPassword = weak;
    }
    if (password !== confirm) {
      found.confirmPassword = "As senhas não conferem.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <FormAlert kind="success">Senha alterada. Por segurança, as sessões abertas em outros aparelhos foram encerradas.</FormAlert>
        <Link href="/login" className={primaryButtonClass}>
          Entrar com a nova senha
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <TextField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
        error={errors.newPassword}
      />
      <TextField label="Confirme a nova senha" name="confirmPassword" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
    </form>
  );
}

/**
 * RF-009: a confirmação pede um clique em vez de acontecer ao abrir a página, porque antivírus e leitores de e-mail
 * costumam visitar os links sozinhos e gastariam o token.
 */
export function ConfirmEmailPanel() {
  const token = useSearchParams().get("token") ?? "";
  const { markEmailConfirmed } = useAuth();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <InvalidLink action="/conta" label="Ir para minha conta" />;
  }

  async function confirm() {
    setStatus("pending");
    try {
      await confirmEmail(token);
      markEmailConfirmed();
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <FormAlert kind="success">E-mail confirmado. Agora você pode finalizar compras.</FormAlert>
        <Link href="/" className={primaryButtonClass}>
          Continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {status === "error" && error && (
        <FormAlert kind="error">
          {error}{" "}
          <Link href="/conta" className="font-medium underline">
            Reenviar pela minha conta
          </Link>
        </FormAlert>
      )}
      <button
        type="button"
        onClick={confirm}
        disabled={status === "pending"}
        className={primaryButtonClass}
      >
        {status === "pending" ? "Confirmando…" : "Confirmar meu e-mail"}
      </button>
    </div>
  );
}

function InvalidLink({ action, label }: { action: string; label: string }) {
  return (
    <div className="space-y-5">
      <FormAlert kind="error">Link inválido ou incompleto. Confira se copiou o endereço inteiro do e-mail.</FormAlert>
      <Link href={action} className="block text-center text-sm font-medium underline">
        {label}
      </Link>
    </div>
  );
}

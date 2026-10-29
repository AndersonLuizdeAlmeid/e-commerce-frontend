"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, SubmitButton, TextField } from "@/shared/ui/form";
import { changePassword, getProfile, resendConfirmation, updateProfile, type Profile } from "../api";
import { useAuth } from "../AuthProvider";
import { validateCpf, validateFullName, validatePassword, validatePhone } from "../validation";

/** Área do cliente (RF-005, RF-006, RF-009): client component, fora do índice (arquivo 24 §1). */
export function AccountPanel() {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const welcome = useSearchParams().get("bem-vindo") === "1";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/conta");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    getProfile()
      .then((loaded) => active && setProfile(loaded))
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setLoadError(
          err instanceof ApiError && err.status === 403
            ? "Esta é uma conta de administrador. O painel administrativo chega na próxima etapa."
            : errorMessage(err, "Não foi possível carregar seus dados."),
        );
      });
    return () => {
      active = false;
    };
  }, [status]);

  if (status !== "authenticated" || !user) {
    return <p className="text-muted">Carregando sua conta…</p>;
  }

  return (
    <div className="space-y-10">
      {welcome && <FormAlert kind="success">Conta criada! Enviamos um link para confirmar seu e-mail.</FormAlert>}

      <EmailStatus confirmed={user.emailConfirmed} email={user.email} />

      <section aria-labelledby="dados">
        <h2 id="dados" className="text-lg font-semibold">
          Meus dados
        </h2>
        <div className="mt-4">
          {loadError ? <FormAlert kind="info">{loadError}</FormAlert> : profile ? <ProfileForm profile={profile} onSaved={setProfile} /> : <p className="text-muted">Carregando…</p>}
        </div>
      </section>

      <section aria-labelledby="senha">
        <h2 id="senha" className="text-lg font-semibold">
          Trocar senha
        </h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>

      <button
        type="button"
        onClick={async () => {
          await logout();
          router.replace("/");
        }}
        className="text-sm font-medium text-muted underline-offset-4 hover:text-brand hover:underline"
      >
        Sair da conta
      </button>
    </div>
  );
}

function EmailStatus({ confirmed, email }: { confirmed: boolean; email: string }) {
  const [state, setState] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (confirmed) {
    return <FormAlert kind="info">E-mail {email} confirmado.</FormAlert>;
  }

  return (
    <FormAlert kind="info">
      <p>
        Confirme o e-mail <strong>{email}</strong> para poder finalizar compras. O link vale por 24 horas.
      </p>
      {state === "sent" ? (
        <p className="mt-2 font-medium">Link reenviado. Confira também a caixa de spam.</p>
      ) : (
        <button
          type="button"
          disabled={state === "pending"}
          onClick={async () => {
            setState("pending");
            try {
              await resendConfirmation();
              setState("sent");
            } catch (err) {
              setError(errorMessage(err));
              setState("error");
            }
          }}
          className="mt-2 font-medium text-brand underline-offset-4 hover:underline disabled:opacity-60"
        >
          {state === "pending" ? "Enviando…" : "Reenviar link de confirmação"}
        </button>
      )}
      {state === "error" && error && <p className="mt-2 text-red-700">{error}</p>}
    </FormAlert>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: (profile: Profile) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "");
    const phone = String(form.get("phone") ?? "");
    const cpf = String(form.get("cpf") ?? "");

    const found = Object.fromEntries(
      [
        ["fullName", validateFullName(fullName)],
        ["phone", validatePhone(phone)],
        ["cpf", validateCpf(cpf)],
      ].filter(([, problem]) => problem),
    ) as Record<string, string>;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      await updateProfile({ fullName, phone, cpf: cpf || null });
      onSaved(await getProfile());
      setMessage({ kind: "success", text: "Dados salvos." });
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {message && <FormAlert kind={message.kind}>{message.text}</FormAlert>}
      <TextField label="Nome completo" name="fullName" autoComplete="name" defaultValue={profile.fullName} error={errors.fullName} />
      <TextField label="E-mail" name="email" type="email" value={profile.email} readOnly hint="O e-mail não pode ser alterado." />
      <TextField label="Celular" name="phone" type="tel" autoComplete="tel-national" defaultValue={profile.phone ?? ""} error={errors.phone} />
      <TextField
        label="CPF"
        name="cpf"
        inputMode="numeric"
        autoComplete="off"
        placeholder={profile.cpfMasked ?? ""}
        hint={profile.hasCpf ? `Cadastrado: ${profile.cpfMasked}. Deixe em branco para manter.` : "Opcional. Pode ser pedido no pagamento."}
        error={errors.cpf}
      />
      <SubmitButton pending={pending}>Salvar dados</SubmitButton>
    </form>
  );
}

function ChangePasswordForm() {
  const { applySession } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");

    const found: Record<string, string> = {};
    if (!currentPassword) {
      found.currentPassword = "Informe a senha atual.";
    }
    const weak = validatePassword(newPassword);
    if (weak) {
      found.newPassword = weak;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      applySession(await changePassword(currentPassword, newPassword));
      formElement.reset();
      setMessage({ kind: "success", text: "Senha alterada. As sessões em outros aparelhos foram encerradas." });
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {message && <FormAlert kind={message.kind}>{message.text}</FormAlert>}
      <TextField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" error={errors.currentPassword} />
      <TextField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
        error={errors.newPassword}
      />
      <SubmitButton pending={pending}>Trocar senha</SubmitButton>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { deleteMyAccount, exportMyData } from "../api";
import { useAuth } from "../AuthProvider";
import { DELETION_KEEPS, DELETION_REMOVES, deletionProblem, exportFileName } from "../privacy";

/** Minha conta → Privacidade (LGPD, entrega 6 §3 P7 e P8): baixar os dados e excluir a conta, sem falar com ninguém. */
export function PrivacyPanel() {
  const { status, applySession } = useAuth();
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (status === "anonymous" && !deleted) {
      router.replace("/login?next=/conta/privacidade");
    }
  }, [status, deleted, router]);

  if (deleted) {
    return (
      <div className="space-y-4">
        <FormAlert kind="success">Sua conta foi excluída. Seus dados pessoais foram apagados e a sessão foi encerrada.</FormAlert>
        <p className="text-sm text-tinta-suave">Se quiser voltar um dia, é só criar uma conta nova com o mesmo e-mail.</p>
        <Link href="/" className="link-ouro inline-flex min-h-11 items-center text-sm font-medium">
          Voltar à loja
        </Link>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <p className="text-tinta-suave">Carregando sua conta…</p>;
  }

  return (
    <div className="space-y-12">
      <ExportSection />
      <DeleteSection
        onDeleted={() => {
          setDeleted(true);
          applySession(null);
        }}
      />
      <p className="text-sm text-tinta-suave">
        Como a loja trata seus dados está na{" "}
        <Link href="/privacidade" className="underline">
          política de privacidade
        </Link>
        .
      </p>
    </div>
  );
}

function ExportSection() {
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setState("pending");
    setError(null);
    try {
      const data = await exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName();
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("done");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Você já baixou seus dados 3 vezes hoje. Tente de novo amanhã."
          : errorMessage(err, "Não foi possível gerar o arquivo. Tente novamente."),
      );
      setState("idle");
    }
  }

  return (
    <section aria-labelledby="baixar">
      <h2 id="baixar" className="font-display text-2xl leading-tight">
        Baixar meus dados
      </h2>
      <p className="mt-3 text-sm text-tinta-suave">
        Um arquivo com tudo o que a loja guarda sobre você: cadastro, endereços e pedidos, com peças, situação e pagamentos. Até 3 vezes por dia.
      </p>
      <button
        type="button"
        onClick={() => void download()}
        disabled={state === "pending"}
        className="mt-4 inline-flex min-h-11 items-center border border-tinta px-5 text-sm font-medium hover:bg-tinta hover:text-cartela disabled:opacity-60"
      >
        {state === "pending" ? "Gerando…" : "Baixar arquivo"}
      </button>
      <div aria-live="polite">
        {state === "done" && <p className="mt-2 text-sm">Arquivo baixado.</p>}
        {error && <p className="mt-2 text-sm text-alerta">{error}</p>}
      </div>
    </section>
  );
}

function DeleteSection({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; understood?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const problem = deletionProblem(password, form.get("understood") === "on");
    setErrors(problem ? { [problem.field]: problem.message } : {});
    setError(null);
    if (problem) {
      return;
    }

    setPending(true);
    try {
      await deleteMyAccount(password);
      onDeleted();
    } catch (err) {
      const code = err instanceof ApiError ? err.problem?.code : undefined;
      if (code === "Identity.WrongCurrentPassword") {
        setErrors({ password: "A senha não confere." });
      } else {
        setError(errorMessage(err, "Não foi possível excluir a conta. Tente novamente."));
      }
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="excluir" className="border-t border-linha pt-10">
      <h2 id="excluir" className="font-display text-2xl leading-tight">
        Excluir minha conta
      </h2>
      <div className="mt-3 space-y-3 text-sm">
        <p>A exclusão não pode ser desfeita.</p>
        <div>
          <p className="font-medium">O que é apagado</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-tinta-suave">
            {DELETION_REMOVES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium">O que fica</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-tinta-suave">
            {DELETION_KEEPS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-tinta-suave">
          Com um pedido em andamento (do pagamento até a entrega) ou com uma devolução de dinheiro ainda em curso, a conta só pode ser excluída depois.
        </p>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-alerta underline">
          Quero excluir minha conta
        </button>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="mt-6 space-y-5">
          {error && <FormAlert kind="error">{error}</FormAlert>}
          <TextField label="Sua senha" name="password" type="password" autoComplete="current-password" error={errors.password} autoFocus />
          <div>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="understood"
                aria-invalid={errors.understood ? true : undefined}
                aria-describedby={errors.understood ? "entendi-erro" : undefined}
                className="mt-1 size-4 accent-alerta"
              />
              Entendi que meus dados pessoais serão apagados e que a conta não pode ser recuperada.
            </label>
            {errors.understood && (
              <p id="entendi-erro" className="mt-1 text-sm text-alerta">
                {errors.understood}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center bg-alerta px-5 text-sm font-medium text-cartela disabled:opacity-60"
            >
              {pending ? "Excluindo…" : "Excluir minha conta"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center text-sm text-tinta-suave underline">
              Desistir
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

import type { InputHTMLAttributes, Ref } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string | null;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Campo com rótulo visível, dica e erro ligados por aria-describedby (WCAG 2.1 AA, arquivo 16 §8). */
export function TextField({ label, name, error, hint, id, className, ...input }: TextFieldProps) {
  const fieldId = id ?? `campo-${name}`;
  const describedBy = [hint ? `${fieldId}-dica` : null, error ? `${fieldId}-erro` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-xs font-medium uppercase tracking-[0.16em]">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1 block min-h-11 w-full border-b bg-transparent py-2 text-base focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:outline-none ${
          error ? "border-alerta text-alerta" : "border-tinta/40 focus-visible:border-tinta"
        }`}
        {...input}
      />
      {hint && !error && (
        <p id={`${fieldId}-dica`} className="mt-1.5 text-xs text-tinta-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-erro`} className="mt-1.5 text-sm text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

/** Avisos em tinta: o erro ganha a única cor fora do mundo, o resto fica na cartela (specs/26 §2.2). */
export function FormAlert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-alerta text-alerta",
    success: "border-tinta text-tinta",
    info: "border-linha text-tinta",
  }[kind];

  return (
    <div role={kind === "error" ? "alert" : "status"} className={`border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

/** Classes do botão principal (cartão tinta): também usadas em links que fazem papel de botão. */
export const primaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center bg-tinta px-6 text-sm font-medium uppercase tracking-[0.18em] text-cartela transition-colors hover:bg-grafite disabled:opacity-60";

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={primaryButtonClass}>
      {pending ? "Aguarde…" : children}
    </button>
  );
}

/**
 * Moldura das telas de conta: uma cartela estreita e lisa, com título em Prata (modo Operate, specs/26 §4.7).
 */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight">{title}</h1>
      {description && <p className="mt-3 text-tinta-suave">{description}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

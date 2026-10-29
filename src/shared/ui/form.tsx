import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string | null;
  hint?: string;
}

/** Campo com rótulo visível, dica e erro ligados por aria-describedby (WCAG 2.1 AA, arquivo 16 §8). */
export function TextField({ label, name, error, hint, id, className, ...input }: TextFieldProps) {
  const fieldId = id ?? `campo-${name}`;
  const describedBy = [hint ? `${fieldId}-dica` : null, error ? `${fieldId}-erro` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-brand ${
          error ? "border-red-700" : "border-line"
        }`}
        {...input}
      />
      {hint && !error && (
        <p id={`${fieldId}-dica`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-erro`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    info: "border-line bg-white text-ink",
  }[kind];

  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full rounded-md bg-brand px-5 py-3 font-medium text-white hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}

/** Moldura das telas de conta: estreita, centralizada e com título. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

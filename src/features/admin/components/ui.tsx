import type { ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** Peças do painel (modo Operate): densas e sem enfeite. A marca aparece só em detalhes, como o furo de esgotado. */

export const adminButton =
  "inline-flex min-h-10 items-center justify-center gap-2 bg-tinta px-4 text-sm font-medium text-cartela transition-colors hover:bg-grafite disabled:opacity-60";
export const adminButtonGhost =
  "inline-flex min-h-10 items-center justify-center gap-2 border border-tinta/30 px-4 text-sm font-medium transition-colors hover:border-tinta disabled:opacity-60";
export const adminLink = "text-sm underline hover:text-tinta-suave disabled:opacity-60";
export const cellInput =
  "block min-h-9 w-full border border-transparent border-b-tinta/30 bg-transparent px-1.5 text-sm hover:border-tinta/30 focus-visible:border-tinta focus-visible:outline-none";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl leading-tight">{children}</h2>;
}

/** Na loja ou fora dela: o ponto em folha marca o estado ativo; o texto é quem informa (WCAG). */
export function StatusMark({ active, on = "Na loja", off = "Fora da loja" }: { active: boolean; on?: string; off?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span aria-hidden="true" className={`size-2 rounded-full ${active ? "bg-folha" : "border border-dashed border-tinta-suave"}`} />
      <span className={active ? "" : "text-tinta-suave"}>{active ? on : off}</span>
    </span>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  error?: string | null;
  ref?: Ref<HTMLSelectElement>;
}

export function SelectField({ label, name, error, children, className, ...select }: SelectFieldProps) {
  const id = `campo-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.16em]">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={`mt-1 block min-h-11 w-full cursor-pointer border-b bg-transparent py-2 text-base focus-visible:shadow-[0_1px_0_0_currentColor] focus-visible:outline-none ${
          error ? "border-alerta" : "border-tinta/40 focus-visible:border-tinta"
        }`}
        {...select}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string | null;
  hint?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextAreaField({ label, name, error, hint, className, ...textarea }: TextAreaFieldProps) {
  const id = `campo-${name}`;
  const describedBy = [hint && !error ? `${id}-dica` : null, error ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.16em]">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 block w-full border bg-transparent p-2 text-base focus-visible:shadow-[0_0_0_1px_currentColor] focus-visible:outline-none ${
          error ? "border-alerta" : "border-tinta/40 focus-visible:border-tinta"
        }`}
        {...textarea}
      />
      {hint && !error && (
        <p id={`${id}-dica`} className="mt-1.5 text-xs text-tinta-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import { STORE_IDENTITY_LABELS, missingStoreIdentity, storeIdentity, type StoreIdentity } from "@/shared/lib/store-identity";
import { SITE_NAME } from "@/shared/lib/site";

/**
 * Molde das páginas legais (entrega 6 §4.4). Os textos desta fase são rascunho: enquanto a identificação da loja não
 * estiver completa na configuração, a página diz isso no topo, em vez de parecer pronta.
 */
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  const missing = missingStoreIdentity(storeIdentity());

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-4xl leading-tight text-balance">{title}</h1>
      <p className="mt-2 text-sm text-tinta-suave">Atualizada em {updatedAt}</p>
      {missing.length > 0 && (
        <p role="note" className="mt-6 border-l-2 border-alerta pl-3 text-sm">
          Rascunho em revisão. Faltam os dados da loja: {missing.map((field) => STORE_IDENTITY_LABELS[field]).join(", ")}.
        </p>
      )}
      <div className="mt-8 space-y-8 text-[15px] leading-relaxed">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      {children}
    </section>
  );
}

/** Ponto que depende de uma decisão da loja: aparece destacado até ser trocado pelo texto final. */
export function PendingDecision({ children }: { children: ReactNode }) {
  return <mark className="bg-transparent px-0.5 text-alerta underline decoration-dotted underline-offset-2">[A definir pela MO: {children}]</mark>;
}

/** Quem é a loja, com o que a configuração já tiver. */
export function StoreIdentityBlock({ identity = storeIdentity() }: { identity?: StoreIdentity }) {
  return (
    <ul className="space-y-0.5">
      <li>{identity.legalName ?? SITE_NAME}</li>
      {identity.cnpj && <li>CNPJ {identity.cnpj}</li>}
      {identity.address && <li>{identity.address}</li>}
      {identity.email && (
        <li>
          <a href={`mailto:${identity.email}`} className="underline">
            {identity.email}
          </a>
        </li>
      )}
      {identity.phone && <li>{identity.phone}</li>}
    </ul>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminProductSummary } from "../api";
import { StatusMark, adminButtonGhost, adminLink, cellInput } from "./ui";

interface ProductSearchProps {
  id: string;
  label: string;
  actionLabel: string;
  excludeIds?: string[];
  onPick: (product: AdminProductSummary) => void;
}

/**
 * Busca de peça para a vitrine (RF-025). Fica fora de qualquer <form>, porque é usada dentro do formulário da
 * ocasião: o botão de buscar não pode enviar o formulário de fora.
 */
export function ProductSearch({ id, label, actionLabel, excludeIds = [], onPick }: ProductSearchProps) {
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");

  const results = useQuery({
    queryKey: [...adminKeys.products, "busca", term],
    queryFn: () => adminApi.products({ page: 1, search: term, categoryId: "", status: "", collectionId: "" }),
    enabled: term.length > 0,
  });

  function search(event?: FormEvent) {
    event?.preventDefault();
    setTerm(draft.trim());
  }

  const items = results.data?.items.filter((product) => !excludeIds.includes(product.id)) ?? [];

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.16em]">{label}</label>
      <div className="mt-1 flex items-end gap-2">
        <input
          id={id}
          type="search"
          value={draft}
          placeholder="Nome ou SKU"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              search(event);
            }
          }}
          className={`${cellInput} min-h-10 placeholder:text-tinta-suave`}
        />
        <button type="button" className={adminButtonGhost} onClick={() => search()}>Buscar</button>
      </div>

      {results.isFetching && <p role="status" className="mt-2 text-sm text-tinta-suave">Buscando…</p>}
      {results.isError && <div className="mt-2"><FormAlert kind="error">{errorMessage(results.error)}</FormAlert></div>}
      {results.isSuccess && !results.isFetching && items.length === 0 && (
        <p role="status" className="mt-2 text-sm text-tinta-suave">Nenhuma peça encontrada.</p>
      )}
      {items.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-y-auto border-t border-linha text-sm">
          {items.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-linha py-1.5">
              <span className="min-w-0">
                <span className="block font-medium">{product.name}</span>
                <StatusMark active={product.isActive} />
              </span>
              <button type="button" className={adminLink} onClick={() => onPick(product)}>{actionLabel}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

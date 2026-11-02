"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminProduct } from "../api";
import { adminLink } from "./ui";

/** RF-024: a peça mora em uma categoria e pode estar em várias coleções. Cada marcação salva sozinha. */
export function ProductCollections({ product, onChanged }: { product: AdminProduct; onChanged: () => void }) {
  const client = useQueryClient();
  const collections = useQuery({ queryKey: adminKeys.collections, queryFn: adminApi.collections });
  const [error, setError] = useState<string | null>(null);

  const toggle = useMutation({
    mutationFn: async ({ id, included }: { id: string; included: boolean }) => {
      if (included) {
        await adminApi.removeCollectionProducts(id, [product.id]);
      } else {
        await adminApi.addCollectionProducts(id, [product.id]);
      }
    },
    onSuccess: () => {
      onChanged();
      void client.invalidateQueries({ queryKey: adminKeys.collections });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  if (collections.isPending) {
    return <p className="mt-3 text-sm text-tinta-suave">Carregando coleções…</p>;
  }
  if (collections.isError) {
    return <div className="mt-3"><FormAlert kind="error">{errorMessage(collections.error)}</FormAlert></div>;
  }
  if (collections.data.length === 0) {
    return (
      <p className="mt-3 text-sm text-tinta-suave">
        Nenhuma coleção cadastrada. <Link href="/admin/colecoes" className={adminLink}>Criar coleção</Link>
      </p>
    );
  }

  return (
    <fieldset className="mt-3">
      <legend className="sr-only">Coleções desta peça</legend>
      {error && <div className="mb-3"><FormAlert kind="error">{error}</FormAlert></div>}
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {collections.data.map((collection) => {
          const included = product.collectionIds.includes(collection.id);
          return (
            <li key={collection.id}>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={included}
                  disabled={toggle.isPending}
                  onChange={() => {
                    setError(null);
                    toggle.mutate({ id: collection.id, included });
                  }}
                  className="size-4 cursor-pointer accent-tinta"
                />
                {collection.name}
                {!collection.isActive && <span className="text-tinta-suave">(inativa)</span>}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys } from "../api";
import { ProductCollections } from "./ProductCollections";
import { ProductForm } from "./ProductForm";
import { ProductPhotos } from "./ProductPhotos";
import { PageHeader, SectionTitle, StatusMark, adminButton, adminButtonGhost } from "./ui";
import { VariantGrid } from "./VariantGrid";

export function NewProduct() {
  const router = useRouter();
  const client = useQueryClient();

  return (
    <>
      <PageHeader title="Novo produto" description="Primeiro os dados da peça; em seguida você monta a grade. O produto só entra na loja quando você ativar." />
      <ProductForm
        onSaved={(id) => {
          void client.invalidateQueries({ queryKey: adminKeys.products });
          router.replace(`/admin/produtos/${id}`);
        }}
      />
    </>
  );
}

/** Editor do produto: situação na loja, dados, grade de variações e fotos. */
export function ProductEditor({ id }: { id: string }) {
  const client = useQueryClient();
  const product = useQuery({ queryKey: adminKeys.product(id), queryFn: () => adminApi.product(id) });
  const [statusError, setStatusError] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: adminKeys.product(id) }),
      client.invalidateQueries({ queryKey: adminKeys.products }),
    ]);

  const setStatus = useMutation({
    mutationFn: (isActive: boolean) => adminApi.setProductStatus(id, isActive),
    onSuccess: refresh,
    onError: (error) => setStatusError(errorMessage(error)),
  });

  if (product.isPending) {
    return <p className="text-sm text-tinta-suave">Carregando o produto…</p>;
  }

  if (product.isError) {
    return (
      <div className="max-w-xl space-y-4">
        <FormAlert kind="error">{errorMessage(product.error)}</FormAlert>
        <Link href="/admin/produtos" className="text-sm underline">Voltar para os produtos</Link>
      </div>
    );
  }

  const data = product.data;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/produtos" className="underline">Produtos</Link>
      </p>
      <PageHeader
        title={data.name}
        actions={
          <>
            <StatusMark active={data.isActive} />
            {data.isActive && (
              <a href={`/produto/${data.slug}`} target="_blank" rel="noopener noreferrer" className={adminButtonGhost}>
                Ver na loja
              </a>
            )}
            <button
              type="button"
              className={data.isActive ? adminButtonGhost : adminButton}
              disabled={setStatus.isPending}
              onClick={() => {
                setStatusError(null);
                setStatus.mutate(!data.isActive);
              }}
            >
              {data.isActive ? "Tirar da loja" : "Colocar na loja"}
            </button>
          </>
        }
      />
      {statusError && <div className="mb-6"><FormAlert kind="error">{statusError}</FormAlert></div>}

      <div className="space-y-10">
        <section aria-label="Dados da peça">
          <ProductForm product={data} onSaved={() => void refresh()} />
        </section>

        <section aria-labelledby="titulo-colecoes" className="border-t border-linha pt-8">
          <div id="titulo-colecoes"><SectionTitle>Coleções</SectionTitle></div>
          <ProductCollections product={data} onChanged={() => void refresh()} />
        </section>

        <section aria-labelledby="titulo-grade" className="border-t border-linha pt-8">
          <div id="titulo-grade"><SectionTitle>Grade de variações</SectionTitle></div>
          <VariantGrid product={data} onChanged={() => void refresh()} />
        </section>

        <section aria-labelledby="titulo-fotos" className="border-t border-linha pt-8">
          <div id="titulo-fotos"><SectionTitle>Fotos</SectionTitle></div>
          <ProductPhotos product={data} onChanged={() => void refresh()} />
        </section>
      </div>
    </>
  );
}

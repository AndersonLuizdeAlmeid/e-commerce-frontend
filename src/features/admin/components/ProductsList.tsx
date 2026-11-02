"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type ProductListFilters } from "../api";
import { BarcodeScanner } from "./BarcodeScanner";
import { PageHeader, StatusMark, adminButton, adminButtonGhost, adminLink, cellInput } from "./ui";

const selectClass = "min-h-10 cursor-pointer border-b border-tinta/30 bg-transparent px-1 text-sm";

/** RF-051: lista com busca por nome, SKU ou código de barras, o atalho de leitura (RF-059) e coleções em lote (RF-024). */
export function ProductsList() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useSearchParams();
  const [filters, setFilters] = useState<ProductListFilters>({ page: 1, search: "", categoryId: "", status: "", collectionId: params.get("colecao") ?? "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [targetCollection, setTargetCollection] = useState("");
  const [batchMessage, setBatchMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const products = useQuery({
    queryKey: [...adminKeys.products, filters],
    queryFn: () => adminApi.products(filters),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({ queryKey: adminKeys.categories, queryFn: adminApi.categories });
  const collections = useQuery({ queryKey: adminKeys.collections, queryFn: adminApi.collections });

  const batch = useMutation({
    mutationFn: async ({ action }: { action: "add" | "remove" }) => {
      if (action === "add") {
        const { added } = await adminApi.addCollectionProducts(targetCollection, selected);
        return added === 1 ? "1 peça entrou na coleção." : `${added} peças entraram na coleção.`;
      }
      await adminApi.removeCollectionProducts(targetCollection, selected);
      return "As peças selecionadas saíram da coleção.";
    },
    onSuccess: (text) => {
      setBatchMessage({ kind: "info", text });
      setSelected([]);
      void client.invalidateQueries({ queryKey: adminKeys.products });
      void client.invalidateQueries({ queryKey: adminKeys.collections });
    },
    onError: (error) => setBatchMessage({ kind: "error", text: errorMessage(error) }),
  });

  const toggle = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...filters, page: 1, search: String(new FormData(event.currentTarget).get("q") ?? "").trim() });
  }

  async function findCode(code: string) {
    setScanning(false);
    setScanMessage(null);
    try {
      const variant = await adminApi.variantByBarcode(code);
      router.push(`/admin/produtos/${variant.productId}`);
    } catch (error) {
      // CA1: código sem dono → o caminho é abrir a peça e vincular na grade.
      setScanMessage(
        error instanceof ApiError && error.status === 404
          ? `O código ${code} não está em nenhuma variação. Abra o produto e informe o código na linha certa da grade.`
          : errorMessage(error),
      );
    }
  }

  const data = products.data;
  const pageIds = data?.items.map((product) => product.id) ?? [];
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  return (
    <>
      <PageHeader
        title="Produtos"
        actions={
          <>
            <button type="button" className={adminButtonGhost} onClick={() => setScanning(true)}>Ler código de barras</button>
            <Link href="/admin/produtos/novo" className={adminButton}>Novo produto</Link>
          </>
        }
      />

      {scanning && <BarcodeScanner onCode={(code) => void findCode(code)} onClose={() => setScanning(false)} />}
      {scanMessage && <div className="mb-4"><FormAlert kind="info">{scanMessage}</FormAlert></div>}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <form onSubmit={search} role="search" className="flex min-w-60 flex-1 items-end gap-2">
          <label htmlFor="busca-admin" className="sr-only">Buscar por nome, SKU ou código de barras</label>
          <input id="busca-admin" name="q" type="search" placeholder="Nome, SKU ou código de barras" className={`${cellInput} min-h-10 placeholder:text-tinta-suave`} />
          <button type="submit" className={adminButtonGhost}>Buscar</button>
        </form>
        <label className="text-sm">
          <span className="sr-only">Categoria</span>
          <select
            className={selectClass}
            value={filters.categoryId}
            onChange={(event) => setFilters({ ...filters, page: 1, categoryId: event.target.value })}
          >
            <option value="">Todas as categorias</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>{category.parentId ? `— ${category.name}` : category.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Situação</span>
          <select
            className={selectClass}
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, page: 1, status: event.target.value as ProductListFilters["status"] })}
          >
            <option value="">Na loja e fora</option>
            <option value="active">Na loja</option>
            <option value="inactive">Fora da loja</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Coleção</span>
          <select
            className={selectClass}
            value={filters.collectionId}
            onChange={(event) => setFilters({ ...filters, page: 1, collectionId: event.target.value })}
          >
            <option value="">Todas as coleções</option>
            {collections.data?.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
        </label>
      </div>

      {batchMessage && <div className="mb-4"><FormAlert kind={batchMessage.kind}>{batchMessage.text}</FormAlert></div>}

      {selected.length > 0 && (
        <div role="group" aria-label="Ações nas peças selecionadas" className="mb-4 flex flex-wrap items-center gap-3 border border-tinta/30 p-3 text-sm">
          <span className="numeros font-medium">{selected.length === 1 ? "1 peça selecionada" : `${selected.length} peças selecionadas`}</span>
          <label>
            <span className="sr-only">Coleção para as peças selecionadas</span>
            <select className={selectClass} value={targetCollection} onChange={(event) => setTargetCollection(event.target.value)}>
              <option value="">Escolha a coleção</option>
              {collections.data?.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className={adminButton} disabled={!targetCollection || batch.isPending} onClick={() => { setBatchMessage(null); batch.mutate({ action: "add" }); }}>
            Incluir na coleção
          </button>
          <button type="button" className={adminButtonGhost} disabled={!targetCollection || batch.isPending} onClick={() => { setBatchMessage(null); batch.mutate({ action: "remove" }); }}>
            Tirar da coleção
          </button>
          <button type="button" className={adminLink} onClick={() => setSelected([])}>Limpar seleção</button>
        </div>
      )}

      {products.isPending && <p className="text-sm text-tinta-suave">Carregando produtos…</p>}
      {products.isError && <FormAlert kind="error">{errorMessage(products.error)}</FormAlert>}
      {data && data.items.length === 0 && (
        <p className="border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">
          {filters.search || filters.categoryId || filters.status || filters.collectionId ? "Nenhum produto com esses filtros." : "Nenhum produto ainda. Cadastre a primeira peça."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                <th scope="col" className="w-8 py-2 pr-2 font-medium">
                  <input
                    type="checkbox"
                    aria-label="Selecionar as peças desta página"
                    checked={allOnPageSelected}
                    onChange={() => setSelected((ids) => (allOnPageSelected ? ids.filter((id) => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]))}
                    className="size-4 cursor-pointer accent-tinta"
                  />
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">Peça</th>
                <th scope="col" className="py-2 pr-4 font-medium">Categoria</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Preço base</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Variações</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Fotos</th>
                <th scope="col" className="py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((product) => (
                <tr key={product.id} className="border-b border-linha hover:bg-linha/30">
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${product.name}`}
                      checked={selected.includes(product.id)}
                      onChange={() => toggle(product.id)}
                      className="size-4 cursor-pointer accent-tinta"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/produtos/${product.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      <span className="relative block size-11 shrink-0 overflow-hidden bg-linha/60">
                        {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-tinta-suave">{product.categoryName}</td>
                  <td className="numeros py-2 pr-4 text-right">{formatPrice(product.basePrice)}</td>
                  <td className="numeros py-2 pr-4 text-right">{product.variantCount}</td>
                  <td className="numeros py-2 pr-4 text-right">{product.imageCount}</td>
                  <td className="py-2"><StatusMark active={product.isActive} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-4 flex items-center gap-3 text-sm">
          <button type="button" className={adminButtonGhost} disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</button>
          <span className="numeros text-tinta-suave">Página {data.page} de {data.totalPages}</span>
          <button type="button" className={adminButtonGhost} disabled={filters.page >= data.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Próxima</button>
        </nav>
      )}
    </>
  );
}

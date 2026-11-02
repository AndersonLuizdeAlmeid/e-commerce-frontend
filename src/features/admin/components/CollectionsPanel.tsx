"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminCollection } from "../api";
import { collectionSchema, formFieldName, toCollectionInput, type CollectionFormValues } from "../validation";
import { ImageField } from "./ImageField";
import { PageHeader, SectionTitle, SelectField, StatusMark, TextAreaField, adminButton, adminButtonGhost, adminLink } from "./ui";

const THEME_LABEL = { Ivory: "Marfim", Graphite: "Grafite" } as const;

/** RF-024: coleções como Eles e Prata 925. As peças entram em lote pela lista de produtos ou uma a uma no editor. */
export function CollectionsPanel() {
  const client = useQueryClient();
  const collections = useQuery({ queryKey: adminKeys.collections, queryFn: adminApi.collections });
  // Guarda o id, não o cadastro: enviar a capa muda a versão, e o formulário aberto precisa da versão nova.
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.collections });

  const setStatus = useMutation({
    mutationFn: (collection: AdminCollection) => adminApi.setCollectionStatus(collection.id, !collection.isActive),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (collection: AdminCollection) => adminApi.deleteCollection(collection.id),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });

  const list = collections.data ?? [];
  const editing = list.find((collection) => collection.id === editingId) ?? null;

  return (
    <>
      <PageHeader
        title="Coleções"
        description="Agrupam peças de qualquer categoria e ganham página e etiqueta próprias na loja. Para incluir várias peças de uma vez, selecione na lista de produtos."
        actions={
          <button type="button" className={adminButton} onClick={() => setEditingId("new")}>
            Nova coleção
          </button>
        }
      />

      {actionError && (
        <div className="mb-4">
          <FormAlert kind="error">{actionError}</FormAlert>
        </div>
      )}

      <div className={`grid items-start gap-8 ${editingId ? "2xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
        <div className="relative overflow-x-auto">
          {collections.isPending && <p className="text-sm text-tinta-suave">Carregando coleções…</p>}
          {collections.isError && <FormAlert kind="error">{errorMessage(collections.error)}</FormAlert>}
          {collections.isSuccess && list.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma coleção ainda. Crie a primeira, como “Eles”.</p>}
          {list.length > 0 && (
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                  <th scope="col" className="py-2 pr-4 font-medium">Nome</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Cartelas</th>
                  <th scope="col" className="numeros py-2 pr-4 text-right font-medium">Ordem</th>
                  <th scope="col" className="numeros py-2 pr-4 text-right font-medium">Peças</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Situação</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((collection) => (
                  <tr key={collection.id} className="border-b border-linha">
                    <td className="py-2.5 pr-4 font-medium">
                      {collection.name}
                      <span className="block text-xs font-normal text-tinta-suave">/colecao/{collection.slug}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-tinta-suave">{THEME_LABEL[collection.cardTheme]}</td>
                    <td className="numeros py-2.5 pr-4 text-right">{collection.position}</td>
                    <td className="numeros py-2.5 pr-4 text-right">
                      <Link href={`/admin/produtos?colecao=${collection.id}`} className="underline">
                        {collection.productCount}
                        <span className="sr-only"> peças em {collection.name}</span>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4"><StatusMark active={collection.isActive} on="Ativa" off="Inativa" /></td>
                    <td className="whitespace-nowrap py-2.5 text-right">
                      <span className="inline-flex gap-3">
                        <button type="button" className={adminLink} onClick={() => setEditingId(collection.id)}>Editar</button>
                        <button type="button" className={adminLink} disabled={setStatus.isPending} onClick={() => { setActionError(null); setStatus.mutate(collection); }}>
                          {collection.isActive ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className={adminLink}
                          disabled={remove.isPending}
                          onClick={() => {
                            setActionError(null);
                            if (window.confirm(`Excluir a coleção “${collection.name}”? As peças continuam na loja.`)) {
                              remove.mutate(collection);
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {(editingId === "new" || editing) && (
          <CollectionForm
            key={editing?.id ?? "new"}
            collection={editing}
            nextPosition={(list.at(-1)?.position ?? 0) + 10}
            onSaved={() => {
              setEditingId(null);
              void refresh();
            }}
            onImageChanged={() => void refresh()}
            onCancel={() => setEditingId(null)}
          />
        )}
      </div>
    </>
  );
}

interface CollectionFormProps {
  collection: AdminCollection | null;
  nextPosition: number;
  onSaved: () => void;
  onImageChanged: () => void;
  onCancel: () => void;
}

function CollectionForm({ collection, nextPosition, onSaved, onImageChanged, onCancel }: CollectionFormProps) {
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name ?? "",
      slug: collection?.slug ?? "",
      description: collection?.description ?? "",
      cardTheme: collection?.cardTheme ?? "Ivory",
      position: String(collection?.position ?? nextPosition),
      seoTitle: collection?.seoTitle ?? "",
      seoDescription: collection?.seoDescription ?? "",
    },
  });
  const { errors } = form.formState;
  const [generalError, setGeneralError] = useState<string | null>(null);
  const formElement = useRef<HTMLFormElement>(null);

  // Em telas menores o formulário fica abaixo da tabela: quem clica em "Editar" precisa vê-lo.
  useEffect(() => {
    formElement.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const save = useMutation({
    mutationFn: async (values: CollectionFormValues) => {
      const input = toCollectionInput(values);
      if (collection) {
        await adminApi.updateCollection(collection.id, collection.version, input);
      } else {
        await adminApi.createCollection(input);
      }
    },
    onSuccess: onSaved,
    onError: (error) => {
      setGeneralError(errorMessage(error));
      Object.entries(fieldErrors(error)).forEach(([field, message]) =>
        form.setError(formFieldName(field) as keyof CollectionFormValues, { message }),
      );
    },
  });

  return (
    <form
      ref={formElement}
      onSubmit={form.handleSubmit((values) => {
        setGeneralError(null);
        save.mutate(values);
      })}
      noValidate
      className="space-y-4 border border-linha p-5"
    >
      <SectionTitle>{collection ? `Editar ${collection.name}` : "Nova coleção"}</SectionTitle>
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}

      <TextField label="Nome" autoComplete="off" error={errors.name?.message} {...form.register("name")} />
      <TextField
        label="Endereço (slug)"
        autoComplete="off"
        hint="Vazio gera a partir do nome. Trocar depois cria o redirecionamento do antigo."
        error={errors.slug?.message}
        {...form.register("slug")}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Cartelas" error={errors.cardTheme?.message} {...form.register("cardTheme")}>
          <option value="Ivory">Marfim</option>
          <option value="Graphite">Grafite</option>
        </SelectField>
        <TextField label="Ordem" inputMode="numeric" autoComplete="off" error={errors.position?.message} {...form.register("position")} />
      </div>
      <p className="text-xs text-tinta-suave">Cartelas em grafite são da linha masculina. A menor ordem aparece primeiro nas etiquetas e na home.</p>
      <TextAreaField label="Texto da página" error={errors.description?.message} {...form.register("description")} />

      {collection ? (
        <ImageField
          label="Capa"
          imageUrl={collection.imageUrl}
          onUpload={(file) => adminApi.setCollectionImage(collection.id, file)}
          onRemove={() => adminApi.removeCollectionImage(collection.id)}
          onChanged={onImageChanged}
        />
      ) : (
        <p className="text-xs text-tinta-suave">A capa, opcional, pode ser enviada depois de salvar.</p>
      )}

      <details>
        <summary className="cursor-pointer py-1 text-sm font-medium">Busca do Google (SEO)</summary>
        <div className="mt-3 space-y-4">
          <TextField label="Título" autoComplete="off" hint="Até 70 caracteres. Vazio usa o nome." error={errors.seoTitle?.message} {...form.register("seoTitle")} />
          <TextField label="Descrição" autoComplete="off" hint="Até 160 caracteres. Vazio usa o texto da página." error={errors.seoDescription?.message} {...form.register("seoDescription")} />
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <button type="submit" className={adminButton} disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" className={adminButtonGhost} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

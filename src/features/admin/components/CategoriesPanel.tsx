"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminCategory } from "../api";
import { categorySchema, formFieldName, toCategoryInput, type CategoryFormValues } from "../validation";
import { PageHeader, SectionTitle, SelectField, StatusMark, TextAreaField, adminButton, adminButtonGhost, adminLink } from "./ui";

/** RF-050: árvore de categorias à esquerda, formulário ao lado. Subcategoria tem um nível só (Q07). */
export function CategoriesPanel() {
  const client = useQueryClient();
  const categories = useQuery({ queryKey: adminKeys.categories, queryFn: adminApi.categories });
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.categories });

  const setStatus = useMutation({
    mutationFn: (category: AdminCategory) => adminApi.setCategoryStatus(category.id, !category.isActive),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (category: AdminCategory) => adminApi.deleteCategory(category.id),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });

  const list = categories.data ?? [];
  const parents = list.filter((category) => !category.parentId);

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Onde cada peça mora na loja. Os rótulos definem como a grade aparece: “Acabamento” e “Aro” em anéis, “Cor” e “Tamanho” em bolsas."
        actions={
          <button type="button" className={adminButton} onClick={() => setEditing("new")}>
            Nova categoria
          </button>
        }
      />

      {actionError && (
        <div className="mb-4">
          <FormAlert kind="error">{actionError}</FormAlert>
        </div>
      )}

      <div className={`grid items-start gap-8 ${editing ? "2xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
        <div className="relative overflow-x-auto">
          {categories.isPending && <p className="text-sm text-tinta-suave">Carregando categorias…</p>}
          {categories.isError && <FormAlert kind="error">{errorMessage(categories.error)}</FormAlert>}
          {categories.isSuccess && list.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma categoria ainda. Crie a primeira para começar.</p>}
          {list.length > 0 && (
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                  <th scope="col" className="py-2 pr-4 font-medium">Nome</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Rótulos da grade</th>
                  <th scope="col" className="numeros py-2 pr-4 text-right font-medium">Peças</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Situação</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((category) => (
                  <tr key={category.id} className="border-b border-linha">
                    <td className={`py-2.5 pr-4 ${category.parentId ? "pl-6" : "font-medium"}`}>
                      {category.name}
                      <span className="block text-xs text-tinta-suave">/{category.slug}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-tinta-suave">{labelsOf(category)}</td>
                    <td className="numeros py-2.5 pr-4 text-right">{category.productCount}</td>
                    <td className="py-2.5 pr-4"><StatusMark active={category.isActive} on="Ativa" off="Inativa" /></td>
                    <td className="whitespace-nowrap py-2.5 text-right">
                      <span className="inline-flex gap-3">
                        <button type="button" className={adminLink} onClick={() => setEditing(category)}>Editar</button>
                        <button type="button" className={adminLink} disabled={setStatus.isPending} onClick={() => { setActionError(null); setStatus.mutate(category); }}>
                          {category.isActive ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className={adminLink}
                          disabled={remove.isPending}
                          onClick={() => {
                            setActionError(null);
                            if (window.confirm(`Excluir a categoria “${category.name}”?`)) {
                              remove.mutate(category);
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

        {editing && (
          <CategoryForm
            key={editing === "new" ? "new" : `${editing.id}-${editing.version}`}
            category={editing === "new" ? null : editing}
            parents={parents}
            onDone={() => {
              setEditing(null);
              void refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    </>
  );
}

function labelsOf(category: AdminCategory): string {
  if (!category.colorLabel && !category.sizeLabel) {
    return category.parentId ? "Herda da mãe" : "Cor / Tamanho";
  }
  return `${category.colorLabel ?? "—"} / ${category.sizeLabel ?? "—"}`;
}

interface CategoryFormProps {
  category: AdminCategory | null;
  parents: AdminCategory[];
  onDone: () => void;
  onCancel: () => void;
}

function CategoryForm({ category, parents, onDone, onCancel }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parentId: category?.parentId ?? "",
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      colorLabel: category?.colorLabel ?? "",
      sizeLabel: category?.sizeLabel ?? "",
      seoTitle: category?.seoTitle ?? "",
      seoDescription: category?.seoDescription ?? "",
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
    mutationFn: async (values: CategoryFormValues) => {
      const input = toCategoryInput(values);
      if (category) {
        await adminApi.updateCategory(category.id, category.version, input);
      } else {
        await adminApi.createCategory(input);
      }
    },
    onSuccess: onDone,
    onError: (error) => {
      setGeneralError(errorMessage(error));
      Object.entries(fieldErrors(error)).forEach(([field, message]) =>
        form.setError(formFieldName(field) as keyof CategoryFormValues, { message }),
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
      <SectionTitle>{category ? `Editar ${category.name}` : "Nova categoria"}</SectionTitle>
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}

      <TextField label="Nome" autoComplete="off" error={errors.name?.message} {...form.register("name")} />
      <SelectField label="Categoria mãe" error={errors.parentId?.message} {...form.register("parentId")}>
        <option value="">Nenhuma (categoria principal)</option>
        {parents
          .filter((parent) => parent.id !== category?.id)
          .map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
      </SelectField>
      <TextField
        label="Endereço (slug)"
        autoComplete="off"
        hint="Vazio gera a partir do nome. Trocar depois cria o redirecionamento do antigo."
        error={errors.slug?.message}
        {...form.register("slug")}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Rótulo da cor" autoComplete="off" hint="Ex.: Acabamento" error={errors.colorLabel?.message} {...form.register("colorLabel")} />
        <TextField label="Rótulo do tamanho" autoComplete="off" hint="Ex.: Aro" error={errors.sizeLabel?.message} {...form.register("sizeLabel")} />
      </div>
      <p className="text-xs text-tinta-suave">Rótulo vazio herda da categoria mãe; sem mãe, a loja usa “Cor” e “Tamanho”.</p>
      <TextAreaField label="Texto da página" error={errors.description?.message} {...form.register("description")} />
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

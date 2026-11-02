"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminOccasion, type AdminOccasionProduct } from "../api";
import { moveItem } from "../photos";
import { formFieldName, formatIsoDate, occasionSchema, occasionStatus, toOccasionInput, todayInBrasilia, type OccasionFormValues } from "../validation";
import { ImageField } from "./ImageField";
import { ProductSearch } from "./ProductSearch";
import { PageHeader, SectionTitle, SelectField, TextAreaField, adminButton, adminButtonGhost, adminLink } from "./ui";

/** RF-025: o que a home mostra primeiro. A peça em destaque e a ocasião da vez, que entra e sai sozinha pelas datas. */
export function ShowcasePanel() {
  return (
    <>
      <PageHeader title="Vitrine" description="A peça em destaque abre a home. A ocasião aparece logo abaixo das categorias, só durante o período escolhido." />
      <div className="space-y-12">
        <FeaturedSection />
        <OccasionsSection />
      </div>
    </>
  );
}

function FeaturedSection() {
  const client = useQueryClient();
  const featured = useQuery({ queryKey: adminKeys.featured, queryFn: adminApi.featured });
  const [error, setError] = useState<string | null>(null);
  const current = featured.data ?? null;

  const product = useQuery({
    queryKey: adminKeys.product(current?.productId ?? ""),
    queryFn: () => adminApi.product(current?.productId ?? ""),
    enabled: current !== null,
  });
  const colors = [
    ...new Map(
      (product.data?.variants ?? []).flatMap((variant) => (variant.colorId ? [[variant.colorId, variant.colorName ?? ""] as const] : [])),
    ),
  ];

  const save = useMutation({
    mutationFn: ({ productId, colorId }: { productId: string | null; colorId: string | null }) => adminApi.setFeatured(productId, colorId),
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.featured }),
    onError: (e) => setError(errorMessage(e)),
  });

  const choose = (productId: string | null, colorId: string | null = null) => {
    setError(null);
    save.mutate({ productId, colorId });
  };

  return (
    <section aria-labelledby="titulo-destaque">
      <div id="titulo-destaque"><SectionTitle>Peça em destaque</SectionTitle></div>
      {featured.isError && <div className="mt-3"><FormAlert kind="error">{errorMessage(featured.error)}</FormAlert></div>}
      {error && <div className="mt-3"><FormAlert kind="error">{error}</FormAlert></div>}

      <div className="mt-3 grid items-start gap-8 lg:grid-cols-2">
        <div>
          {featured.isPending && <p className="text-sm text-tinta-suave">Carregando…</p>}
          {featured.isSuccess && !current && (
            <p className="border border-dashed border-tinta/30 p-4 text-sm text-tinta-suave">
              Nenhuma peça escolhida. A home mostra a novidade mais recente com estoque.
            </p>
          )}
          {current && (
            <div className="border border-linha p-4">
              <p className="font-display text-xl leading-tight">{current.productName}</p>
              {!current.isAvailable && (
                <div className="mt-3">
                  <FormAlert kind="info">
                    Esta peça está fora da loja ou sem estoque. Enquanto isso, a home mostra a novidade mais recente com estoque.
                  </FormAlert>
                </div>
              )}
              {colors.length > 0 && (
                <SelectField
                  className="mt-3"
                  label="Acabamento que abre escolhido"
                  name="acabamento-destaque"
                  value={current.colorId ?? ""}
                  disabled={save.isPending}
                  onChange={(event) => choose(current.productId, event.target.value || null)}
                >
                  <option value="">Padrão da peça</option>
                  {colors.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </SelectField>
              )}
              <button type="button" className={`${adminLink} mt-3`} disabled={save.isPending} onClick={() => choose(null)}>
                Tirar o destaque
              </button>
            </div>
          )}
        </div>

        <ProductSearch
          id="busca-destaque"
          label={current ? "Trocar a peça" : "Escolher a peça"}
          actionLabel="Destacar"
          excludeIds={current ? [current.productId] : []}
          onPick={(picked) => choose(picked.id)}
        />
      </div>
    </section>
  );
}

function OccasionsSection() {
  const client = useQueryClient();
  const occasions = useQuery({ queryKey: adminKeys.occasions, queryFn: adminApi.occasions });
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.occasions });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteOccasion(id),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });

  const list = occasions.data ?? [];
  const editing = list.find((occasion) => occasion.id === editingId) ?? null;
  const today = todayInBrasilia();

  return (
    <section aria-labelledby="titulo-ocasioes" className="border-t border-linha pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div id="titulo-ocasioes"><SectionTitle>Ocasiões</SectionTitle></div>
        <button type="button" className={adminButton} onClick={() => setEditingId("new")}>Nova ocasião</button>
      </div>
      {actionError && <div className="mt-3"><FormAlert kind="error">{actionError}</FormAlert></div>}

      <div className={`mt-4 grid items-start gap-8 ${editingId ? "2xl:grid-cols-[minmax(0,1fr)_26rem]" : ""}`}>
        <div className="relative overflow-x-auto">
          {occasions.isPending && <p className="text-sm text-tinta-suave">Carregando ocasiões…</p>}
          {occasions.isError && <FormAlert kind="error">{errorMessage(occasions.error)}</FormAlert>}
          {occasions.isSuccess && list.length === 0 && (
            <p className="text-sm text-tinta-suave">Nenhuma ocasião ainda. Cadastre a próxima data, como o Dia das Mães.</p>
          )}
          {list.length > 0 && (
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                  <th scope="col" className="py-2 pr-4 font-medium">Nome</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Período</th>
                  <th scope="col" className="numeros py-2 pr-4 text-right font-medium">Peças</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Situação</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((occasion) => {
                  const status = occasionStatus(occasion, today);
                  return (
                    <tr key={occasion.id} className="border-b border-linha">
                      <td className="py-2.5 pr-4 font-medium">{occasion.name}</td>
                      <td className="numeros whitespace-nowrap py-2.5 pr-4">{formatIsoDate(occasion.startsOn)} a {formatIsoDate(occasion.endsOn)}</td>
                      <td className="numeros py-2.5 pr-4 text-right">{occasion.products.length}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span aria-hidden="true" className={`size-2 rounded-full ${status === "No ar" ? "bg-folha" : "border border-dashed border-tinta-suave"}`} />
                          <span className={status === "No ar" ? "" : "text-tinta-suave"}>{status}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right">
                        <span className="inline-flex gap-3">
                          <button type="button" className={adminLink} onClick={() => setEditingId(occasion.id)}>Editar</button>
                          <button
                            type="button"
                            className={adminLink}
                            disabled={remove.isPending}
                            onClick={() => {
                              setActionError(null);
                              if (window.confirm(`Excluir a ocasião “${occasion.name}”?`)) {
                                remove.mutate(occasion.id);
                              }
                            }}
                          >
                            Excluir
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {(editingId === "new" || editing) && (
          <OccasionForm
            key={editing?.id ?? "new"}
            occasion={editing}
            today={today}
            onSaved={() => {
              setEditingId(null);
              void refresh();
            }}
            onImageChanged={() => void refresh()}
            onCancel={() => setEditingId(null)}
          />
        )}
      </div>
    </section>
  );
}

interface OccasionFormProps {
  occasion: AdminOccasion | null;
  today: string;
  onSaved: () => void;
  onImageChanged: () => void;
  onCancel: () => void;
}

function OccasionForm({ occasion, today, onSaved, onImageChanged, onCancel }: OccasionFormProps) {
  const form = useForm<OccasionFormValues>({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
      name: occasion?.name ?? "",
      text: occasion?.text ?? "",
      startsOn: occasion?.startsOn ?? today,
      endsOn: occasion?.endsOn ?? "",
      isActive: occasion?.isActive ?? true,
    },
  });
  const { errors } = form.formState;
  const [products, setProducts] = useState<AdminOccasionProduct[]>(occasion?.products ?? []);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const formElement = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formElement.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const save = useMutation({
    mutationFn: async (values: OccasionFormValues) => {
      const input = toOccasionInput(values, products.map((product) => product.id));
      if (occasion) {
        await adminApi.updateOccasion(occasion.id, occasion.version, input);
      } else {
        await adminApi.createOccasion(input);
      }
    },
    onSuccess: onSaved,
    onError: (error) => {
      setGeneralError(errorMessage(error));
      Object.entries(fieldErrors(error)).forEach(([field, message]) =>
        form.setError(formFieldName(field) as keyof OccasionFormValues, { message }),
      );
    },
  });

  const textLength = useWatch({ control: form.control, name: "text" }).length;
  const allOut = products.length > 0 && products.every((product) => !product.isActive);

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
      <SectionTitle>{occasion ? `Editar ${occasion.name}` : "Nova ocasião"}</SectionTitle>
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}

      <TextField label="Nome" autoComplete="off" hint="Ex.: Dia das Mães" error={errors.name?.message} {...form.register("name")} />
      <TextAreaField label="Texto curto" rows={2} hint={`${textLength} de 160 caracteres.`} error={errors.text?.message} {...form.register("text")} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Início" type="date" error={errors.startsOn?.message} {...form.register("startsOn")} />
        <TextField label="Fim" type="date" error={errors.endsOn?.message} {...form.register("endsOn")} />
      </div>
      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 cursor-pointer accent-tinta" {...form.register("isActive")} />
        Ativa
      </label>
      <p className="text-xs text-tinta-suave">Vale nos dois dias informados, no horário de Brasília. Fora do período, some da home sozinha.</p>

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em]">Peças da ocasião</p>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">Sem peças, a ocasião não aparece na home.</p>
        ) : (
          <ol className="mt-2 border-t border-linha text-sm">
            {products.map((product, index) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-linha py-1.5">
                <span className="min-w-0">
                  <span className="numeros text-tinta-suave">{index + 1}. </span>
                  {product.name}
                  {!product.isActive && <span className="text-tinta-suave"> (fora da loja)</span>}
                </span>
                <span className="inline-flex gap-3">
                  <button
                    type="button"
                    className={adminLink}
                    disabled={index === 0}
                    aria-label={`Subir ${product.name}`}
                    onClick={() => setProducts((list) => moveItem(list, index, index - 1))}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className={adminLink}
                    disabled={index === products.length - 1}
                    aria-label={`Descer ${product.name}`}
                    onClick={() => setProducts((list) => moveItem(list, index, index + 1))}
                  >
                    Descer
                  </button>
                  <button
                    type="button"
                    className={adminLink}
                    aria-label={`Tirar ${product.name}`}
                    onClick={() => setProducts((list) => list.filter((item) => item.id !== product.id))}
                  >
                    Tirar
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
        {allOut && <p className="mt-2 text-sm text-tinta-suave">Todas estão fora da loja: a ocasião não vai aparecer na home.</p>}
        <div className="mt-3">
          <ProductSearch
            id="busca-ocasiao"
            label="Adicionar peça"
            actionLabel="Adicionar"
            excludeIds={products.map((product) => product.id)}
            onPick={({ id, name, imageUrl, isActive }) => setProducts((list) => [...list, { id, name, imageUrl, isActive }])}
          />
        </div>
      </div>

      {occasion ? (
        <ImageField
          label="Imagem"
          imageUrl={occasion.imageUrl}
          onUpload={(file) => adminApi.setOccasionImage(occasion.id, file)}
          onRemove={() => adminApi.removeOccasionImage(occasion.id)}
          onChanged={onImageChanged}
        />
      ) : (
        <p className="text-xs text-tinta-suave">A imagem, opcional, pode ser enviada depois de salvar.</p>
      )}

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

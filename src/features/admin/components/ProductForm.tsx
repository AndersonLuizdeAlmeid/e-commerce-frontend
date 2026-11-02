"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminProduct } from "../api";
import { formFieldName, formatDecimalInput, productSchema, toProductInput, type ProductFormValues } from "../validation";
import { SelectField, TextAreaField, adminButton } from "./ui";

interface ProductFormProps {
  product?: AdminProduct;
  /** Recebe o id do produto salvo. */
  onSaved: (id: string) => void;
}

/** RF-051: dados da peça, preço base, peso e medidas para o frete, e SEO. */
export function ProductForm({ product, onSaved }: ProductFormProps) {
  const categories = useQuery({ queryKey: adminKeys.categories, queryFn: adminApi.categories });
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: product?.categoryId ?? "",
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      basePrice: product ? formatDecimalInput(product.basePrice, 2) : "",
      weightGrams: product ? String(product.weightGrams) : "",
      heightCm: product ? formatDecimalInput(product.heightCm) : "",
      widthCm: product ? formatDecimalInput(product.widthCm) : "",
      lengthCm: product ? formatDecimalInput(product.lengthCm) : "",
      seoTitle: product?.seoTitle ?? "",
      seoDescription: product?.seoDescription ?? "",
    },
  });
  const { errors } = form.formState;

  // O <select> nasce só com "Escolha" e perde o valor; quando as opções chegam, ele precisa recebê-lo de novo.
  useEffect(() => {
    if (categories.data) {
      form.setValue("categoryId", form.getValues("categoryId"));
    }
  }, [categories.data, form]);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const input = toProductInput(values);
      if (product) {
        await adminApi.updateProduct(product.id, product.version, input);
        return product.id;
      }
      return (await adminApi.createProduct(input)).id;
    },
    onSuccess: (id, values) => {
      // Os valores salvos viram a nova base: "Salvo." some na próxima edição, sem remontar o formulário.
      form.reset(values);
      setSaved(true);
      onSaved(id);
    },
    onError: (error) => {
      setGeneralError(errorMessage(error));
      Object.entries(fieldErrors(error)).forEach(([field, message]) =>
        form.setError(formFieldName(field) as keyof ProductFormValues, { message }),
      );
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        setGeneralError(null);
        setSaved(false);
        save.mutate(values);
      })}
      noValidate
      className="max-w-3xl space-y-5"
    >
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nome" autoComplete="off" error={errors.name?.message} {...form.register("name")} />
        <SelectField label="Categoria" error={errors.categoryId?.message} {...form.register("categoryId")}>
          <option value="">Escolha</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>{category.parentId ? `— ${category.name}` : category.name}</option>
          ))}
        </SelectField>
      </div>
      <TextAreaField label="Descrição" rows={5} hint="Aparece no verso da cartela, na página da peça." error={errors.description?.message} {...form.register("description")} />

      <div className="grid gap-5 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <TextField label="Preço base (R$)" inputMode="decimal" autoComplete="off" hint="Vale para toda variação sem preço próprio." error={errors.basePrice?.message} {...form.register("basePrice")} />
        <TextField label="Endereço (slug)" autoComplete="off" hint="Vazio gera a partir do nome. Trocar depois cria o redirecionamento do antigo." error={errors.slug?.message} {...form.register("slug")} />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Embalagem para o frete</legend>
        <div className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <TextField label="Peso (g)" inputMode="numeric" autoComplete="off" error={errors.weightGrams?.message} {...form.register("weightGrams")} />
          <TextField label="Altura (cm)" inputMode="decimal" autoComplete="off" error={errors.heightCm?.message} {...form.register("heightCm")} />
          <TextField label="Largura (cm)" inputMode="decimal" autoComplete="off" error={errors.widthCm?.message} {...form.register("widthCm")} />
          <TextField label="Compr. (cm)" inputMode="decimal" autoComplete="off" error={errors.lengthCm?.message} {...form.register("lengthCm")} />
        </div>
      </fieldset>

      <details>
        <summary className="cursor-pointer py-1 text-sm font-medium">Busca do Google (SEO)</summary>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <TextField label="Título" autoComplete="off" hint="Até 70 caracteres. Vazio usa o nome." error={errors.seoTitle?.message} {...form.register("seoTitle")} />
          <TextField label="Descrição" autoComplete="off" hint="Até 160 caracteres. Vazio usa a descrição." error={errors.seoDescription?.message} {...form.register("seoDescription")} />
        </div>
      </details>

      <div className="flex items-center gap-4">
        <button type="submit" className={adminButton} disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending ? "Salvando…" : product ? "Salvar dados" : "Criar e montar a grade"}
        </button>
        <p role="status" className="text-sm text-tinta-suave">{saved && !form.formState.isDirty ? "Salvo." : ""}</p>
      </div>
    </form>
  );
}

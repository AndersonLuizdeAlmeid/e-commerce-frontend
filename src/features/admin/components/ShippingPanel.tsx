"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type ShippingSettings } from "../api";
import { formFieldName, formatDecimalInput, shippingSettingsSchema, toShippingSettingsInput, type ShippingSettingsFormValues } from "../validation";
import { PageHeader, SectionTitle, adminButton } from "./ui";

/** RF-058: de onde a loja envia, quanto tempo leva para postar, a caixa padrão e o valor quando a cotação falha. */
export function ShippingPanel() {
  const settings = useQuery({ queryKey: adminKeys.shippingSettings, queryFn: adminApi.shippingSettings });

  return (
    <>
      <PageHeader title="Frete" description="Sem esta configuração, a loja não calcula frete e oferece falar com a MO." />
      {settings.isPending && <p className="text-sm text-tinta-suave">Carregando a configuração…</p>}
      {settings.isError && <FormAlert kind="error">{errorMessage(settings.error)}</FormAlert>}
      {settings.isSuccess && <ShippingSettingsForm settings={settings.data ?? null} />}
    </>
  );
}

function ShippingSettingsForm({ settings }: { settings: ShippingSettings | null }) {
  const client = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      originPostalCode: settings?.originPostalCode ?? "",
      handlingDays: String(settings?.handlingDays ?? 1),
      fallbackPacPrice: settings ? formatDecimalInput(settings.fallbackPacPrice, 2) : "",
      fallbackSedexPrice: settings ? formatDecimalInput(settings.fallbackSedexPrice, 2) : "",
      boxWeightGrams: settings ? String(settings.boxWeightGrams) : "",
      boxHeightCm: settings ? formatDecimalInput(settings.boxHeightCm, 1) : "",
      boxWidthCm: settings ? formatDecimalInput(settings.boxWidthCm, 1) : "",
      boxLengthCm: settings ? formatDecimalInput(settings.boxLengthCm, 1) : "",
    },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: (values: ShippingSettingsFormValues) => adminApi.saveShippingSettings(toShippingSettingsInput(values)),
    onSuccess: () => {
      setSaved(true);
      void client.invalidateQueries({ queryKey: adminKeys.shippingSettings });
    },
    onError: (error) => {
      setGeneralError(errorMessage(error));
      Object.entries(fieldErrors(error)).forEach(([field, message]) =>
        form.setError(formFieldName(field) as keyof ShippingSettingsFormValues, { message }),
      );
    },
  });

  return (
    <form
      noValidate
      className="max-w-2xl space-y-8"
      onSubmit={form.handleSubmit((values) => {
        setGeneralError(null);
        setSaved(false);
        save.mutate(values);
      })}
    >
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}
      {saved && <FormAlert kind="success">Configuração salva. As próximas cotações já usam estes valores.</FormAlert>}

      <section className="space-y-4">
        <SectionTitle>Envio</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="CEP de origem" inputMode="numeric" autoComplete="off" hint="De onde a loja posta as encomendas." error={errors.originPostalCode?.message} {...form.register("originPostalCode")} />
          <TextField label="Dias de manuseio" inputMode="numeric" autoComplete="off" hint="Somados ao prazo dos Correios." error={errors.handlingDays?.message} {...form.register("handlingDays")} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Caixa padrão</SectionTitle>
        <p className="text-sm text-tinta-suave">Usada para calcular o frete. Peça maior que a caixa, como uma bolsa, aumenta o pacote automaticamente.</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <TextField label="Peso (g)" inputMode="numeric" autoComplete="off" error={errors.boxWeightGrams?.message} {...form.register("boxWeightGrams")} />
          <TextField label="Altura (cm)" inputMode="decimal" autoComplete="off" error={errors.boxHeightCm?.message} {...form.register("boxHeightCm")} />
          <TextField label="Largura (cm)" inputMode="decimal" autoComplete="off" error={errors.boxWidthCm?.message} {...form.register("boxWidthCm")} />
          <TextField label="Comprimento (cm)" inputMode="decimal" autoComplete="off" error={errors.boxLengthCm?.message} {...form.register("boxLengthCm")} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Contingência</SectionTitle>
        <p className="text-sm text-tinta-suave">Quando a consulta aos Correios falha, a loja cobra estes valores e avisa o cliente que são uma estimativa.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="PAC (R$)" inputMode="decimal" autoComplete="off" error={errors.fallbackPacPrice?.message} {...form.register("fallbackPacPrice")} />
          <TextField label="SEDEX (R$)" inputMode="decimal" autoComplete="off" error={errors.fallbackSedexPrice?.message} {...form.register("fallbackSedexPrice")} />
        </div>
      </section>

      <button type="submit" className={adminButton} disabled={save.isPending} aria-busy={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar configuração"}
      </button>
    </form>
  );
}

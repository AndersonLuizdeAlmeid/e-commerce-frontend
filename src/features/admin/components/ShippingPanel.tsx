"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, TextField } from "@/shared/ui/form";
import { adminApi, adminKeys, type ShippingRule, type ShippingSettings } from "../api";
import { RULE_EFFECT_LABELS, describeRule, ruleFormDefaults, shippingRuleSchema, toShippingRuleInput, type ShippingRuleFormValues } from "../shipping-rules";
import { formFieldName, formatDecimalInput, shippingSettingsSchema, toShippingSettingsInput, type ShippingSettingsFormValues } from "../validation";
import { PageHeader, SectionTitle, SelectField, StatusMark, TextAreaField, adminButton, adminButtonGhost, adminLink } from "./ui";

/** RF-058: de onde a loja envia, quanto tempo leva para postar, a caixa padrão e o valor quando a cotação falha. */
export function ShippingPanel() {
  const settings = useQuery({ queryKey: adminKeys.shippingSettings, queryFn: adminApi.shippingSettings });

  return (
    <>
      <PageHeader title="Frete" description="Sem esta configuração, a loja não calcula frete e oferece falar com a MO." />
      {settings.isPending && <p className="text-sm text-tinta-suave">Carregando a configuração…</p>}
      {settings.isError && <FormAlert kind="error">{errorMessage(settings.error)}</FormAlert>}
      {settings.isSuccess && <ShippingSettingsForm settings={settings.data ?? null} />}
      <ShippingRules />
    </>
  );
}

/** RF-058: promoções sobre a cotação. A loja lança sem nenhuma, e cada mudança vale na próxima cotação (D08). */
function ShippingRules() {
  const client = useQueryClient();
  const rules = useQuery({ queryKey: adminKeys.shippingRules, queryFn: adminApi.shippingRules });
  const [editing, setEditing] = useState<ShippingRule | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => void client.invalidateQueries({ queryKey: adminKeys.shippingRules });

  const remove = useMutation({
    mutationFn: (rule: ShippingRule) => adminApi.deleteShippingRule(rule.id),
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });

  const toggle = useMutation({
    mutationFn: (rule: ShippingRule) => {
      const { id, ...input } = rule;
      return adminApi.updateShippingRule(id, { ...input, isActive: !rule.isActive });
    },
    onSuccess: refresh,
    onError: (error) => setActionError(errorMessage(error)),
  });

  return (
    <section className="mt-12 max-w-3xl border-t border-linha pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTitle>Regras</SectionTitle>
          <p className="mt-1 text-sm text-tinta-suave">
            Valem sobre o preço dos Correios, do menor número de prioridade para o maior, e se somam. Frete grátis e ocultar serviço encerram a conta daquele serviço.
          </p>
        </div>
        {editing === null && <button type="button" className={adminButtonGhost} onClick={() => setEditing("new")}>Nova regra</button>}
      </div>

      {actionError && <div className="mt-4"><FormAlert kind="error">{actionError}</FormAlert></div>}
      {rules.isError && <div className="mt-4"><FormAlert kind="error">{errorMessage(rules.error)}</FormAlert></div>}

      {editing !== null && (
        <ShippingRuleForm
          key={editing === "new" ? "new" : editing.id}
          rule={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {rules.data?.length === 0 && editing === null && (
        <p className="mt-4 border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">Nenhuma regra: a loja cobra o preço dos Correios.</p>
      )}

      {rules.data && rules.data.length > 0 && (
        <ul className="mt-4 border-t border-tinta/30">
          {rules.data.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-linha py-3">
              <div className="min-w-0 flex-1 basis-72">
                <p className="text-sm font-medium">
                  <span className="numeros mr-2 text-tinta-suave">{rule.priority}</span>
                  {rule.name}
                </p>
                <p className="numeros mt-0.5 text-sm text-tinta-suave">{describeRule(rule)}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusMark active={rule.isActive} on="Ativa" off="Desligada" />
                <button type="button" className={adminLink} disabled={toggle.isPending} onClick={() => { setActionError(null); toggle.mutate(rule); }}>
                  {rule.isActive ? "Desligar" : "Ligar"}<span className="sr-only"> {rule.name}</span>
                </button>
                <button type="button" className={adminLink} onClick={() => setEditing(rule)}>
                  Editar<span className="sr-only"> {rule.name}</span>
                </button>
                <button
                  type="button"
                  className={adminLink}
                  disabled={remove.isPending}
                  onClick={() => {
                    setActionError(null);
                    if (window.confirm(`Excluir a regra “${rule.name}”?`)) {
                      remove.mutate(rule);
                    }
                  }}
                >
                  Excluir<span className="sr-only"> {rule.name}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ShippingRuleForm({ rule, onDone, onCancel }: { rule: ShippingRule | null; onDone: () => void; onCancel: () => void }) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const form = useForm<ShippingRuleFormValues>({ resolver: zodResolver(shippingRuleSchema), defaultValues: ruleFormDefaults(rule) });
  const { errors } = form.formState;
  const effect = useWatch({ control: form.control, name: "effect" });

  const save = useMutation({
    mutationFn: (values: ShippingRuleFormValues) => {
      const input = toShippingRuleInput(values);
      return rule ? adminApi.updateShippingRule(rule.id, input) : adminApi.createShippingRule(input).then(() => undefined);
    },
    onSuccess: onDone,
    onError: (error) => setGeneralError(errorMessage(error)),
  });

  const hasValue = effect !== "FreeShipping" && effect !== "HideService";

  return (
    <form
      noValidate
      className="mt-4 space-y-4 border border-tinta/30 p-4"
      onSubmit={form.handleSubmit((values) => {
        setGeneralError(null);
        save.mutate(values);
      })}
    >
      {generalError && <FormAlert kind="error">{generalError}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField id="regra-nome" label="Nome" autoComplete="off" error={errors.name?.message} {...form.register("name")} />
        <TextField id="regra-prioridade" label="Prioridade" inputMode="numeric" autoComplete="off" error={errors.priority?.message} {...form.register("priority")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Efeito" {...form.register("effect")}>
          {Object.entries(RULE_EFFECT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        {hasValue && (
          <TextField
            id="regra-valor"
            label={effect === "PercentDiscount" ? "Desconto (%)" : "Valor (R$)"}
            inputMode="decimal"
            autoComplete="off"
            error={errors.effectValue?.message}
            {...form.register("effectValue")}
          />
        )}
      </div>

      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.16em]">Serviços</legend>
        <div className="mt-1 flex gap-5">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 cursor-pointer accent-tinta" {...form.register("pac")} /> PAC
          </label>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 cursor-pointer accent-tinta" {...form.register("sedex")} /> SEDEX
          </label>
        </div>
        <p className="text-xs text-tinta-suave">Sem marcar nenhum, vale para os dois.</p>
      </fieldset>

      <p className="text-sm text-tinta-suave">As condições são opcionais. A regra só vale quando todas as preenchidas forem atendidas.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField id="regra-minimo" label="Subtotal mínimo (R$)" inputMode="decimal" autoComplete="off" error={errors.minSubtotal?.message} {...form.register("minSubtotal")} />
        <TextField id="regra-inicio" label="Início" type="date" error={errors.validFrom?.message} {...form.register("validFrom")} />
        <TextField id="regra-fim" label="Fim" type="date" error={errors.validTo?.message} {...form.register("validTo")} />
      </div>

      <TextField id="regra-ufs" label="UFs" autoComplete="off" hint="Siglas separadas por vírgula, como SP, RJ." error={errors.states?.message} {...form.register("states")} />
      <TextAreaField label="Faixas de CEP" hint="Uma por linha, como 01000-000 a 19999-999." rows={2} error={errors.postalCodeRanges?.message} {...form.register("postalCodeRanges")} />

      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 cursor-pointer accent-tinta" {...form.register("isActive")} /> Regra ativa
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={adminButton} disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending ? "Salvando…" : rule ? "Salvar regra" : "Criar regra"}
        </button>
        <button type="button" className={adminButtonGhost} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
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

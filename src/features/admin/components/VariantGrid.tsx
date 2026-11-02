"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/shared/api/problem";
import { formatPrice } from "@/shared/lib/format";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminProduct, type AdminVariant } from "../api";
import { formatDecimalInput, parseDecimal, variantDraftError, type VariantDraft } from "../validation";
import { BarcodeScanner } from "./BarcodeScanner";
import { adminButton, adminButtonGhost, adminLink, cellInput } from "./ui";

const toDraft = (variant: AdminVariant): VariantDraft => ({
  sku: variant.sku,
  price: variant.price === null ? "" : formatDecimalInput(variant.price, 2),
  barcode: variant.barcode ?? "",
});

const sameDraft = (a: VariantDraft, b: VariantDraft) => a.sku === b.sku && a.price === b.price && a.barcode === b.barcode;

/** RF-056: monta a grade escolhendo os valores dos dois eixos e edita cada linha como numa planilha. */
export function VariantGrid({ product, onChanged }: { product: AdminProduct; onChanged: () => void }) {
  const colors = useQuery({ queryKey: adminKeys.colors, queryFn: adminApi.colors });
  const sizes = useQuery({ queryKey: adminKeys.sizes, queryFn: adminApi.sizes });
  const labels = product.variantLabels;

  const [colorIds, setColorIds] = useState<string[]>(() => unique(product.variants.map((v) => v.colorId)));
  const [sizeIds, setSizeIds] = useState<string[]>(() => unique(product.variants.map((v) => v.sizeId)));
  // Só as linhas editadas: o resto sempre mostra o que veio da API.
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scanningFor, setScanningFor] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: () => adminApi.generateVariants(product.id, colorIds, sizeIds),
    onSuccess: ({ created }) => {
      setNotice(created === 0 ? "Essas combinações já existem." : created === 1 ? "1 combinação criada." : `${created} combinações criadas.`);
      onChanged();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const dirtyVariants = product.variants.filter((variant) => {
    const draft = drafts[variant.id];
    return draft !== undefined && !sameDraft(draft, toDraft(variant));
  });

  const saveAll = useMutation({
    mutationFn: async () => {
      const failures: Record<string, string> = {};
      // Uma por vez: cada gravação muda a versão do produto.
      for (const variant of dirtyVariants) {
        const draft = drafts[variant.id];
        if (!draft) {
          continue;
        }
        const invalid = variantDraftError(draft);
        if (invalid) {
          failures[variant.id] = invalid;
          continue;
        }
        try {
          await adminApi.updateVariant(product.id, variant.id, {
            sku: draft.sku.trim(),
            price: draft.price.trim() ? parseDecimal(draft.price) : null,
            barcode: draft.barcode.trim() || null,
            // A grade não edita medidas próprias: quem tem continua com elas.
            weightGrams: variant.weightGrams,
            heightCm: variant.heightCm,
            widthCm: variant.widthCm,
            lengthCm: variant.lengthCm,
          });
        } catch (e) {
          failures[variant.id] = errorMessage(e);
        }
      }
      return failures;
    },
    onSuccess: (failures) => {
      setRowErrors(failures);
      setDrafts(Object.fromEntries(Object.entries(drafts).filter(([id]) => id in failures)));
      if (Object.keys(failures).length === 0) {
        setNotice("Grade salva.");
      }
      onChanged();
    },
  });

  const toggle = useMutation({
    mutationFn: (variant: AdminVariant) => adminApi.setVariantStatus(product.id, variant.id, !variant.isActive),
    onSuccess: onChanged,
    onError: (e) => setError(errorMessage(e)),
  });

  const hasEmptyStock = product.variants.length > 0 && product.variants.every((variant) => variant.quantityOnHand === 0);
  const stockHref = `/admin/estoque?busca=${encodeURIComponent(product.name)}`;

  return (
    <div className="mt-3 space-y-6">
      {error && <FormAlert kind="error">{error}</FormAlert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <AxisPicker title={labels.color} options={colors.data?.map((c) => ({ id: c.id, name: c.name, hex: c.hex })) ?? []} selected={colorIds} onChange={setColorIds} />
        <AxisPicker title={labels.size} options={sizes.data?.map((s) => ({ id: s.id, name: s.name })) ?? []} selected={sizeIds} onChange={setSizeIds} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={adminButtonGhost}
          disabled={generate.isPending}
          onClick={() => {
            setError(null);
            setNotice(null);
            generate.mutate();
          }}
        >
          {colorIds.length === 0 && sizeIds.length === 0 ? "Criar variação única" : "Criar combinações que faltam"}
        </button>
        <p role="status" className="text-sm text-tinta-suave">{notice}</p>
      </div>

      {product.variants.length === 0 ? (
        <p className="border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">
          Nenhuma variação ainda. Escolha os valores acima; sem nenhum marcado, a peça tem uma variação única.
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-tinta/30 text-left text-xs uppercase tracking-[0.12em]">
                <th scope="col" className="py-2 pr-3 font-medium">{labels.color}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{labels.size}</th>
                <th scope="col" className="w-[19rem] py-2 pr-3 font-medium">SKU</th>
                <th scope="col" className="w-24 py-2 pr-3 font-medium">Preço</th>
                <th scope="col" className="py-2 pr-3 font-medium">Código de barras</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Estoque</th>
                <th scope="col" className="py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => {
                const draft = drafts[variant.id] ?? toDraft(variant);
                const update = (patch: Partial<VariantDraft>) => setDrafts({ ...drafts, [variant.id]: { ...draft, ...patch } });
                const rowError = rowErrors[variant.id];
                return (
                  <tr key={variant.id} className={`border-b border-linha align-top ${variant.isActive ? "" : "text-tinta-suave"}`}>
                    <td className="py-1.5 pr-3 leading-9">{variant.colorName ?? "—"}</td>
                    <td className="numeros py-1.5 pr-3 leading-9">{variant.sizeName ?? "—"}</td>
                    <td className="py-1.5 pr-3">
                      <input aria-label={`SKU de ${rowName(variant)}`} value={draft.sku} maxLength={60} onChange={(e) => update({ sku: e.target.value })} className={cellInput} />
                      {rowError && <p role="alert" className="mt-1 text-xs text-alerta">{rowError}</p>}
                    </td>
                    <td className="py-1.5 pr-3">
                      <input
                        aria-label={`Preço de ${rowName(variant)}`}
                        value={draft.price}
                        inputMode="decimal"
                        placeholder={formatPrice(product.basePrice)}
                        onChange={(e) => update({ price: e.target.value })}
                        className={`${cellInput} numeros placeholder:text-tinta-suave`}
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className="flex items-center gap-2">
                        <input
                          aria-label={`Código de barras de ${rowName(variant)}`}
                          value={draft.barcode}
                          inputMode="numeric"
                          onChange={(e) => update({ barcode: e.target.value })}
                          className={`${cellInput} numeros`}
                        />
                        <button type="button" className={`${adminLink} shrink-0`} onClick={() => setScanningFor(variant.id)}>Ler</button>
                      </span>
                    </td>
                    <td className="numeros py-1.5 pr-3 text-right leading-9">{variant.quantityOnHand}</td>
                    <td className="py-1.5 leading-9">
                      <button type="button" className={adminLink} disabled={toggle.isPending} onClick={() => { setError(null); toggle.mutate(variant); }}>
                        {variant.isActive ? "Ativa" : "Inativa"}
                        <span className="sr-only"> (clique para {variant.isActive ? "desativar" : "ativar"})</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {product.variants.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className={adminButton}
            disabled={dirtyVariants.length === 0 || saveAll.isPending}
            aria-busy={saveAll.isPending}
            onClick={() => {
              setNotice(null);
              setError(null);
              saveAll.mutate();
            }}
          >
            {saveAll.isPending ? "Salvando…" : dirtyVariants.length > 1 ? `Salvar ${dirtyVariants.length} linhas` : "Salvar grade"}
          </button>
          <p className="text-xs text-tinta-suave">Preço vazio herda o preço base.</p>
        </div>
      )}

      {product.variants.length > 0 && (
        <p className="text-sm">
          <Link href={stockHref} className={adminLink}>Movimentar o estoque desta peça</Link>
        </p>
      )}

      {hasEmptyStock && (
        <FormAlert kind="info">
          Sem estoque, a peça aparece como esgotada na loja. <Link href={stockHref} className="underline">Dê entrada no estoque.</Link>
        </FormAlert>
      )}

      {scanningFor && (
        <BarcodeScanner
          onCode={(code) => {
            const variant = product.variants.find((item) => item.id === scanningFor);
            if (variant) {
              setDrafts({ ...drafts, [variant.id]: { ...(drafts[variant.id] ?? toDraft(variant)), barcode: code } });
            }
            setScanningFor(null);
          }}
          onClose={() => setScanningFor(null)}
        />
      )}
    </div>
  );
}

function rowName(variant: AdminVariant): string {
  return [variant.colorName, variant.sizeName].filter(Boolean).join(" ") || "variação única";
}

function unique(ids: (string | null)[]): string[] {
  return [...new Set(ids.filter((id): id is string => id !== null))];
}

interface AxisPickerProps {
  title: string;
  options: { id: string; name: string; hex?: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** Valores de um eixo como etiquetas marcáveis, com a mesma ponta dos filtros da loja. */
function AxisPicker({ title, options, selected, onChange }: AxisPickerProps) {
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-[0.16em]">{title}</legend>
      {options.length === 0 && <p className="mt-2 text-sm text-tinta-suave">Cadastre os valores em “Acabamentos e tamanhos”.</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.id} className="group cursor-pointer rounded-sm text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))}
              className="sr-only"
            />
            <span className="etiqueta-ponta flex min-h-9 items-center gap-2 bg-linha/70 py-1 pl-4 pr-3 transition-colors group-hover:bg-linha group-has-[:checked]:bg-tinta group-has-[:checked]:text-cartela">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-cartela group-has-[:checked]:bg-folha-vitrine" />
              {option.hex && <span aria-hidden="true" className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]" style={{ backgroundColor: option.hex }} />}
              <span className="numeros">{option.name}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

import { z } from "zod";
import type { CardTheme, CategoryInput, CollectionInput, OccasionInput, ProductInput } from "./api";

/** Regras dos formulários do painel, no mesmo limite da API (RF-050, RF-051, RF-056). Funções puras, testadas. */

const SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "89,90", "1.289,90" ou "89.90" → número; null quando não é um número positivo. */
export function parseDecimal(value: string): number | null {
  const text = value.trim();
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const number = Number(normalized);
  return number > 0 ? number : null;
}

function parseWholeNumber(value: string): number | null {
  const text = value.trim();
  return /^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null;
}

/** Vazio vira null: a API entende como "gerar" (slug) ou "herdar" (rótulos, preço). */
const blankToNull = (value: string | undefined): string | null => (value?.trim() ? value.trim() : null);

/** Dígito verificador GS1, igual ao da API (RF-056 CA4, RF-059 CA2). */
export function isValidBarcode(value: string): boolean {
  const digits = value.trim();
  if (![8, 12, 13, 14].includes(digits.length) || !/^\d+$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = digits.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

/** ProblemDetails manda "input.Name" ou "sku"; os formulários usam "name" e "sku". */
export function formFieldName(apiField: string): string {
  const last = apiField.split(".").at(-1) ?? apiField;
  return last.charAt(0).toLowerCase() + last.slice(1);
}

const optionalSlug = z
  .string()
  .max(120)
  .refine((value) => !value.trim() || SLUG_FORMAT.test(value.trim()), "Use letras minúsculas, números e hífen. Vazio gera a partir do nome.");

const seoFields = {
  seoTitle: z.string().max(70, "Até 70 caracteres."),
  seoDescription: z.string().max(160, "Até 160 caracteres."),
};

export const categorySchema = z.object({
  parentId: z.string(),
  name: z.string().trim().min(2, "Informe um nome de 2 a 120 caracteres.").max(120, "Informe um nome de 2 a 120 caracteres."),
  slug: optionalSlug,
  description: z.string().max(2000, "Até 2000 caracteres."),
  colorLabel: z.string().max(30, "Até 30 caracteres."),
  sizeLabel: z.string().max(30, "Até 30 caracteres."),
  ...seoFields,
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export function toCategoryInput(values: CategoryFormValues): CategoryInput {
  return {
    parentId: values.parentId || null,
    name: values.name.trim(),
    slug: blankToNull(values.slug),
    description: blankToNull(values.description),
    seoTitle: blankToNull(values.seoTitle),
    seoDescription: blankToNull(values.seoDescription),
    colorLabel: blankToNull(values.colorLabel),
    sizeLabel: blankToNull(values.sizeLabel),
  };
}

export const collectionSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome de 2 a 120 caracteres.").max(120, "Informe um nome de 2 a 120 caracteres."),
  slug: optionalSlug,
  description: z.string().max(2000, "Até 2000 caracteres."),
  cardTheme: z.enum(["Ivory", "Graphite"]),
  position: z.string().refine((value) => /^\d{1,4}$/.test(value.trim()), "Use um número de 0 a 9999."),
  ...seoFields,
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;

export function toCollectionInput(values: CollectionFormValues): CollectionInput {
  return {
    name: values.name.trim(),
    slug: blankToNull(values.slug),
    description: blankToNull(values.description),
    seoTitle: blankToNull(values.seoTitle),
    seoDescription: blankToNull(values.seoDescription),
    cardTheme: values.cardTheme as CardTheme,
    position: Number(values.position.trim()),
  };
}

export const occasionSchema = z
  .object({
    name: z.string().trim().min(2, "Informe um nome de 2 a 120 caracteres.").max(120, "Informe um nome de 2 a 120 caracteres."),
    text: z.string().max(160, "Até 160 caracteres."),
    startsOn: z.string().min(1, "Escolha o início."),
    endsOn: z.string().min(1, "Escolha o fim."),
    isActive: z.boolean(),
  })
  // As datas chegam como AAAA-MM-DD, que em texto já ordena certo.
  .refine((values) => !values.startsOn || !values.endsOn || values.endsOn >= values.startsOn, {
    path: ["endsOn"],
    message: "O fim não pode ser antes do início.",
  });

export type OccasionFormValues = z.infer<typeof occasionSchema>;

export function toOccasionInput(values: OccasionFormValues, productIds: string[]): OccasionInput {
  return {
    name: values.name.trim(),
    text: blankToNull(values.text),
    startsOn: values.startsOn,
    endsOn: values.endsOn,
    isActive: values.isActive,
    productIds,
  };
}

/** A data de hoje no horário de Brasília (RF-025 CA3), no formato da API. */
export function todayInBrasilia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export type OccasionStatus = "Desativada" | "Encerrada" | "No ar" | "Agendada";

/** O que o visitante vê hoje: a ocasião some sozinha fora do período, sem ninguém desativar. */
export function occasionStatus(occasion: { startsOn: string; endsOn: string; isActive: boolean }, today: string): OccasionStatus {
  if (!occasion.isActive) {
    return "Desativada";
  }
  if (today > occasion.endsOn) {
    return "Encerrada";
  }
  return today < occasion.startsOn ? "Agendada" : "No ar";
}

/** "2026-11-02" → "02/11/2026", sem passar por Date (fuso nenhum muda o dia). */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const decimalField = (message: string) => z.string().refine((value) => parseDecimal(value) !== null, message);

export const productSchema = z.object({
  categoryId: z.string().min(1, "Escolha a categoria."),
  name: z.string().trim().min(2, "Informe um nome de 2 a 120 caracteres.").max(120, "Informe um nome de 2 a 120 caracteres."),
  slug: optionalSlug,
  description: z.string().max(5000, "Até 5000 caracteres."),
  basePrice: decimalField("Informe um preço maior que zero, como 89,90."),
  weightGrams: z.string().refine((value) => parseWholeNumber(value) !== null, "Informe o peso em gramas."),
  heightCm: decimalField("Informe a altura em cm."),
  widthCm: decimalField("Informe a largura em cm."),
  lengthCm: decimalField("Informe o comprimento em cm."),
  ...seoFields,
});

export type ProductFormValues = z.infer<typeof productSchema>;

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    categoryId: values.categoryId,
    name: values.name.trim(),
    slug: blankToNull(values.slug),
    description: blankToNull(values.description),
    basePrice: parseDecimal(values.basePrice) ?? 0,
    weightGrams: parseWholeNumber(values.weightGrams) ?? 0,
    heightCm: parseDecimal(values.heightCm) ?? 0,
    widthCm: parseDecimal(values.widthCm) ?? 0,
    lengthCm: parseDecimal(values.lengthCm) ?? 0,
    seoTitle: blankToNull(values.seoTitle),
    seoDescription: blankToNull(values.seoDescription),
  };
}

/** Número no formato da tela: 89.9 → "89,90" no preço; medidas sem casas à toa. */
export function formatDecimalInput(value: number, decimals?: number): string {
  return (decimals === undefined ? String(value) : value.toFixed(decimals)).replace(".", ",");
}

export interface VariantDraft {
  sku: string;
  price: string;
  barcode: string;
}

/** Erro de uma linha da grade, ou null. Preço vazio herda o base; código vazio desvincula. */
export function variantDraftError(draft: VariantDraft): string | null {
  if (!draft.sku.trim()) {
    return "Informe o SKU.";
  }
  if (draft.sku.trim().length > 60) {
    return "O SKU tem até 60 caracteres.";
  }
  if (draft.price.trim() && parseDecimal(draft.price) === null) {
    return "Preço inválido. Use 89,90 ou deixe vazio para herdar.";
  }
  if (draft.barcode.trim() && !isValidBarcode(draft.barcode)) {
    return "Código de barras inválido: confira os números.";
  }
  return null;
}

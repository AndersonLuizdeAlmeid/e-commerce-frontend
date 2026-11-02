import { z } from "zod";
import { formatPrice } from "@/shared/lib/format";
import type { ShippingRule, ShippingRuleEffect, ShippingRuleInput } from "./api";
import { formatDecimalInput, formatIsoDate, parseDecimal } from "./validation";

/** Regras do formulário de regra de frete (RF-058), no mesmo limite da API. Funções puras, testadas. */

export const RULE_EFFECT_LABELS: Record<ShippingRuleEffect, string> = {
  FreeShipping: "Frete grátis",
  PercentDiscount: "Desconto em %",
  FixedDiscount: "Desconto em R$",
  Surcharge: "Acréscimo em R$",
  HideService: "Ocultar serviço",
};

const BRAZILIAN_STATES = new Set([
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB",
  "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]);

const effectHasValue = (effect: ShippingRuleEffect) => effect !== "FreeShipping" && effect !== "HideService";

/** "sp, RJ mg" → ["SP", "RJ", "MG"]; null se alguma não for UF. */
export function parseStates(text: string): string[] | null {
  const states = [...new Set(text.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  return states.every((state) => BRAZILIAN_STATES.has(state)) ? states : null;
}

/** Uma faixa por linha: "01000-000 a 19999-999"; null se alguma linha não for uma faixa em ordem. */
export function parseRanges(text: string): { from: string; to: string }[] | null {
  const ranges: { from: string; to: string }[] = [];
  for (const line of text.split("\n").map((item) => item.trim()).filter(Boolean)) {
    const match = /^(\d{5}-?\d{3})\s*(?:a|até|ate)\s*(\d{5}-?\d{3})$/i.exec(line);
    if (!match?.[1] || !match[2]) {
      return null;
    }
    const from = match[1].replace("-", "");
    const to = match[2].replace("-", "");
    if (from > to) {
      return null;
    }
    ranges.push({ from, to });
  }
  return ranges;
}

const maskCep = (cep: string) => `${cep.slice(0, 5)}-${cep.slice(5)}`;

export function formatRanges(ranges: { from: string; to: string }[]): string {
  return ranges.map((range) => `${maskCep(range.from)} a ${maskCep(range.to)}`).join("\n");
}

export const shippingRuleSchema = z
  .object({
    name: z.string().trim().min(2, "Dê um nome de 2 a 120 caracteres.").max(120, "Dê um nome de 2 a 120 caracteres."),
    effect: z.enum(["FreeShipping", "PercentDiscount", "FixedDiscount", "Surcharge", "HideService"]),
    effectValue: z.string(),
    priority: z.string().refine((value) => /^\d+$/.test(value.trim()) && Number(value) <= 100000, "Informe um número de 0 a 100000."),
    isActive: z.boolean(),
    validFrom: z.string(),
    validTo: z.string(),
    minSubtotal: z.string().refine((value) => !value.trim() || parseDecimal(value) !== null, "Informe um valor, como 299,00."),
    states: z.string().refine((value) => parseStates(value) !== null, "Use as siglas, como SP, RJ."),
    postalCodeRanges: z.string().refine((value) => parseRanges(value) !== null, "Uma faixa por linha, como 01000-000 a 19999-999."),
    pac: z.boolean(),
    sedex: z.boolean(),
  })
  .superRefine((values, context) => {
    if (effectHasValue(values.effect)) {
      const value = parseDecimal(values.effectValue);
      if (value === null || (values.effect === "PercentDiscount" && value > 100)) {
        context.addIssue({
          code: "custom",
          path: ["effectValue"],
          message: values.effect === "PercentDiscount" ? "Informe de 0,01 a 100." : "Informe um valor, como 5,00.",
        });
      }
    }
    if (values.validFrom && values.validTo && values.validTo < values.validFrom) {
      context.addIssue({ code: "custom", path: ["validTo"], message: "O fim não pode ser antes do início." });
    }
  });

export type ShippingRuleFormValues = z.infer<typeof shippingRuleSchema>;

export function ruleFormDefaults(rule: ShippingRule | null): ShippingRuleFormValues {
  return {
    name: rule?.name ?? "",
    effect: rule?.effect ?? "FreeShipping",
    effectValue: rule?.effectValue == null ? "" : formatDecimalInput(rule.effectValue, 2),
    priority: String(rule?.priority ?? 10),
    isActive: rule?.isActive ?? true,
    validFrom: rule?.validFrom ?? "",
    validTo: rule?.validTo ?? "",
    minSubtotal: rule?.minSubtotal == null ? "" : formatDecimalInput(rule.minSubtotal, 2),
    states: rule?.states.join(", ") ?? "",
    postalCodeRanges: rule ? formatRanges(rule.postalCodeRanges) : "",
    pac: rule?.serviceCodes.includes("PAC") ?? false,
    sedex: rule?.serviceCodes.includes("SEDEX") ?? false,
  };
}

export function toShippingRuleInput(values: ShippingRuleFormValues): ShippingRuleInput {
  return {
    name: values.name.trim(),
    priority: Number(values.priority),
    isActive: values.isActive,
    validFrom: values.validFrom || null,
    validTo: values.validTo || null,
    minSubtotal: values.minSubtotal.trim() ? parseDecimal(values.minSubtotal) : null,
    states: parseStates(values.states) ?? [],
    postalCodeRanges: parseRanges(values.postalCodeRanges) ?? [],
    // Os dois marcados dá no mesmo que nenhum: a regra vale para todos os serviços.
    serviceCodes: values.pac === values.sedex ? [] : [values.pac ? "PAC" : "SEDEX"],
    effect: values.effect,
    effectValue: effectHasValue(values.effect) ? parseDecimal(values.effectValue) : null,
  };
}

/** "Frete grátis · só PAC · acima de R$ 299,00 · SP, RJ · até 30/11/2026": a regra lida em uma linha. */
export function describeRule(rule: ShippingRuleInput): string {
  const effect =
    rule.effect === "PercentDiscount"
      ? `${formatDecimalInput(rule.effectValue ?? 0)}% de desconto`
      : rule.effect === "FixedDiscount"
        ? `${formatPrice(rule.effectValue ?? 0)} de desconto`
        : rule.effect === "Surcharge"
          ? `${formatPrice(rule.effectValue ?? 0)} de acréscimo`
          : RULE_EFFECT_LABELS[rule.effect];

  const period =
    rule.validFrom && rule.validTo
      ? `de ${formatIsoDate(rule.validFrom)} a ${formatIsoDate(rule.validTo)}`
      : rule.validFrom
        ? `a partir de ${formatIsoDate(rule.validFrom)}`
        : rule.validTo
          ? `até ${formatIsoDate(rule.validTo)}`
          : null;

  return [
    effect,
    rule.serviceCodes.length > 0 ? `só ${rule.serviceCodes.join(", ")}` : null,
    rule.minSubtotal != null ? `a partir de ${formatPrice(rule.minSubtotal)}` : null,
    rule.states.length > 0 ? rule.states.join(", ") : null,
    rule.postalCodeRanges.length > 0 ? (rule.postalCodeRanges.length === 1 ? "1 faixa de CEP" : `${rule.postalCodeRanges.length} faixas de CEP`) : null,
    period,
  ]
    .filter(Boolean)
    .join(" · ");
}

import { describe, expect, it } from "vitest";
import type { ShippingRule } from "./api";
import { describeRule, formatRanges, parseRanges, parseStates, ruleFormDefaults, shippingRuleSchema, toShippingRuleInput } from "./shipping-rules";

const valid = {
  name: "Frete grátis",
  effect: "FreeShipping" as const,
  effectValue: "",
  priority: "10",
  isActive: true,
  validFrom: "",
  validTo: "",
  minSubtotal: "",
  states: "",
  postalCodeRanges: "",
  pac: false,
  sedex: false,
};

describe("parseStates", () => {
  it("aceita minúsculas, vírgula e espaço, sem repetir", () => {
    expect(parseStates("sp, RJ mg;SP")).toEqual(["SP", "RJ", "MG"]);
    expect(parseStates("")).toEqual([]);
  });

  it("recusa o que não é UF", () => {
    expect(parseStates("SP, XX")).toBeNull();
    expect(parseStates("São Paulo")).toBeNull();
  });
});

describe("parseRanges", () => {
  it("lê uma faixa por linha, com ou sem hífen", () => {
    expect(parseRanges("01000-000 a 19999-999\n\n20000000 até 28999999")).toEqual([
      { from: "01000000", to: "19999999" },
      { from: "20000000", to: "28999999" },
    ]);
    expect(parseRanges("  ")).toEqual([]);
  });

  it.each(["01000-000", "abc a def", "19999-999 a 01000-000", "0100 a 0200"])("recusa %j", (text) => {
    expect(parseRanges(text)).toBeNull();
  });

  it("volta ao texto do formulário", () => {
    expect(formatRanges([{ from: "01000000", to: "19999999" }])).toBe("01000-000 a 19999-999");
  });
});

describe("shippingRuleSchema", () => {
  it.each([
    ["FreeShipping", ""],
    ["HideService", ""],
    ["PercentDiscount", "50"],
    ["PercentDiscount", "100"],
    ["FixedDiscount", "5,50"],
    ["Surcharge", "3"],
  ])("aceita %s com valor %j", (effect, effectValue) => {
    expect(shippingRuleSchema.safeParse({ ...valid, effect, effectValue }).success).toBe(true);
  });

  it.each([
    [{ name: "x" }],
    [{ effect: "PercentDiscount", effectValue: "" }],
    [{ effect: "PercentDiscount", effectValue: "101" }],
    [{ effect: "Surcharge", effectValue: "0" }],
    [{ priority: "-1" }],
    [{ priority: "100001" }],
    [{ minSubtotal: "abc" }],
    [{ states: "XX" }],
    [{ postalCodeRanges: "qualquer" }],
    [{ validFrom: "2026-11-30", validTo: "2026-11-01" }],
  ])("recusa %j", (patch) => {
    expect(shippingRuleSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("toShippingRuleInput", () => {
  it("converte o formulário para o que a API espera", () => {
    const values = shippingRuleSchema.parse({
      ...valid,
      name: "  Sudeste ",
      effect: "PercentDiscount",
      effectValue: "12,5",
      minSubtotal: "299,00",
      states: "sp rj",
      postalCodeRanges: "01000-000 a 19999-999",
      validTo: "2026-11-30",
      pac: true,
    });
    expect(toShippingRuleInput(values)).toEqual({
      name: "Sudeste",
      priority: 10,
      isActive: true,
      validFrom: null,
      validTo: "2026-11-30",
      minSubtotal: 299,
      states: ["SP", "RJ"],
      postalCodeRanges: [{ from: "01000000", to: "19999999" }],
      serviceCodes: ["PAC"],
      effect: "PercentDiscount",
      effectValue: 12.5,
    });
  });

  it("nenhum ou os dois serviços valem para todos, e grátis não leva valor", () => {
    expect(toShippingRuleInput({ ...valid }).serviceCodes).toEqual([]);
    expect(toShippingRuleInput({ ...valid, pac: true, sedex: true }).serviceCodes).toEqual([]);
    expect(toShippingRuleInput({ ...valid, sedex: true }).serviceCodes).toEqual(["SEDEX"]);
    expect(toShippingRuleInput({ ...valid, effectValue: "10" }).effectValue).toBeNull();
  });
});

describe("ruleFormDefaults e describeRule", () => {
  const rule: ShippingRule = {
    id: "1",
    name: "Sudeste",
    priority: 5,
    isActive: true,
    validFrom: "2026-11-01",
    validTo: "2026-11-30",
    minSubtotal: 299,
    states: ["SP", "RJ"],
    postalCodeRanges: [{ from: "30000000", to: "30999999" }],
    serviceCodes: ["PAC"],
    effect: "FreeShipping",
    effectValue: null,
  };

  it("volta a regra salva para o formulário sem perder nada", () => {
    expect({ ...toShippingRuleInput(shippingRuleSchema.parse(ruleFormDefaults(rule))), id: rule.id }).toEqual(rule);
  });

  it("descreve a regra em uma linha", () => {
    const text = describeRule(rule).replace(/ /g, " ");
    expect(text).toBe("Frete grátis · só PAC · a partir de R$ 299,00 · SP, RJ · 1 faixa de CEP · de 01/11/2026 a 30/11/2026");
  });

  it("escreve o efeito com o valor e omite o que não há", () => {
    const base = { ...rule, validFrom: null, validTo: null, minSubtotal: null, states: [], postalCodeRanges: [], serviceCodes: [] };
    expect(describeRule({ ...base, effect: "PercentDiscount", effectValue: 50 })).toBe("50% de desconto");
    expect(describeRule({ ...base, effect: "Surcharge", effectValue: 3 }).replace(/ /g, " ")).toBe("R$ 3,00 de acréscimo");
    expect(describeRule({ ...base, effect: "HideService", serviceCodes: ["SEDEX"], validTo: "2026-12-01" })).toBe("Ocultar serviço · só SEDEX · até 01/12/2026");
  });
});

import { describe, expect, it } from "vitest";
import {
  categorySchema,
  collectionSchema,
  formFieldName,
  formatDecimalInput,
  formatIsoDate,
  isValidBarcode,
  occasionSchema,
  occasionStatus,
  parseDecimal,
  productSchema,
  toCategoryInput,
  toCollectionInput,
  toOccasionInput,
  toProductInput,
  todayInBrasilia,
  variantDraftError,
} from "./validation";

describe("parseDecimal", () => {
  it.each([
    ["89,90", 89.9],
    ["1.289,90", 1289.9],
    ["89.90", 89.9],
    [" 12 ", 12],
  ])("entende %s", (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(["", "abc", "0", "-5", "1,2,3"])("recusa %s", (text) => {
    expect(parseDecimal(text)).toBeNull();
  });
});

describe("isValidBarcode (RF-059 CA2)", () => {
  it.each(["7891234567895", "96385074"])("aceita %s", (code) => {
    expect(isValidBarcode(code)).toBe(true);
  });

  it.each(["7891234567890", "123", "78912345678AB", ""])("recusa %s", (code) => {
    expect(isValidBarcode(code)).toBe(false);
  });
});

describe("formFieldName", () => {
  it("tira o prefixo do comando e deixa em camelCase", () => {
    expect(formFieldName("input.Name")).toBe("name");
    expect(formFieldName("category.SeoTitle")).toBe("seoTitle");
    expect(formFieldName("sku")).toBe("sku");
  });
});

describe("categorySchema", () => {
  const valid = { parentId: "", name: "Anéis", slug: "", description: "", colorLabel: "", sizeLabel: "", seoTitle: "", seoDescription: "" };

  it("transforma campos vazios em null: a API gera o slug e herda os rótulos", () => {
    const input = toCategoryInput(categorySchema.parse(valid));
    expect(input).toMatchObject({ parentId: null, slug: null, colorLabel: null, sizeLabel: null });
  });

  it("recusa slug com acento ou maiúscula", () => {
    expect(categorySchema.safeParse({ ...valid, slug: "Anéis" }).success).toBe(false);
  });

  it("recusa rótulo longo", () => {
    expect(categorySchema.safeParse({ ...valid, sizeLabel: "x".repeat(31) }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const valid = {
    categoryId: "c1",
    name: "Anel Solitário",
    slug: "",
    description: "",
    basePrice: "89,90",
    weightGrams: "20",
    heightCm: "3",
    widthCm: "5,5",
    lengthCm: "5",
    seoTitle: "",
    seoDescription: "",
  };

  it("converte preço e medidas para número", () => {
    expect(toProductInput(productSchema.parse(valid))).toMatchObject({ basePrice: 89.9, weightGrams: 20, widthCm: 5.5 });
  });

  it.each(["categoryId", "basePrice", "weightGrams", "heightCm"])("exige %s", (field) => {
    expect(productSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
  });

  it("recusa peso quebrado", () => {
    expect(productSchema.safeParse({ ...valid, weightGrams: "20,5" }).success).toBe(false);
  });
});

describe("formatDecimalInput", () => {
  it("usa vírgula e fixa as casas do preço", () => {
    expect(formatDecimalInput(89.9, 2)).toBe("89,90");
    expect(formatDecimalInput(5.5)).toBe("5,5");
  });
});

describe("variantDraftError", () => {
  const valid = { sku: "ANEL-1", price: "", barcode: "" };

  it("aceita preço e código vazios (herda e desvincula)", () => {
    expect(variantDraftError(valid)).toBeNull();
  });

  it("aponta o que está errado", () => {
    expect(variantDraftError({ ...valid, sku: " " })).toContain("SKU");
    expect(variantDraftError({ ...valid, price: "abc" })).toContain("Preço");
    expect(variantDraftError({ ...valid, barcode: "7891234567890" })).toContain("Código");
  });
});

describe("collectionSchema (RF-024)", () => {
  const valid = { name: "Eles", slug: "", description: "", cardTheme: "Graphite", position: "10", seoTitle: "", seoDescription: "" } as const;

  it("aceita e converte para a API", () => {
    expect(toCollectionInput(collectionSchema.parse({ ...valid, name: "  Eles " }))).toEqual({
      name: "Eles",
      slug: null,
      description: null,
      seoTitle: null,
      seoDescription: null,
      cardTheme: "Graphite",
      position: 10,
    });
  });

  it.each(["", "abc", "-1", "10000", "1,5"])("recusa a ordem %s", (position) => {
    expect(collectionSchema.safeParse({ ...valid, position }).success).toBe(false);
  });

  it("recusa tema fora da lista", () => {
    expect(collectionSchema.safeParse({ ...valid, cardTheme: "Verde" }).success).toBe(false);
  });
});

describe("occasionSchema (RF-025)", () => {
  const valid = { name: "Dia das Mães", text: "", startsOn: "2027-05-01", endsOn: "2027-05-09", isActive: true };

  it("aceita início e fim no mesmo dia", () => {
    expect(occasionSchema.safeParse({ ...valid, endsOn: valid.startsOn }).success).toBe(true);
  });

  it("recusa fim antes do início, apontando o campo", () => {
    const result = occasionSchema.safeParse({ ...valid, endsOn: "2027-04-30" });
    expect(result.error?.issues[0]?.path).toEqual(["endsOn"]);
  });

  it("limita o texto a 160 caracteres", () => {
    expect(occasionSchema.safeParse({ ...valid, text: "x".repeat(160) }).success).toBe(true);
    expect(occasionSchema.safeParse({ ...valid, text: "x".repeat(161) }).success).toBe(false);
  });

  it("converte para a API mantendo a ordem das peças", () => {
    expect(toOccasionInput(occasionSchema.parse(valid), ["b", "a"])).toMatchObject({ text: null, productIds: ["b", "a"] });
  });
});

describe("occasionStatus (RF-025 CA3)", () => {
  const period = { startsOn: "2027-05-01", endsOn: "2027-05-09", isActive: true };

  it.each([
    ["2027-04-30", "Agendada"],
    ["2027-05-01", "No ar"],
    ["2027-05-09", "No ar"],
    ["2027-05-10", "Encerrada"],
  ])("em %s fica %s", (today, status) => {
    expect(occasionStatus(period, today)).toBe(status);
  });

  it("desativada vale em qualquer data", () => {
    expect(occasionStatus({ ...period, isActive: false }, "2027-05-05")).toBe("Desativada");
  });
});

describe("todayInBrasilia", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    expect(todayInBrasilia(new Date("2026-11-01T02:30:00Z"))).toBe("2026-10-31");
    expect(todayInBrasilia(new Date("2026-11-01T03:30:00Z"))).toBe("2026-11-01");
  });
});

describe("formatIsoDate", () => {
  it("mostra no formato brasileiro", () => {
    expect(formatIsoDate("2027-05-09")).toBe("09/05/2027");
  });
});

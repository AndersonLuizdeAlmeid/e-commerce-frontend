import { describe, expect, it } from "vitest";
import { shippingSettingsSchema, toShippingSettingsInput } from "./validation";

const valid = {
  originPostalCode: "01310-100",
  handlingDays: "1",
  fallbackPacPrice: "25,00",
  fallbackSedexPrice: "45,50",
  boxWeightGrams: "100",
  boxHeightCm: "4",
  boxWidthCm: "12,5",
  boxLengthCm: "16",
};

describe("shippingSettingsSchema", () => {
  it("aceita a configuração e converte os números", () => {
    const values = shippingSettingsSchema.parse(valid);
    expect(toShippingSettingsInput(values)).toEqual({
      originPostalCode: "01310-100",
      handlingDays: 1,
      fallbackPacPrice: 25,
      fallbackSedexPrice: 45.5,
      boxWeightGrams: 100,
      boxHeightCm: 4,
      boxWidthCm: 12.5,
      boxLengthCm: 16,
    });
  });

  it("aceita contingência zero e caixa sem peso próprio", () => {
    const values = shippingSettingsSchema.parse({ ...valid, fallbackPacPrice: "0", fallbackSedexPrice: "0,00", boxWeightGrams: "0" });
    const input = toShippingSettingsInput(values);
    expect(input.fallbackPacPrice).toBe(0);
    expect(input.fallbackSedexPrice).toBe(0);
    expect(input.boxWeightGrams).toBe(0);
  });

  it.each([
    ["originPostalCode", "123"],
    ["originPostalCode", "abcde-fgh"],
    ["handlingDays", "31"],
    ["handlingDays", "-1"],
    ["handlingDays", "1,5"],
    ["fallbackPacPrice", ""],
    ["fallbackSedexPrice", "abc"],
    ["boxWeightGrams", "30001"],
    ["boxHeightCm", "0"],
    ["boxWidthCm", "201"],
    ["boxLengthCm", ""],
  ])("recusa %s = %j", (field, value) => {
    expect(shippingSettingsSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });
});

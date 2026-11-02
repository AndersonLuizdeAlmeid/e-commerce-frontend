import { describe, expect, it } from "vitest";
import { deliveryLabel, isCompletePostalCode, maskPostalCode } from "./api";

describe("maskPostalCode", () => {
  it.each([
    ["", ""],
    ["013", "013"],
    ["01310", "01310"],
    ["013101", "01310-1"],
    ["01310100", "01310-100"],
    ["01310-100", "01310-100"],
    ["013101009999", "01310-100"],
    ["01a31b0", "01310"],
  ])("%j vira %j", (value, expected) => {
    expect(maskPostalCode(value)).toBe(expected);
  });
});

describe("isCompletePostalCode", () => {
  it("exige os 8 números", () => {
    expect(isCompletePostalCode("01310-100")).toBe(true);
    expect(isCompletePostalCode("01310100")).toBe(true);
    expect(isCompletePostalCode("01310-10")).toBe(false);
    expect(isCompletePostalCode("")).toBe(false);
  });
});

describe("deliveryLabel", () => {
  it("escreve o prazo, e avisa quando não há", () => {
    expect(deliveryLabel(1)).toBe("1 dia útil");
    expect(deliveryLabel(6)).toBe("6 dias úteis");
    expect(deliveryLabel(null)).toBe("Prazo a confirmar");
  });
});

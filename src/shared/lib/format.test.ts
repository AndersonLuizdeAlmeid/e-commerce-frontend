import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formata em reais com vírgula decimal", () => {
    // Intl usa espaço não separável entre "R$" e o valor.
    expect(formatPrice(59.9).replace(/\s/g, " ")).toBe("R$ 59,90");
    expect(formatPrice(1299).replace(/\s/g, " ")).toBe("R$ 1.299,00");
  });
});

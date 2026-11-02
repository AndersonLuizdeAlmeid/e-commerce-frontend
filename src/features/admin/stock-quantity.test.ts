import { describe, expect, it } from "vitest";
import { parseMovementQuantity } from "./validation";

describe("parseMovementQuantity", () => {
  it("aceita números inteiros positivos em entrada e saída", () => {
    expect(parseMovementQuantity("In", "5")).toBe(5);
    expect(parseMovementQuantity("Out", " 12 ")).toBe(12);
  });

  it("recusa zero em entrada e saída", () => {
    expect(parseMovementQuantity("In", "0")).toBeNull();
    expect(parseMovementQuantity("Out", "0")).toBeNull();
  });

  it("aceita zero no ajuste: o total contado pode ser nenhum", () => {
    expect(parseMovementQuantity("Adjustment", "0")).toBe(0);
  });

  it.each(["", "abc", "-1", "1,5", "1.5", "1000001"])("recusa %j", (value) => {
    expect(parseMovementQuantity("In", value)).toBeNull();
    expect(parseMovementQuantity("Adjustment", value)).toBeNull();
  });
});

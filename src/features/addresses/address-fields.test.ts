import { describe, expect, it } from "vitest";
import { emptyAddressFields, formatAddressLine, formatAddressPlace, toAddressRequest, validateAddress } from "./address-fields";

const valid = {
  recipient: "Maria da Silva",
  postalCode: "01305-000",
  street: "Rua Augusta",
  number: "100",
  complement: "",
  district: "Consolação",
  city: "São Paulo",
  state: "SP",
};

describe("endereço (RF-007)", () => {
  it("aceita um endereço completo, com complemento vazio", () => {
    expect(validateAddress(valid)).toEqual({});
  });

  it("marca cada campo que falta", () => {
    expect(Object.keys(validateAddress(emptyAddressFields)).sort()).toEqual(
      ["city", "district", "number", "postalCode", "recipient", "state", "street"].sort(),
    );
  });

  it("recusa CEP incompleto e UF que não existe", () => {
    const errors = validateAddress({ ...valid, postalCode: "01305", state: "XX" });
    expect(errors.postalCode).toBeDefined();
    expect(errors.state).toBeDefined();
  });

  it("aceita S/N no número e UF em minúsculas", () => {
    expect(validateAddress({ ...valid, number: "S/N", state: "sp" })).toEqual({});
  });

  it("limpa o corpo enviado à API", () => {
    expect(toAddressRequest({ ...valid, recipient: "  Maria   da Silva ", state: " sp " }, true)).toEqual({
      recipient: "Maria da Silva",
      postalCode: "01305000",
      street: "Rua Augusta",
      number: "100",
      complement: null,
      district: "Consolação",
      city: "São Paulo",
      state: "SP",
      isDefault: true,
    });
  });

  it("formata o endereço em duas linhas", () => {
    expect(formatAddressLine({ ...valid, complement: "Apto 12" })).toBe("Rua Augusta, 100 · Apto 12");
    expect(formatAddressLine(valid)).toBe("Rua Augusta, 100");
    expect(formatAddressPlace({ ...valid, postalCode: "01305000" })).toBe("Consolação · São Paulo/SP · 01305-000");
  });
});

import { describe, expect, it } from "vitest";
import { buildStoreIdentity, formatCnpj, missingStoreIdentity } from "./store-identity";

describe("buildStoreIdentity", () => {
  it("lê os valores da configuração e mascara o CNPJ", () => {
    const identity = buildStoreIdentity({
      legalName: " MO Acessórios Ltda ",
      cnpj: "12345678000190",
      address: "Rua A, 1, Porto Alegre/RS",
      email: "contato@loja.com.br",
      phone: "(51) 99755-3649",
    });

    expect(identity).toEqual({
      legalName: "MO Acessórios Ltda",
      cnpj: "12.345.678/0001-90",
      address: "Rua A, 1, Porto Alegre/RS",
      email: "contato@loja.com.br",
      phone: "(51) 99755-3649",
    });
    expect(missingStoreIdentity(identity)).toEqual([]);
  });

  it("aponta o que falta, para a página avisar que é rascunho", () => {
    const identity = buildStoreIdentity({ legalName: "MO", cnpj: "  ", email: undefined });

    expect(identity.cnpj).toBeNull();
    expect(missingStoreIdentity(identity)).toEqual(["cnpj", "address", "email", "phone"]);
  });
});

describe("formatCnpj", () => {
  it("aceita com ou sem máscara", () => {
    expect(formatCnpj("12.345.678/0001-90")).toBe("12.345.678/0001-90");
    expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90");
  });

  it("não inventa máscara para outro tamanho", () => {
    expect(formatCnpj("123")).toBe("123");
  });
});

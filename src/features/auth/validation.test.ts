import { describe, expect, it } from "vitest";
import { safeNextPath, validateCpf, validateEmail, validateFullName, validatePassword, validatePhone } from "./validation";

describe("validação dos formulários de conta", () => {
  it("exige senha forte como a API (RF-001 CA3)", () => {
    expect(validatePassword("Senha@123")).toBeNull();
    expect(validatePassword("curta1A")).toMatch(/entre 8 e 128/);
    expect(validatePassword("semnumeroA")).toMatch(/maiúscula, letra minúscula e número/);
    expect(validatePassword("SEMMINUSCULA1")).not.toBeNull();
  });

  it("valida CPF pelos dígitos verificadores e aceita vazio", () => {
    expect(validateCpf("529.982.247-25")).toBeNull();
    expect(validateCpf("")).toBeNull();
    expect(validateCpf("529.982.247-26")).toBe("CPF inválido.");
    expect(validateCpf("111.111.111-11")).toBe("CPF inválido.");
  });

  it("aceita celular e fixo com DDD", () => {
    expect(validatePhone("(11) 98765-4321")).toBeNull();
    expect(validatePhone("+55 21 3333-4444")).toBeNull();
    expect(validatePhone("98765-4321")).not.toBeNull();
    expect(validatePhone("(11) 88765-43210")).not.toBeNull();
  });

  it("valida e-mail e nome", () => {
    expect(validateEmail(" maria@loja.com ")).toBeNull();
    expect(validateEmail("maria@loja")).not.toBeNull();
    expect(validateFullName("  Maria   Silva ")).toBeNull();
    expect(validateFullName("Al")).not.toBeNull();
  });

  it("só redireciona para caminhos internos depois do login", () => {
    expect(safeNextPath("/conta")).toBe("/conta");
    expect(safeNextPath("/produto/camiseta?cor=azul")).toBe("/produto/camiseta?cor=azul");
    expect(safeNextPath("//site-malicioso.com")).toBe("/conta");
    expect(safeNextPath("https://site-malicioso.com")).toBe("/conta");
    expect(safeNextPath("/\\site-malicioso.com")).toBe("/conta");
    expect(safeNextPath(null)).toBe("/conta");
  });
});

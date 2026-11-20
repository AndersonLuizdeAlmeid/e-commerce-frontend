import { describe, expect, it } from "vitest";
import { safeNextPath, validateCpf, validateEmail, validateFullName, validatePassword, validatePhone } from "./validation";

describe("validação dos formulários de conta", () => {
  it("pede 12 caracteres e recusa senha comum, sem regra de composição, como a API (entrega 6, S4)", () => {
    expect(validatePassword("minha joia preferida da loja")).toBeNull();
    expect(validatePassword("anéis de prata no domingo")).toBeNull();
    expect(validatePassword("Joia-Preferida-123")).toBeNull();
    expect(validatePassword("Senha@12345")).toMatch(/pelo menos 12/);
    for (const common of ["senha12345678", "Password@2026", "123456789012", "qwertyuiopas", "aaaaaaaaaaaa", "Minha-Senha-2026!"]) {
      expect(validatePassword(common)).toMatch(/muito comum/);
    }
    expect(validatePassword("a".repeat(60) + "b".repeat(60) + "c".repeat(9))).toMatch(/no máximo 128/);
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

  it("não deixa tab nem quebra de linha virarem outro site (o navegador apaga esses caracteres)", () => {
    expect(safeNextPath("/\t/site-malicioso.com")).toBe("/conta");
    expect(safeNextPath("/\n/site-malicioso.com")).toBe("/conta");
    expect(safeNextPath("/\r\n\\site-malicioso.com")).toBe("/conta");
    expect(safeNextPath("/%2F/site-malicioso.com")).toBe("/%2F/site-malicioso.com");
    expect(safeNextPath("/conta/pedidos#topo")).toBe("/conta/pedidos#topo");
  });
});

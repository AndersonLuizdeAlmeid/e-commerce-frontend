import { describe, expect, it } from "vitest";
import { DELETION_KEEPS, DELETION_REMOVES, deletionProblem, exportFileName } from "./privacy";

describe("exportFileName", () => {
  it("usa o dia de Brasília, não o de Greenwich", () => {
    // 01:30 em UTC ainda é dia 19 em São Paulo.
    expect(exportFileName(new Date("2026-11-20T01:30:00Z"))).toBe("mo-meus-dados-2026-11-19.json");
    expect(exportFileName(new Date("2026-11-20T15:00:00Z"))).toBe("mo-meus-dados-2026-11-20.json");
  });
});

describe("deletionProblem", () => {
  it("pede a senha primeiro", () => {
    expect(deletionProblem("", true)?.field).toBe("password");
  });

  it("pede a confirmação de que não tem volta", () => {
    expect(deletionProblem("Senha@123", false)?.field).toBe("understood");
  });

  it("libera com senha e confirmação", () => {
    expect(deletionProblem("Senha@123", true)).toBeNull();
  });
});

describe("textos da exclusão", () => {
  it("diz que os pedidos ficam sem dado pessoal", () => {
    expect(DELETION_REMOVES.join(" ")).toMatch(/CPF/);
    expect(DELETION_KEEPS.join(" ")).toMatch(/obrigação fiscal/);
  });
});

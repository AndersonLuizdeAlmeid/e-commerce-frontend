import { describe, expect, it } from "vitest";
import { aroDoDiametro, aroDoNome, centimetrosDoNome, diametroDoAro, tipoDeMedida } from "./medidas";

describe("aro brasileiro (circunferência interna em mm menos 40)", () => {
  it("converte diâmetro interno em aro", () => {
    expect(aroDoDiametro(16.55)).toBe(12);
    expect(aroDoDiametro(17.83)).toBe(16);
    expect(aroDoDiametro(19.1)).toBe(20);
    expect(aroDoDiametro(21.01)).toBe(26);
  });

  it("ida e volta: o diâmetro de um aro devolve o mesmo aro", () => {
    for (let aro = 8; aro <= 35; aro++) {
      expect(aroDoDiametro(diametroDoAro(aro))).toBe(aro);
    }
  });

  it("só lê como aro um nome de tamanho que é um número de aro", () => {
    expect(aroDoNome("16")).toBe(16);
    expect(aroDoNome(" 22 ")).toBe(22);
    expect(aroDoNome("40 cm")).toBeNull();
    expect(aroDoNome("M")).toBeNull();
    expect(aroDoNome("60")).toBeNull();
  });
});

describe("rótulos e comprimentos", () => {
  it("reconhece a medida pelo rótulo da categoria", () => {
    expect(tipoDeMedida("Aro")).toBe("aro");
    expect(tipoDeMedida("comprimento")).toBe("comprimento");
    expect(tipoDeMedida("Tamanho")).toBe("outra");
  });

  it("lê o comprimento em centímetros", () => {
    expect(centimetrosDoNome("45 cm")).toBe(45);
    expect(centimetrosDoNome("60cm")).toBe(60);
    expect(centimetrosDoNome("18")).toBeNull();
  });
});

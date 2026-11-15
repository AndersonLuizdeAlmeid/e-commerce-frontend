import { describe, expect, it } from "vitest";
import { addressLines, isoDay, normalizeTrackingCode, orderQuery, periodRange, primaryAction, variantLabel } from "./backoffice";

describe("normalizeTrackingCode", () => {
  it("aceita o formato dos Correios e o de outras transportadoras, em maiúsculas", () => {
    expect(normalizeTrackingCode(" aa123456789br ")).toEqual({ code: "AA123456789BR" });
    expect(normalizeTrackingCode("12345678901234")).toEqual({ code: "12345678901234" });
  });

  it("recusa vazio, curto, com espaço ou hífen", () => {
    expect(normalizeTrackingCode("")).toEqual({ error: "Cole o código de rastreio." });
    for (const value of ["1234567", "AA 123456789 BR", "AA123-456BR", "A".repeat(41)]) {
      expect(normalizeTrackingCode(value)).toHaveProperty("error");
    }
  });
});

describe("primaryAction", () => {
  it("destaca o próximo passo do pedido", () => {
    expect(primaryAction({ allowedActions: ["StartPreparation", "Cancel"] })).toBe("StartPreparation");
    expect(primaryAction({ allowedActions: ["Ship", "Cancel", "CorrectGiftMessage"] })).toBe("Ship");
    expect(primaryAction({ allowedActions: ["Deliver", "UpdateTracking"] })).toBe("Deliver");
  });

  it("não destaca exceções como ação principal", () => {
    expect(primaryAction({ allowedActions: ["ConfirmPayment", "Cancel"] })).toBeNull();
    expect(primaryAction({ allowedActions: [] })).toBeNull();
  });
});

describe("periodRange", () => {
  // 15/11/2026 às 01:30 em Brasília ainda é 15/11; em UTC já seria 15/11 04:30.
  const now = new Date("2026-11-15T04:30:00Z");

  it("conta o dia de hoje em Brasília", () => {
    expect(isoDay(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
    expect(periodRange("today", now)).toEqual({ from: "2026-11-15", to: "2026-11-15" });
  });

  it("inclui hoje nos atalhos de dias e começa o mês no dia 1", () => {
    expect(periodRange("7d", now)).toEqual({ from: "2026-11-09", to: "2026-11-15" });
    expect(periodRange("30d", now)).toEqual({ from: "2026-10-17", to: "2026-11-15" });
    expect(periodRange("month", now)).toEqual({ from: "2026-11-01", to: "2026-11-15" });
  });
});

describe("orderQuery", () => {
  it("só manda o que foi filtrado", () => {
    expect(orderQuery({ page: 1, status: null, search: "  ", from: null, to: null, paymentMethod: null, gift: false })).toBe("page=1");
    expect(
      orderQuery({ page: 2, status: "Preparing", search: " PED-12 ", from: "2026-11-01", to: "2026-11-15", paymentMethod: "Pix", gift: true }),
    ).toBe("page=2&status=Preparing&search=PED-12&from=2026-11-01&to=2026-11-15&paymentMethod=Pix&gift=true");
  });
});

describe("rótulos", () => {
  it("monta a variação e o endereço como na etiqueta", () => {
    expect(variantLabel({ colorName: "Dourado", sizeName: "16" })).toBe("Dourado · 16");
    expect(variantLabel({ colorName: null, sizeName: null })).toBe("Variação única");
    expect(
      addressLines({
        recipient: "Maria",
        postalCode: "20040020",
        street: "Rua da Assembleia",
        number: "10",
        complement: "sala 2",
        district: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
      }),
    ).toEqual(["Maria", "Rua da Assembleia, 10 — sala 2", "Centro — Rio de Janeiro/RJ", "CEP 20040-020"]);
  });
});

import { describe, expect, it } from "vitest";
import { cancellationLabel, giftMessageProblem, orderStatusLabel, paymentCountdown } from "./gift";

describe("dedicatória (RF-047 CA1)", () => {
  it("aceita até 200 caracteres e 6 linhas", () => {
    expect(giftMessageProblem("a".repeat(200))).toBeNull();
    expect(giftMessageProblem("1\n2\n3\n4\n5\n6")).toBeNull();
    expect(giftMessageProblem("")).toBeNull();
  });

  it("recusa texto longo ou com linhas demais, contando \\r\\n como uma quebra", () => {
    expect(giftMessageProblem("a".repeat(201))).toMatch(/200 caracteres/);
    expect(giftMessageProblem("1\r\n2\n3\n4\n5\n6\n7")).toMatch(/6 linhas/);
  });
});

describe("situação do pedido (arquivo 26 §4.7)", () => {
  const now = new Date("2026-11-08T12:00:00Z");

  it("conta as horas que faltam para pagar", () => {
    expect(paymentCountdown("2026-11-09T19:30:00Z", now)).toBe("31 h restantes");
    expect(paymentCountdown("2026-11-08T13:10:00Z", now)).toBe("1 h restante");
    expect(paymentCountdown("2026-11-08T12:20:00Z", now)).toBe("20 min restantes");
    expect(paymentCountdown("2026-11-08T11:00:00Z", now)).toBe("prazo encerrado");
  });

  it("traduz status e motivo de cancelamento", () => {
    expect(orderStatusLabel("PendingPayment")).toBe("Aguardando pagamento");
    expect(cancellationLabel("PaymentTimeout")).toMatch(/48 horas/);
    expect(cancellationLabel(null)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { cardRejectionMessage } from "./card-messages";

describe("recusa do cartão (RF-044 CA3)", () => {
  it("explica os motivos conhecidos", () => {
    expect(cardRejectionMessage("cc_rejected_insufficient_amount")).toMatch(/limite/);
    expect(cardRejectionMessage("cc_rejected_bad_filled_security_code")).toMatch(/CVV/);
  });

  it("usa a mensagem geral para o que não conhece, sem mostrar o código", () => {
    expect(cardRejectionMessage("cc_rejected_novo_motivo")).toMatch(/não foi aprovado/);
    expect(cardRejectionMessage(null)).not.toMatch(/cc_/);
  });
});

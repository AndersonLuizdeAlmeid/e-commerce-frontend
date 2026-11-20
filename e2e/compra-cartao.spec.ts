import { confirmedCustomer } from "./support/api";
import { uniqueEmail } from "./support/env";
import { expect, expectAccessible, test } from "./support/fixtures";
import { addPieceToBag, checkout, login } from "./support/ui";

// Fluxo 2 (entrega 6 §4.6): cliente com conta entra, compra e paga com o cartão da plataforma falsa.
test("cliente com conta paga com cartão e o pedido fica pago na hora", async ({ page }) => {
  const email = uniqueEmail("cartao");
  await confirmedCustomer(email);

  await page.goto("/login");
  await expectAccessible(page, "login");
  await login(page, email);
  await addPieceToBag(page);
  await checkout(page);

  await page.getByRole("tab", { name: "Cartão de crédito" }).click();
  await expectAccessible(page, "pagamento com cartão");
  await page.getByRole("button", { name: "Pagar com cartão aprovado" }).click();

  await expect(page.getByText("Pagamento confirmado").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Pagar com PIX" })).toHaveCount(0);
});

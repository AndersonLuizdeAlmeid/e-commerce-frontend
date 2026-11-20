import { confirmedCustomer, waitForEmail } from "./support/api";
import { uniqueEmail } from "./support/env";
import { expect, expectAccessible, test } from "./support/fixtures";
import { addPieceToBag, checkout, login } from "./support/ui";

// Fluxo 3 (entrega 6 §4.6): a cliente desiste de um pedido que ainda aguarda pagamento.
test("cliente cancela o pedido aguardando pagamento e recebe o aviso", async ({ page }) => {
  const email = uniqueEmail("cancela");
  await confirmedCustomer(email);
  await login(page, email);
  await addPieceToBag(page);
  const orderId = await checkout(page);

  await page.getByRole("button", { name: "Cancelar pedido" }).click();
  await expectAccessible(page, "confirmação do cancelamento");
  await page.getByRole("button", { name: "Sim, cancelar" }).click();

  await expect(page.getByText("Pedido cancelado. As peças voltaram para a loja.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pagar com PIX" })).toHaveCount(0);
  const mail = await waitForEmail(email, "cancelado");
  expect(mail.text).toContain("a seu pedido");

  await page.goto("/conta/pedidos");
  await expectAccessible(page, "meus pedidos");
  await expect(page.locator(`a[href="/conta/pedidos/${orderId}"]`).first()).toContainText("Cancelado");
});

import { paidOrder, waitForEmail } from "./support/api";
import { ADMIN, uniqueEmail } from "./support/env";
import { expect, expectAccessible, test } from "./support/fixtures";
import { login } from "./support/ui";

// Fluxo 4 (entrega 6 §4.6): o pedido pago passa pelo painel até a devolução, com os e-mails da cliente.
test("painel separa, envia, entrega e registra a devolução com estorno", async ({ page }) => {
  const email = uniqueEmail("painel");
  const { orderId, number } = await paidOrder(email);

  await login(page, ADMIN.email, ADMIN.password, `/admin/pedidos/${orderId}`);
  await expect(page.getByRole("heading", { level: 1, name: number })).toBeVisible();
  await expectAccessible(page, "painel: pedido pago");

  await page.getByRole("button", { name: "Começar a separar" }).click();
  await expect(page.getByText("Separação começou.")).toBeVisible();

  await page.getByLabel("Código de rastreio").fill("aa123456789br");
  await expectAccessible(page, "painel: envio");
  await page.getByRole("button", { name: "Marcar como enviado" }).click();
  await expect(page.getByText("AA123456789BR").first()).toBeVisible();
  await waitForEmail(email, "foi enviado");

  await page.getByRole("button", { name: "Marcar como entregue" }).click();
  await expect(page.getByText("Pedido entregue. A cliente recebeu o aviso.")).toBeVisible();
  await waitForEmail(email, "entregue");

  await page.getByRole("button", { name: "Registrar devolução" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectAccessible(page, "painel: devolução");
  await dialog.getByLabel("Motivo").fill("Arrependimento em 3 dias, peça conferida sem uso");
  await dialog.getByRole("button", { name: "Registrar devolução" }).click();

  await expect(page.getByText("Devolução registrada. O estorno foi pedido ao Mercado Pago.")).toBeVisible();
  await expect(page.getByText("Devolvido").first()).toBeVisible();
  await waitForEmail(email, "Estorno do pedido");
});

import { confirmationLink } from "./support/api";
import { CUSTOMER_PASSWORD, uniqueEmail } from "./support/env";
import { expect, expectAccessible, test } from "./support/fixtures";
import { addPieceToBag, checkout } from "./support/ui";

// Fluxo 1 (entrega 6 §4.6): cadastro → confirmação pelo Mailpit → sacola → checkout PIX → pagamento simulado → pago.
test("cliente nova se cadastra, confirma o e-mail e paga com PIX", async ({ page }) => {
  const email = uniqueEmail("pix");

  await page.goto("/cadastro");
  await expectAccessible(page, "cadastro");
  await page.getByLabel("Nome completo").fill("Ana E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Celular").fill("(11) 98765-4321");
  await page.getByLabel("Senha", { exact: true }).fill(CUSTOMER_PASSWORD);
  await page.getByLabel("Confirme a senha").fill(CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/conta/);
  await expect(page.getByText("Conta criada!")).toBeVisible();
  await expectAccessible(page, "minha conta");

  // O link do e-mail pede um clique (um leitor de e-mail que abre links sozinho não confirma a conta).
  await page.goto(await confirmationLink(email));
  await expectAccessible(page, "confirmação de e-mail");
  await page.getByRole("button", { name: "Confirmar meu e-mail" }).click();
  await expect(page.getByText("E-mail confirmado. Agora você pode finalizar compras.")).toBeVisible();

  await addPieceToBag(page);
  await checkout(page);
  await expectAccessible(page, "pedido feito");

  await page.getByRole("button", { name: "Pagar com PIX" }).click();
  await expect(page.getByText("Esperando o pagamento…")).toBeVisible();
  await expectAccessible(page, "pagamento PIX");
  await page.getByRole("button", { name: /Simular pagamento aprovado/ }).click();

  await expect(page.getByText("Pagamento confirmado").first()).toBeVisible({ timeout: 30_000 });
});

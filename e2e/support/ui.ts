import type { Page } from "@playwright/test";
import { CUSTOMER_PASSWORD, PIECE } from "./env";
import { expect, expectAccessible } from "./fixtures";

// Passos de tela que mais de um fluxo repete. Cada um confere a acessibilidade da página por onde passa.

export async function login(page: Page, email: string, password = CUSTOMER_PASSWORD, next?: string): Promise<void> {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Abre a peça dos fluxos e põe uma unidade na sacola. */
export async function addPieceToBag(page: Page): Promise<void> {
  await page.goto(`/produto/${PIECE.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: PIECE.name })).toBeVisible();
  await expectAccessible(page, "página do produto");
  await page.getByRole("button", { name: "Adicionar à sacola" }).click();
  await expect(page.getByRole("link", { name: /sacola/i }).first()).toContainText(/1/);
}

/** Endereço de entrega, quando o checkout pede (cliente sem endereço guardado). */
export async function fillAddress(page: Page): Promise<void> {
  await page.getByLabel("Quem vai receber").fill("Cliente E2E");
  await page.getByLabel("CEP").fill("20040-020");
  await page.getByLabel("Rua").fill("Rua da Assembleia");
  await page.getByLabel("Número").fill("10");
  await page.getByLabel("Bairro").fill("Centro");
  await page.getByLabel("Cidade").fill("Rio de Janeiro");
  await page.getByLabel("UF").selectOption("RJ");
}

/** Da sacola até o pedido feito, com PAC. Devolve o id do pedido (a tela vai para /conta/pedidos/{id}). */
export async function checkout(page: Page): Promise<string> {
  await page.goto("/carrinho");
  await expectAccessible(page, "sacola");
  await page.getByRole("button", { name: "Finalizar compra" }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole("heading", { name: "Finalizar compra" })).toBeVisible();

  // Sem endereço guardado, o checkout abre o formulário e vai sozinho para o envio; com endereço, pede "Continuar".
  const newAddress = page.getByRole("button", { name: "Usar este endereço" });
  const savedAddress = page.getByRole("button", { name: "Entregar em outro endereço" });
  await expect(newAddress.or(savedAddress)).toBeVisible();
  await expectAccessible(page, "checkout: endereço");
  if (await newAddress.isVisible()) {
    await fillAddress(page);
    await newAddress.click();
  } else {
    await page.getByRole("button", { name: "Continuar" }).click();
  }

  await expect(page.getByRole("radio", { name: /PAC/ })).toBeVisible();
  await page.getByRole("radio", { name: /PAC/ }).check();
  await expectAccessible(page, "checkout: envio");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expectAccessible(page, "checkout: revisão");
  await page.getByRole("button", { name: /^Fazer pedido/ }).click();
  await expect(page).toHaveURL(/\/conta\/pedidos\/[0-9a-f-]{36}/);
  return page.url().match(/pedidos\/([0-9a-f-]{36})/)![1]!;
}

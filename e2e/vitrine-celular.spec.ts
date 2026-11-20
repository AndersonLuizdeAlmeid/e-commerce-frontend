import type { Page } from "@playwright/test";
import { PIECE } from "./support/env";
import { expect, expectAccessible, test } from "./support/fixtures";

// Fluxo 5 (entrega 6 §4.6): busca → categoria → produto → sacola numa tela de 375 px, sem rolagem lateral.
test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

async function expectNoSideScroll(page: Page, label: string): Promise<void> {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scrollWidth, `Rolagem lateral em ${label}`).toBeLessThanOrEqual(innerWidth);
}

test("no celular, a cliente busca, navega pela categoria e põe a peça na sacola", async ({ page }) => {
  await page.goto("/");
  await expectAccessible(page, "home");
  await expectNoSideScroll(page, "home");

  await page.getByRole("link", { name: "Buscar peças" }).click();
  await expect(page).toHaveURL(/\/busca/);
  await page.getByRole("searchbox", { name: "Buscar peças" }).last().fill("brinco");
  await page.getByRole("searchbox", { name: "Buscar peças" }).last().press("Enter");
  await expect(page).toHaveURL(/q=brinco/);
  await expect(page.getByRole("link", { name: new RegExp(PIECE.name) }).first()).toBeVisible();
  await expectAccessible(page, "busca");
  await expectNoSideScroll(page, "busca");

  await page.getByRole("navigation", { name: "Coleções e categorias" }).getByRole("link", { name: "Brincos" }).click();
  await expect(page).toHaveURL(/\/categoria\/brincos/);
  await expectAccessible(page, "categoria");
  await expectNoSideScroll(page, "categoria");

  await page.getByRole("link", { name: new RegExp(PIECE.name) }).first().click();
  await expect(page).toHaveURL(new RegExp(`/produto/${PIECE.slug}`));
  await expect(page.getByRole("heading", { level: 1, name: PIECE.name })).toBeVisible();
  await expectAccessible(page, "produto");
  await expectNoSideScroll(page, "produto");

  // No celular o botão também fica fixo no rodapé da tela; vale o que estiver visível.
  await page.getByRole("button", { name: "Adicionar à sacola" }).filter({ visible: true }).first().click();
  await expect(page.getByRole("link", { name: /sacola/i }).first()).toContainText(/1/);
  await page.goto("/carrinho");
  await expect(page.getByText(PIECE.name).first()).toBeVisible();
  await expectAccessible(page, "sacola");
  await expectNoSideScroll(page, "sacola");
});

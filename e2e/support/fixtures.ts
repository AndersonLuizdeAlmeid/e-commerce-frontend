import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

/**
 * Checagem de acessibilidade em cada página visitada (entrega 6 §4.6): falha em violação séria ou crítica do axe,
 * nas regras WCAG 2.1 A e AA. As menores ficam no relatório, sem bloquear.
 */
export async function expectAccessible(page: Page, label = page.url()): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  const summary = blocking.map((violation) => `${violation.impact} ${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(" ")).slice(0, 5).join("\n  ")}`);
  expect(summary, `Violações de acessibilidade em ${label}`).toEqual([]);
}

/** O mesmo `test` do Playwright, sem nada a mais por enquanto: ponto único para fixtures futuras. */
export const test = base;
export { expect };

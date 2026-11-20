import { defineConfig, devices } from "@playwright/test";

// E2E dos fluxos críticos (entrega 6 do backend, fatia 6.4). A pilha sobe com `npm run e2e:stack`; a loja é o build
// de produção feito por `npm run e2e:build`, servido aqui na porta 3100. Ver e2e/README.md.
const STORE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  // Um fluxo de cada vez: todos compram do mesmo estoque e o painel mexe nos mesmos pedidos.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/support/global-setup.ts",
  use: {
    baseURL: STORE_URL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- -p 3100",
    url: STORE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      API_INTERNAL_URL: process.env.E2E_API_URL ?? "http://localhost:5101",
      API_INTERNAL_KEY: "dev-internal-key",
      REVALIDATE_SECRET: "dev-revalidate-secret",
    },
  },
});

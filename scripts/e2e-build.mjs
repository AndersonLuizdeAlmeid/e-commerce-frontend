// Build de produção da loja apontando para a pilha de E2E (e2e/compose.yml): API na 5101, loja na 3100.
// Em script, e não na linha do npm, para funcionar igual no Windows e no CI.
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  API_INTERNAL_URL: process.env.E2E_API_URL ?? "http://localhost:5101",
  NEXT_PUBLIC_API_URL: process.env.E2E_API_URL ?? "http://localhost:5101",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
  API_INTERNAL_KEY: "dev-internal-key",
  REVALIDATE_SECRET: "dev-revalidate-secret",
};

const result = spawnSync("npx", ["next", "build"], { stdio: "inherit", env, shell: process.platform === "win32" });
process.exit(result.status ?? 1);

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/shared/api/schema.d.ts"]),
  {
    // zod sem JIT, que a CSP da loja não deixa usar (entrega 6 §3, P5): sempre pelo módulo que liga o jitless.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/lib/zod.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "zod", message: "Importe de @/shared/lib/zod (zod sem JIT, por causa da CSP)." }] }],
    },
  },
]);

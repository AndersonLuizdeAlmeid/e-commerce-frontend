import { adminToken, api, pieceVariantId } from "./api";

/**
 * Antes de tudo: a pilha responde e a peça dos fluxos tem estoque de sobra. Cada fluxo compra uma unidade; repor aqui
 * deixa a suíte rodar quantas vezes for preciso no mesmo banco.
 */
export default async function globalSetup(): Promise<void> {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      await api("GET", "/health/ready");
      break;
    } catch (error) {
      if (Date.now() > deadline) {
        throw new Error(`A API de E2E não respondeu em 2 min. Suba a pilha com "npm run e2e:stack". (${String(error)})`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const token = await adminToken();
  await api("POST", `/api/v1/admin/stock/${await pieceVariantId()}/movements`, {
    token,
    body: { type: "In", quantity: 20, reason: "Reposição dos testes de ponta a ponta" },
  });
}

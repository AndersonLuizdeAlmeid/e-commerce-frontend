import { z } from "zod";

/**
 * zod sem JIT (entrega 6 §3, P5). O zod 4 testa `Function("")` para compilar os validadores; a CSP da loja não libera
 * `eval`, então o teste só gerava violação a cada carregamento do painel, sem ganho: os formulários são pequenos.
 * Importe o `z` daqui, nunca direto de "zod".
 */
z.config({ jitless: true });

export { z };

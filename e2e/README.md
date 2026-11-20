# Testes de ponta a ponta (Playwright + axe)

Os cinco fluxos críticos da entrega 6.4 do backend (`specs/entregas/fase-6-endurecimento-e-lancamento.md` §4.6), contra a API real em container e o build de produção da loja. Em cada página visitada, o axe roda e o teste falha em violação **séria ou crítica** (WCAG 2.1 A e AA).

| Arquivo | Fluxo |
|---------|-------|
| `compra-pix.spec.ts` | cadastro → confirmação pelo link do Mailpit → sacola → checkout → PIX → pagamento simulado → pago |
| `compra-cartao.spec.ts` | login → sacola → checkout → cartão de teste aprovado → pago |
| `cancelamento.spec.ts` | pedido aguardando pagamento → cliente cancela → e-mail EM-10 → "Cancelado" em Meus pedidos |
| `painel.spec.ts` | pedido pago → separar → enviar com rastreio → entregar → registrar devolução, com os e-mails EM-08, EM-09 e EM-13 |
| `vitrine-celular.spec.ts` | 375 px: home → busca → categoria → produto → sacola, sem rolagem lateral |

## Rodar no computador

Docker ligado e o repositório do backend ao lado deste (`../e-commerce-backend`).

```powershell
npm run e2e:images
npm run e2e:stack
npm run e2e:build
npm run e2e
```

- `e2e:images` gera as imagens da API e do migrator a partir do backend local (`mo-e2e-api:local` e `mo-e2e-migrator:local`). Para testar outra versão, defina `E2E_API_IMAGE` e `E2E_MIGRATOR_IMAGE`.
- `e2e:stack` sobe Postgres (sem volume, sempre do zero e com o seed de desenvolvimento), Mailpit em http://localhost:8125 e a API em http://localhost:5101, com pagamento e frete falsos.
- `e2e:build` faz o build de produção da loja apontando para essa API. Ele usa a mesma pasta `.next` do `npm run build`: depois dos E2E, refaça o build normal antes de rodar a loja na porta 3000.
- `e2e` serve a loja na porta 3100 e roda os fluxos um de cada vez. O relatório fica em `playwright-report/`, e o trace de quem falhou em `test-results/`.
- `e2e:down` derruba a pilha.

Os testes repõem 20 unidades da peça usada (`brinco-gota-cristal`) no início e criam clientes com e-mail único. Por isso a suíte roda quantas vezes for preciso no mesmo banco.

## No CI

O job `e2e` da loja sobe a mesma pilha com as imagens da tag `main` do backend, que o CI do backend publica a cada push na `main`. Para fixar outra versão, use as variáveis do repositório `E2E_API_IMAGE` e `E2E_MIGRATOR_IMAGE`. A imagem da loja só é publicada com o E2E verde. O pagamento no sandbox do Mercado Pago não entra aqui (instável e externo): ele fica no roteiro manual da homologação (6.7).

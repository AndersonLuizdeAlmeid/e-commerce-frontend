# e-commerce-frontend

Loja em **Next.js (App Router) + TypeScript + Tailwind**, com renderização no servidor por causa de SEO.
As especificações ficam no repositório `e-commerce-backend`, em `specs/` (principalmente os arquivos 16 e 24).

## Rodando localmente

Pré-requisito: a API rodando em `http://localhost:5001` (veja o README do backend).

```bash
cp .env.example .env.local
npm install
npm run dev
```

A loja abre em http://localhost:3000.

## Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (pré-renderiza a home, então precisa da API) |
| `npm run lint` / `typecheck` / `test` | ESLint, `tsc --noEmit`, Vitest |
| `npm run gen:api` | Regera `src/shared/api/schema.d.ts` a partir do OpenAPI da API local |

## Páginas

| Rota | Renderização | Observações |
|------|--------------|-------------|
| `/` | ISR (5 min) | peça em destaque, novidades, categorias, ocasião e coleções |
| `/categoria/[slug]` | SSR com dados em cache | filtros `?cor=&tamanho=&preco_min=&preco_max=&ordem=` e `?pagina=N`; com filtros vira `noindex,follow` |
| `/colecao/[slug]` | SSR com dados em cache | os mesmos filtros, mais `?categoria=`; slug antigo redireciona; coleção com tema grafite pinta as cartelas |
| `/produto/[slug]` | ISR (10 min) | galeria por cor, seletor de cor/tamanho (`?cor=&tamanho=`), JSON-LD; slug antigo e produto inativo redirecionam |
| `/busca?q=` | SSR | `noindex` |
| `/sitemap.xml`, `/robots.txt` | revalida 1 h | gerados a partir da API |
| `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/confirmar-email` | estáticas + navegador | `noindex`; chamam a API pelo navegador |
| `/conta` | navegador | dados, confirmação de e-mail, troca de senha, sair |
| `/admin/...` | navegador | painel: produtos, grade e fotos, coleções, vitrine, categorias, acabamentos e tamanhos; `noindex`, exige perfil Admin na API |
| `/api/revalidate` | servidor | a API chama pelo Outbox depois de cada escrita do admin; exige `REVALIDATE_SECRET` |

Sessão (specs/16 §5): access token só em memória, refresh token em cookie HttpOnly da API, refresh silencioso ao abrir a página quando já houve login neste navegador. Em dev, os e-mails aparecem no Mailpit (http://localhost:8025).

As fotos dos dados de exemplo vêm de `placehold.co`, e as enviadas pelo painel, de `NEXT_PUBLIC_IMAGES_URL` (RustFS em dev; R2 em produção). Os dois domínios estão liberados em `next.config.ts`, e essa variável é lida no build.

## CI

`lint`, `typecheck`, `test`, `build` e **Lighthouse CI** (`lighthouserc.json`: home, categoria e produto) rodam contra `scripts/ci-api-stub.mjs`, uma API falsa com um produto. Para reproduzir o build localmente sem a API real:

```bash
node scripts/ci-api-stub.mjs
```

Em outro terminal, com `API_INTERNAL_URL=http://localhost:5099`, rode `npm run build`.

## Estrutura

```
src/
├── app/            rotas (páginas públicas em (loja)/, renderizadas no servidor), sitemap.ts, robots.ts
├── features/
│   └── catalog/    chamadas da API, grade de variações, JSON-LD, parâmetros de listagem, componentes
└── shared/
    ├── api/        cliente HTTP e tipos gerados do OpenAPI
    ├── lib/        URL do site, formatação
    └── ui/         componentes genéricos (busca, JSON-LD)
```

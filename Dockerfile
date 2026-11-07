# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# O Next.js grava as NEXT_PUBLIC_* no JavaScript durante o build, então elas definem o ambiente da imagem.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGES_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG IMAGES_ALLOW_LOCAL_IP
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O build pré-renderiza a home e o sitemap, e a API do ambiente não existe aqui: usa a API falsa do CI e descarta
# essas páginas depois, para que sejam geradas com dados reais no primeiro acesso.
RUN (node scripts/ci-api-stub.mjs &) \
 && API_INTERNAL_URL=http://localhost:5099 npm run build \
 && node scripts/drop-api-prerenders.mjs

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# O servidor só precisa do node: npm e corepack saem da imagem, e com eles as vulnerabilidades das dependências deles.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]

// API falsa mínima para o CI: o `next build` pré-renderiza home e sitemap, e o Lighthouse CI navega por
// home, categoria e produto. Os testes contra a API real ficam no E2E (Playwright), quando ele entrar.
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 5099);

const image = (text, hex) => `https://placehold.co/800x1000/${hex}/ffffff/png?text=${text}`;

const colors = [
  { id: "00000000-0000-7000-8001-000000000001", name: "Preto", slug: "preto", hex: "#151515" },
  { id: "00000000-0000-7000-8001-000000000004", name: "Azul Marinho", slug: "azul-marinho", hex: "#1B2A4A" },
];
const sizes = [
  { id: "00000000-0000-7000-8002-000000000002", name: "P" },
  { id: "00000000-0000-7000-8002-000000000003", name: "M" },
];

const categories = [{ id: "00000000-0000-7000-8000-000000000001", name: "Camisetas", slug: "camisetas" }];

const category = {
  ...categories[0],
  description: "Camisetas de algodão em várias cores e tamanhos.",
  seo: { title: "Camisetas de Algodão", description: "Camisetas básicas e estampadas em algodão." },
};

const summary = {
  id: "00000000-0000-7000-8003-000000000001",
  slug: "camiseta-basica",
  name: "Camiseta Básica",
  categorySlug: "camisetas",
  priceFrom: 59.9,
  colors,
  image: { url: image("camiseta-basica", "151515"), alt: "Camiseta básica preta, frente", colorId: colors[0].id },
};

const product = {
  id: summary.id,
  slug: summary.slug,
  name: summary.name,
  description: "Camiseta de algodão penteado, gola careca e modelagem reta.",
  category: { slug: "camisetas", name: "Camisetas" },
  priceFrom: 59.9,
  seo: { title: "Camiseta Básica de Algodão", description: "Camiseta básica de algodão penteado em 2 cores." },
  colors,
  sizes,
  variants: colors.flatMap((color, c) =>
    sizes.map((size, s) => ({
      id: `00000000-0000-7000-8004-00000000000${c * 2 + s}`,
      sku: `CAM-BAS-${color.slug.toUpperCase()}-${size.name}`,
      colorId: color.id,
      sizeId: size.id,
      price: 59.9,
      gtin: null,
      available: !(c === 1 && s === 0),
    })),
  ),
  images: colors.map((color) => ({
    url: image(`camiseta-basica-${color.slug}`, color.hex.slice(1)),
    alt: `Camiseta básica ${color.name.toLowerCase()}, frente`,
    colorId: color.id,
  })),
  updatedAt: "2026-10-01T12:00:00Z",
};

const routes = {
  "/api/v1/catalog/categories": categories,
  "/api/v1/catalog/categories/camisetas": category,
  "/api/v1/catalog/products": { items: [summary], page: 1, pageSize: 24, totalItems: 1, totalPages: 1 },
  "/api/v1/catalog/products/camiseta-basica": product,
  "/api/v1/catalog/filters": { colors, sizes, minPrice: 59.9, maxPrice: 59.9 },
  "/api/v1/catalog/sitemap": {
    categories: [{ slug: "camisetas", updatedAt: "2026-10-01T12:00:00Z" }],
    products: [{ slug: "camiseta-basica", updatedAt: "2026-10-01T12:00:00Z" }],
  },
};

createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://stub").pathname;
  const body = routes[path];

  if (body) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
    return;
  }

  response.writeHead(404, { "content-type": "application/problem+json" });
  response.end(JSON.stringify({ status: 404, title: "Não encontrado", code: "Stub.NotFound" }));
}).listen(port, () => console.log(`API stub em http://localhost:${port}`));

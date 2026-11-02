// API falsa para o CI e para revisar o visual sem a API real: o `next build` pré-renderiza home e sitemap, e o
// Lighthouse CI navega por home, categoria e produto. Os dados imitam a MO (semijoias e bolsas) e são
// ilustrativos: fotos são placeholders com o nome da peça. Os testes contra a API real ficam no E2E (Playwright).
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 5099);
const updatedAt = "2026-10-01T12:00:00Z";

const uuid = (group, n) => `00000000-0000-7000-${group}-${String(n).padStart(12, "0")}`;
const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const colors = Object.fromEntries(
  [
    ["Dourado", "#C9A55C", "e9dfca", "6b5320"],
    ["Prateado", "#C3C6C8", "e4e5e3", "4f5356"],
    ["Ródio", "#DADDE0", "e8e9ea", "4a4d50"],
    ["Preto", "#1B1B1B", "d9d4cb", "1b1b1b"],
    ["Caramelo", "#A0673A", "eadccb", "6e4424"],
  ].map(([name, hex, bg, fg], index) => [name, { id: uuid("8001", index + 1), name, slug: slugify(name), hex, bg, fg }]),
);

const sizes = Object.fromEntries(
  ["14", "16", "18", "20", "22", "40 cm", "45 cm", "50 cm", "60 cm"].map((name, index) => [
    name,
    { id: uuid("8002", index + 1), name },
  ]),
);

// Rótulos da grade por categoria, já resolvidos como a API manda a partir da Fase 2B.2 (RF-050).
const categoryData = [
  ["Anéis", "Solitários, aparadores e anéis masculinos em banho de ouro, ródio e prata 925.", ["Acabamento", "Aro"]],
  ["Colares", "Pontos de luz, correntes e iniciais, em vários comprimentos.", ["Acabamento", "Comprimento"]],
  ["Pulseiras", "Rivieras, elos e pulseiras masculinas.", ["Acabamento", "Tamanho"]],
  ["Brincos", "Argolas, pontos de luz e gotas para o dia a dia e para festa.", ["Acabamento", "Tamanho"]],
  ["Bolsas", "Bolsas de couro e matelassê para completar o look.", ["Cor", "Tamanho"]],
];
const categories = categoryData.map(([name, description, [color, size]], index) => ({
  id: uuid("8000", index + 1),
  name,
  slug: slugify(name),
  description,
  seo: { title: `${name} | Semijoias`, description },
  variantLabels: { color, size },
}));
const categoryBySlug = (slug) => categories.find((category) => category.slug === slug);

// [nome, categoria, preço, acabamentos, tamanhos, combinações esgotadas "Acabamento/Tamanho", descrição]
const productData = [
  ["Anel Solitário Zircônia", "aneis", 89.9, ["Dourado", "Prateado"], ["14", "16", "18", "20"], ["Prateado/14"], "Solitário com zircônia de 6 mm em garras finas.\nBanho de ouro 18k ou ródio branco."],
  ["Anel Aparador Cravejado", "aneis", 69.9, ["Dourado", "Ródio"], ["14", "16", "18"], [], "Aro fino cravejado para usar sozinho ou junto do solitário."],
  ["Anel Masculino Liso Prata 925", "aneis", 159.9, ["Prateado"], ["18", "20", "22"], ["Prateado/22"], "Anel liso de prata 925 maciça, acabamento escovado."],
  ["Colar Ponto de Luz", "colares", 79.9, ["Dourado", "Prateado"], ["40 cm", "45 cm"], [], "Corrente veneziana com ponto de luz em zircônia."],
  ["Colar Corrente Cartier", "colares", 119.9, ["Dourado"], ["45 cm", "50 cm", "60 cm"], ["Dourado/60 cm"], "Corrente cartier de elos médios, fecho lagosta."],
  ["Colar Letra Inicial", "colares", 99.9, ["Dourado", "Prateado", "Ródio"], ["40 cm", "45 cm"], [], "Pingente de letra com corrente regulável. Escolha a inicial no WhatsApp."],
  ["Pulseira Riviera", "pulseiras", 129.9, ["Dourado", "Prateado"], [], ["Prateado/"], "Riviera de zircônias quadradas, 18 cm com extensor."],
  ["Pulseira Masculina Grumet", "pulseiras", 189.9, ["Prateado"], [], [], "Elos grumet de prata 925, 21 cm."],
  ["Brinco Argola Média", "brincos", 59.9, ["Dourado", "Prateado", "Ródio"], [], [], "Argola de 3 cm, leve, fecho clic."],
  ["Brinco Gota Cristal", "brincos", 74.9, ["Dourado"], [], [], "Gota de cristal facetado com base cravejada."],
  ["Bolsa Tiracolo Matelassê", "bolsas", 249.9, ["Preto", "Caramelo"], [], ["Caramelo/"], "Tiracolo matelassê com corrente dourada e alça de couro."],
  ["Bolsa Shopper Couro", "bolsas", 289.9, ["Caramelo"], [], [], "Shopper de couro legítimo com bolso interno."],
];

const image = (name, color) =>
  `https://placehold.co/800x1000/${color.bg}/${color.fg}/png?text=${encodeURIComponent(`${name}\\n${color.name}`)}`;

const products = productData.map(([name, categorySlug, price, colorNames, sizeNames, soldOut, description], p) => {
  const slug = slugify(name);
  const productColors = colorNames.map((colorName) => colors[colorName]);
  const productSizes = sizeNames.map((sizeName) => sizes[sizeName]);
  const sizeOptions = productSizes.length > 0 ? productSizes : [null];
  const category = categoryBySlug(categorySlug);
  const publicColor = ({ id, name: colorName, slug: colorSlug, hex }) => ({ id, name: colorName, slug: colorSlug, hex });

  let v = 0;
  const variants = productColors.flatMap((color) =>
    sizeOptions.map((size) => ({
      id: uuid("8004", p * 100 + ++v),
      sku: `${slug.slice(0, 12).toUpperCase()}-${color.slug.toUpperCase()}${size ? `-${slugify(size.name).toUpperCase()}` : ""}`,
      colorId: color.id,
      sizeId: size?.id ?? null,
      price,
      gtin: null,
      available: !soldOut.includes(`${color.name}/${size?.name ?? ""}`),
    })),
  );

  const images = productColors.map((color) => ({
    url: image(name, color),
    alt: `${name}, acabamento ${color.name.toLowerCase()}`,
    colorId: color.id,
  }));

  return {
    summary: {
      id: uuid("8003", p + 1),
      slug,
      name,
      categorySlug,
      priceFrom: price,
      colors: productColors.map(publicColor),
      image: images[0],
    },
    details: {
      id: uuid("8003", p + 1),
      slug,
      name,
      description,
      category: { slug: category.slug, name: category.name },
      priceFrom: price,
      seo: { title: name, description: description.split("\n")[0] },
      colors: productColors.map(publicColor),
      sizes: productSizes,
      variants,
      images,
      variantLabels: category.variantLabels,
      updatedAt,
    },
  };
});

// Coleções e vitrine (RF-024, RF-025): o painel altera, a loja lê daqui.
const productIdBySlug = (slug) => products.find(({ details }) => details.slug === slug).summary.id;
const collectionsData = [
  ["Eles", "Graphite", "Anéis, pulseiras e correntes para eles, em prata e aço.", ["anel-masculino-liso-prata-925", "pulseira-masculina-grumet", "colar-corrente-cartier", "brinco-argola-media"]],
  ["Prata 925", "Ivory", "Peças em prata 925 maciça, para usar todos os dias.", ["anel-masculino-liso-prata-925", "pulseira-masculina-grumet", "colar-ponto-de-luz"]],
];
const collections = collectionsData.map(([name, cardTheme, description, slugs], index) => ({
  id: uuid("8006", index + 1),
  name,
  slug: slugify(name),
  description,
  seoTitle: null,
  seoDescription: null,
  cardTheme,
  position: (index + 1) * 10,
  imageUrl: null,
  isActive: true,
  version: 0,
  productIds: slugs.map(productIdBySlug),
}));

const isoDay = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const showcase = {
  featured: { productId: productIdBySlug("anel-solitario-zirconia"), colorId: null },
  occasions: [
    {
      id: uuid("8007", 1),
      name: "Para presentear",
      text: "Peças que vão prontas para a caixinha, sem errar o tamanho.",
      imageUrl: null,
      startsOn: isoDay(-1),
      endsOn: isoDay(30),
      isActive: true,
      version: 0,
      productIds: ["colar-ponto-de-luz", "pulseira-riviera", "brinco-argola-media", "bolsa-shopper-couro"].map(productIdBySlug),
    },
  ],
};

const activeCollection = (slug) => collections.find((collection) => collection.slug === slug && collection.isActive);
const summaryOf = (id) => products.find(({ summary }) => summary.id === id)?.summary;
const hasStock = (id) => products.find(({ summary }) => summary.id === id)?.details.variants.some((variant) => variant.available) ?? false;

function publicShowcase() {
  const chosen = showcase.featured && hasStock(showcase.featured.productId) ? showcase.featured : null;
  const productId = chosen?.productId ?? products.find(({ summary }) => hasStock(summary.id))?.summary.id;
  const today = isoDay(0);
  const occasion = showcase.occasions.find((item) => item.isActive && item.startsOn <= today && today <= item.endsOn);
  const occasionProducts = occasion?.productIds.map(summaryOf).filter(Boolean) ?? [];
  return {
    featured: productId ? { product: summaryOf(productId), colorId: chosen?.colorId ?? null, isFallback: !chosen } : null,
    occasion: occasion && occasionProducts.length > 0 ? { name: occasion.name, text: occasion.text, imageUrl: occasion.imageUrl, products: occasionProducts } : null,
  };
}

function listProducts(query) {
  const category = query.get("category");
  const collection = query.has("collection") ? activeCollection(query.get("collection")) : null;
  const search = query.get("search")?.toLowerCase();
  const pageSize = Number(query.get("pageSize") ?? 20);
  const items = products
    .filter(({ summary }) => !category || summary.categorySlug === category)
    .filter(({ summary }) => !query.has("collection") || collection?.productIds.includes(summary.id))
    .filter(({ summary }) => !search || summary.name.toLowerCase().includes(search))
    .map(({ summary }) => summary);
  const page = items.slice(0, pageSize);
  return { items: page, page: 1, pageSize, totalItems: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) };
}

function filtersFor(categorySlug, collectionSlug) {
  const collection = collectionSlug ? activeCollection(collectionSlug) : null;
  const scoped = products
    .filter(({ summary }) => !categorySlug || summary.categorySlug === categorySlug)
    .filter(({ summary }) => !collectionSlug || collection?.productIds.includes(summary.id))
    .map(({ details }) => details);
  const unique = (list) => [...new Map(list.map((item) => [item.id, item])).values()];
  const prices = scoped.map((details) => details.priceFrom);
  return {
    colors: unique(scoped.flatMap((details) => details.colors)),
    sizes: unique(scoped.flatMap((details) => details.sizes)),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    categories: categories
      .filter((category) => scoped.some((details) => details.category.slug === category.slug))
      .map(({ id, name, slug }) => ({ id, name, slug })),
  };
}

function route(path, query) {
  if (path === "/api/v1/catalog/categories") {
    return categories.map(({ id, name, slug }) => ({ id, name, slug, parentId: null }));
  }
  if (path.startsWith("/api/v1/catalog/categories/")) {
    return categoryBySlug(path.split("/").pop());
  }
  if (path === "/api/v1/catalog/collections") {
    return collections
      .filter((collection) => collection.isActive)
      .toSorted((a, b) => a.position - b.position)
      .map(({ id, name, slug, cardTheme }) => ({ id, name, slug, cardTheme }));
  }
  if (path.startsWith("/api/v1/catalog/collections/")) {
    const collection = activeCollection(path.split("/").pop());
    return (
      collection && {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        seo: { title: collection.seoTitle ?? collection.name, description: collection.seoDescription ?? collection.description },
        imageUrl: collection.imageUrl,
        cardTheme: collection.cardTheme,
      }
    );
  }
  if (path === "/api/v1/catalog/showcase") {
    return publicShowcase();
  }
  if (path === "/api/v1/catalog/products") {
    return listProducts(query);
  }
  if (path.startsWith("/api/v1/catalog/products/")) {
    return products.find(({ details }) => details.slug === path.split("/").pop())?.details;
  }
  if (path === "/api/v1/catalog/filters") {
    return filtersFor(query.get("category"), query.get("collection"));
  }
  if (path === "/api/v1/catalog/sitemap") {
    return {
      categories: categories.map(({ slug }) => ({ slug, updatedAt })),
      products: products.map(({ details }) => ({ slug: details.slug, updatedAt })),
      collections: collections.filter((collection) => collection.isActive).map(({ slug }) => ({ slug, updatedAt })),
    };
  }
  return undefined;
}

// ---- Painel (/admin): tudo em memória, só para revisar as telas. Qualquer senha entra como admin. ----

const session = {
  accessToken: "stub-token",
  expiresAt: "2099-01-01T00:00:00Z",
  user: { id: uuid("8009", 1), email: "admin@loja.local", role: "Admin", emailConfirmed: true },
};

const admin = {
  categories: categoryData.map(([name, description, [colorLabel, sizeLabel]], index) => ({
    id: uuid("8000", index + 1),
    parentId: null,
    name,
    slug: slugify(name),
    description,
    seoTitle: null,
    seoDescription: null,
    colorLabel,
    sizeLabel,
    isActive: true,
    version: 0,
  })),
  colors: Object.values(colors).map(({ id, name, slug, hex }) => ({ id, name, slug, hex })),
  sizes: Object.values(sizes).map(({ id, name }, index) => ({ id, name, sortOrder: (index + 1) * 10 })),
  products: products.map(({ details }) => ({
    id: details.id,
    categoryId: categoryBySlug(details.category.slug).id,
    name: details.name,
    slug: details.slug,
    description: details.description,
    basePrice: details.priceFrom,
    weightGrams: 20,
    heightCm: 3,
    widthCm: 5,
    lengthCm: 5,
    seoTitle: null,
    seoDescription: null,
    isActive: true,
    version: 0,
    variants: details.variants.map((variant) => ({
      id: variant.id,
      colorId: variant.colorId,
      sizeId: variant.sizeId,
      sku: variant.sku,
      barcode: null,
      price: null,
      weightGrams: null,
      heightCm: null,
      widthCm: null,
      lengthCm: null,
      isActive: true,
      quantityOnHand: variant.available ? 6 : 0,
    })),
    images: details.images.map((image, index) => ({ id: uuid("8005", index + 1), position: index, ...image })),
  })),
};

let nextId = 5000;
const newId = () => uuid("8999", ++nextId);
const problem = (status, title, code = "Stub.Error") => ({ status, body: { status, title, code } });
const noContent = { status: 204 };
const allVariants = () => admin.products.flatMap((product) => product.variants);
const variantsOf = (field, id) => allVariants().filter((variant) => variant[field] === id).length;

const stubImageUrl = (fileName) => `https://placehold.co/1600x600/e9dfca/6b5320/png?text=${encodeURIComponent(fileName)}`;

function collectionRoute(method, id, sub, body) {
  if (!id) {
    if (method === "GET") {
      return {
        status: 200,
        body: collections
          .toSorted((a, b) => a.position - b.position)
          .map(({ productIds, ...collection }) => ({ ...collection, productCount: productIds.length })),
      };
    }
    const slug = body.slug || slugify(body.name);
    if (collections.some((item) => item.name.toLowerCase() === body.name.trim().toLowerCase())) return problem(409, "Já existe uma coleção com este nome.");
    if (collections.some((item) => item.slug === slug)) return problem(409, "Este endereço já é usado (ou já foi usado) por outra página da loja.");
    const collection = { id: newId(), isActive: true, version: 0, imageUrl: null, productIds: [], ...body, description: body.description ?? "", slug };
    collections.push(collection);
    return { status: 201, body: { id: collection.id } };
  }

  const collection = collections.find((item) => item.id === id);
  if (!collection) return problem(404, "Coleção não encontrada.");
  const touch = () => (collection.version += 1);

  if (sub === "status") {
    collection.isActive = body.isActive;
    touch();
    return noContent;
  }
  if (sub === "products") {
    if (method === "POST") {
      const fresh = body.productIds.filter((productId) => !collection.productIds.includes(productId));
      collection.productIds.push(...fresh);
      return { status: 200, body: { added: fresh.length } };
    }
    collection.productIds = collection.productIds.filter((productId) => !body.productIds.includes(productId));
    return noContent;
  }
  if (sub === "image") {
    if (method === "DELETE") {
      collection.imageUrl = null;
      touch();
      return noContent;
    }
    if (!body.isImage) return problem(400, "Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.");
    collection.imageUrl = stubImageUrl(body.fileName);
    touch();
    return { status: 200, body: { imageUrl: collection.imageUrl } };
  }
  if (method === "PUT") {
    if (body.version !== collection.version) return problem(409, "Este cadastro foi alterado por outra pessoa. Recarregue a página e tente de novo.");
    Object.assign(collection, body.collection, { slug: body.collection.slug || slugify(body.collection.name), description: body.collection.description ?? "" });
    touch();
    return noContent;
  }
  collections.splice(collections.indexOf(collection), 1);
  return noContent;
}

function featuredRoute(method, body) {
  if (method === "PUT") {
    showcase.featured = body.productId ? { productId: body.productId, colorId: body.colorId ?? null } : null;
    return noContent;
  }
  if (!showcase.featured) return noContent;
  const product = admin.products.find((item) => item.id === showcase.featured.productId);
  return {
    status: 200,
    body: {
      productId: product.id,
      productName: product.name,
      colorId: showcase.featured.colorId,
      isAvailable: product.isActive && product.variants.some((variant) => variant.isActive && variant.quantityOnHand > 0),
    },
  };
}

function occasionRoute(method, id, sub, body) {
  const describe = ({ productIds, ...occasion }) => ({
    ...occasion,
    products: productIds.map((productId) => {
      const product = admin.products.find((item) => item.id === productId);
      return { id: product.id, name: product.name, imageUrl: product.images[0]?.url ?? null, isActive: product.isActive };
    }),
  });
  const overlaps = (input, exceptId) =>
    input.isActive &&
    showcase.occasions.some((item) => item.id !== exceptId && item.isActive && item.startsOn <= input.endsOn && input.startsOn <= item.endsOn);
  const refusedOverlap = () => problem(409, "Já existe uma ocasião ativa neste período. Mude as datas ou desative a outra.");

  if (!id) {
    if (method === "GET") return { status: 200, body: showcase.occasions.toSorted((a, b) => b.startsOn.localeCompare(a.startsOn)).map(describe) };
    if (overlaps(body)) return refusedOverlap();
    const occasion = { id: newId(), version: 0, imageUrl: null, ...body, text: body.text ?? "" };
    showcase.occasions.push(occasion);
    return { status: 201, body: { id: occasion.id } };
  }

  const occasion = showcase.occasions.find((item) => item.id === id);
  if (!occasion) return problem(404, "Ocasião não encontrada.");
  if (sub === "image") {
    if (method === "DELETE") {
      occasion.imageUrl = null;
      occasion.version += 1;
      return noContent;
    }
    if (!body.isImage) return problem(400, "Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.");
    occasion.imageUrl = stubImageUrl(body.fileName);
    occasion.version += 1;
    return { status: 200, body: { imageUrl: occasion.imageUrl } };
  }
  if (method === "PUT") {
    if (body.version !== occasion.version) return problem(409, "Este cadastro foi alterado por outra pessoa. Recarregue a página e tente de novo.");
    if (overlaps(body.occasion, id)) return refusedOverlap();
    Object.assign(occasion, body.occasion, { text: body.occasion.text ?? "", version: occasion.version + 1 });
    return noContent;
  }
  showcase.occasions.splice(showcase.occasions.indexOf(occasion), 1);
  return noContent;
}

function adminProductDetails(product) {
  const category = admin.categories.find((item) => item.id === product.categoryId);
  return {
    ...product,
    collectionIds: collections.filter((collection) => collection.productIds.includes(product.id)).map((collection) => collection.id),
    variantLabels: { color: category?.colorLabel ?? "Cor", size: category?.sizeLabel ?? "Tamanho" },
    variants: product.variants.map((variant) => ({
      ...variant,
      colorName: admin.colors.find((color) => color.id === variant.colorId)?.name ?? null,
      sizeName: admin.sizes.find((size) => size.id === variant.sizeId)?.name ?? null,
    })),
  };
}

const stockMovements = [];

function stockRows() {
  return admin.products.flatMap((product) =>
    product.variants.map((variant) => ({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      imageUrl: product.images[0]?.url ?? null,
      colorName: admin.colors.find((color) => color.id === variant.colorId)?.name ?? null,
      sizeName: admin.sizes.find((size) => size.id === variant.sizeId)?.name ?? null,
      sku: variant.sku,
      barcode: variant.barcode,
      quantityOnHand: variant.quantityOnHand,
      lowStockThreshold: 3,
      isActive: product.isActive && variant.isActive,
    })),
  );
}

const pageOf = (items, page, pageSize) => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  totalItems: items.length,
  totalPages: Math.ceil(items.length / pageSize),
});

function applyStockMovement(variant, type, delta, reason) {
  variant.quantityOnHand += delta;
  stockMovements.unshift({
    id: newId(),
    variantId: variant.id,
    type,
    quantity: delta,
    reason,
    performedBy: session.user.email,
    createdAt: new Date().toISOString(),
  });
}

function stockRoute(method, id, sub, query, body) {
  const page = Number(query.get("page") ?? 1);
  if (id === "scan") {
    const variant = allVariants().find((item) => item.barcode === body.barcode);
    if (!variant) return problem(404, "Nenhuma variação tem este código de barras.", "Catalog.BarcodeNotFound");
    applyStockMovement(variant, "In", body.quantity ?? 1, "Entrada por leitura");
    const row = stockRows().find((item) => item.variantId === variant.id);
    return { status: 200, body: row };
  }
  if (!id) {
    const search = query.get("search")?.toLowerCase();
    const rows = stockRows()
      .filter((row) => query.get("lowStock") !== "true" || (row.isActive && row.quantityOnHand <= row.lowStockThreshold))
      .filter((row) => !search || row.productName.toLowerCase().includes(search) || row.sku.toLowerCase().includes(search) || row.barcode === search);
    return { status: 200, body: pageOf(rows, page, Number(query.get("pageSize") ?? 30)) };
  }
  const variant = allVariants().find((item) => item.id === id);
  if (!variant) return problem(404, "Variação não encontrada.");
  if (method === "GET") {
    return { status: 200, body: pageOf(stockMovements.filter((item) => item.variantId === id), page, Number(query.get("pageSize") ?? 20)) };
  }
  const delta = body.type === "In" ? body.quantity : body.type === "Out" ? -body.quantity : body.quantity - variant.quantityOnHand;
  if (variant.quantityOnHand + delta < 0) return problem(422, "Estoque insuficiente: o saldo não pode ficar negativo.", "Inventory.InsufficientStock");
  if (delta !== 0) applyStockMovement(variant, body.type, delta, body.reason);
  return { status: 200, body: { variantId: id, quantityOnHand: variant.quantityOnHand } };
}

function adminRoute(method, path, query, body) {
  const parts = path.replace("/api/v1/admin/", "").split("/");
  const [resource, id, sub, subId, action] = parts;

  if (resource === "categories") {
    if (method === "GET") {
      return {
        status: 200,
        body: admin.categories.map((category) => ({
          ...category,
          productCount: admin.products.filter((product) => product.categoryId === category.id).length,
        })),
      };
    }
    if (method === "POST") {
      const category = { id: newId(), isActive: true, version: 0, ...body, slug: body.slug || slugify(body.name) };
      admin.categories.push(category);
      return { status: 201, body: { id: category.id } };
    }
    const category = admin.categories.find((item) => item.id === id);
    if (!category) return problem(404, "Categoria não encontrada.");
    if (method === "PATCH") return Object.assign(category, { isActive: body.isActive, version: category.version + 1 }) && noContent;
    if (method === "PUT") {
      if (body.version !== category.version) return problem(409, "Este cadastro foi alterado por outra pessoa.");
      Object.assign(category, body.category, { slug: body.category.slug || slugify(body.category.name), version: category.version + 1 });
      return noContent;
    }
    if (admin.products.some((product) => product.categoryId === id)) return problem(409, "A categoria tem produtos ou subcategorias. Desative em vez de excluir.");
    admin.categories.splice(admin.categories.indexOf(category), 1);
    return noContent;
  }

  if (resource === "collections") return collectionRoute(method, id, sub, body);
  if (resource === "showcase") return featuredRoute(method, body);
  if (resource === "occasions") return occasionRoute(method, id, sub, body);

  if (resource === "colors" || resource === "sizes") {
    const list = admin[resource];
    const field = resource === "colors" ? "colorId" : "sizeId";
    if (method === "GET") return { status: 200, body: list.map((item) => ({ ...item, variantCount: variantsOf(field, item.id) })) };
    if (method === "POST") {
      if (list.some((item) => item.name.toLowerCase() === body.name.toLowerCase())) return problem(409, "Já existe com este nome.");
      const item = { id: newId(), slug: slugify(body.name), ...body };
      list.push(item);
      return { status: 201, body: { id: item.id } };
    }
    const item = list.find((entry) => entry.id === id);
    if (!item) return problem(404, "Não encontrado.");
    if (method === "PUT") return Object.assign(item, body) && noContent;
    if (variantsOf(field, id) > 0) return problem(409, "Está em uso em produtos.");
    list.splice(list.indexOf(item), 1);
    return noContent;
  }

  if (resource === "variants") {
    const code = parts[2];
    if (code.length !== 13 && code.length !== 8) return problem(400, "Código de barras inválido.");
    const product = admin.products.find((item) => item.variants.some((variant) => variant.barcode === code));
    if (!product) return problem(404, "Nenhuma variação tem este código de barras.", "Catalog.BarcodeNotFound");
    const variant = product.variants.find((item) => item.barcode === code);
    return { status: 200, body: { variantId: variant.id, productId: product.id, productName: product.name, sku: variant.sku, barcode: code } };
  }

  if (resource === "stock") return stockRoute(method, id, sub, query, body);

  if (resource !== "products") return undefined;

  if (!id && method === "GET") {
    const search = query.get("search")?.toLowerCase();
    const categoryId = query.get("categoryId");
    const isActive = query.get("isActive");
    const collectionId = query.get("collectionId");
    const items = admin.products
      .filter((product) => !collectionId || collections.find((collection) => collection.id === collectionId)?.productIds.includes(product.id))
      .filter((product) => !search || product.name.toLowerCase().includes(search) || product.variants.some((variant) => variant.sku.toLowerCase().includes(search)))
      .filter((product) => !categoryId || product.categoryId === categoryId)
      .filter((product) => !isActive || String(product.isActive) === isActive)
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        categoryName: admin.categories.find((category) => category.id === product.categoryId)?.name ?? "",
        basePrice: product.basePrice,
        isActive: product.isActive,
        variantCount: product.variants.length,
        imageCount: product.images.length,
        imageUrl: product.images[0]?.url ?? null,
        updatedAt,
      }));
    return { status: 200, body: { items, page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 } };
  }

  if (!id && method === "POST") {
    if (admin.products.some((product) => product.slug === (body.slug || slugify(body.name)))) {
      return problem(409, "Este endereço já é usado (ou já foi usado) por outra página da loja.");
    }
    const product = { id: newId(), isActive: false, version: 0, variants: [], images: [], ...body, slug: body.slug || slugify(body.name), description: body.description ?? "" };
    admin.products.unshift(product);
    return { status: 201, body: { id: product.id } };
  }

  const product = admin.products.find((item) => item.id === id);
  if (!product) return problem(404, "Produto não encontrado.");
  const touch = () => (product.version += 1);

  if (!sub) {
    if (method === "GET") return { status: 200, body: adminProductDetails(product) };
    if (body.version !== product.version) return problem(409, "Este cadastro foi alterado por outra pessoa. Recarregue a página e tente de novo.");
    Object.assign(product, body.product, { slug: body.product.slug || slugify(body.product.name) });
    touch();
    return noContent;
  }

  if (sub === "images") {
    return imageRoute(method, product, subId, body, touch);
  }

  if (sub === "status") {
    if (body.isActive && !product.variants.some((variant) => variant.isActive)) {
      return problem(422, "Um produto na loja precisa de ao menos uma variação ativa.");
    }
    if (body.isActive && product.images.length === 0) {
      return problem(422, "Um produto na loja precisa de ao menos uma foto.");
    }
    product.isActive = body.isActive;
    touch();
    return noContent;
  }

  if (subId === "generate") {
    const colorAxis = body.colorIds.length ? body.colorIds : [null];
    const sizeAxis = body.sizeIds.length ? body.sizeIds : [null];
    let created = 0;
    for (const colorId of colorAxis) {
      for (const sizeId of sizeAxis) {
        if (product.variants.some((variant) => variant.colorId === colorId && variant.sizeId === sizeId)) continue;
        const colorSlug = admin.colors.find((color) => color.id === colorId)?.slug;
        const sizeSlug = slugify(admin.sizes.find((size) => size.id === sizeId)?.name ?? "");
        product.variants.push({
          id: newId(),
          colorId,
          sizeId,
          sku: [product.slug, colorSlug, sizeSlug].filter(Boolean).join("-").toUpperCase(),
          barcode: null,
          price: null,
          weightGrams: null,
          heightCm: null,
          widthCm: null,
          lengthCm: null,
          isActive: true,
          quantityOnHand: 0,
        });
        created += 1;
      }
    }
    touch();
    return { status: 200, body: { created } };
  }

  const variant = product.variants.find((item) => item.id === subId);
  if (!variant) return problem(404, "Variação não encontrada.");
  if (action === "status") {
    variant.isActive = body.isActive;
  } else {
    if (body.barcode && allVariants().some((item) => item !== variant && item.barcode === body.barcode)) {
      return problem(409, "Este código de barras já está em outra variação.");
    }
    Object.assign(variant, body);
  }
  touch();
  return noContent;
}

function imageRoute(method, product, imageId, body, touch) {
  if (method === "POST") {
    if (!body.isImage) return problem(400, "Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.");
    const colorId = body.colorId || null;
    const group = product.images.filter((image) => image.colorId === colorId);
    const image = {
      id: newId(),
      url: `https://placehold.co/800x1000/e9dfca/6b5320/png?text=${encodeURIComponent(body.fileName)}`,
      alt: body.alt,
      colorId,
      position: group.length,
      width: 1200,
      height: 1500,
    };
    product.images.push(image);
    touch();
    return { status: 201, body: image };
  }

  if (imageId === "order") {
    const group = product.images.filter((image) => image.colorId === body.colorId);
    if (group.length !== body.imageIds.length) return problem(409, "As fotos mudaram em outra aba.");
    body.imageIds.forEach((id, position) => (group.find((image) => image.id === id).position = position));
    touch();
    return noContent;
  }

  const image = product.images.find((item) => item.id === imageId);
  if (!image) return problem(404, "Foto não encontrada.");
  if (method === "DELETE") {
    if (product.isActive && product.images.length === 1) return problem(422, "Um produto na loja precisa de ao menos uma foto.");
    product.images.splice(product.images.indexOf(image), 1);
  } else {
    if (body.colorId !== image.colorId) {
      image.position = product.images.filter((item) => item.colorId === body.colorId).length;
    }
    Object.assign(image, { alt: body.alt, colorId: body.colorId });
  }
  touch();
  return noContent;
}

// Lê só o que o stub precisa do multipart: campos de texto, nome do arquivo e a assinatura dos bytes.
function parseUpload(buffer, contentType) {
  const boundary = contentType.split("boundary=")[1];
  const raw = buffer.toString("latin1");
  const fields = {};
  let fileHead = "";
  let fileName = "foto";
  for (const part of raw.split(`--${boundary}`)) {
    const end = part.indexOf("\r\n\r\n");
    if (end === -1) continue;
    const headers = part.slice(0, end);
    const value = part.slice(end + 4, -2);
    const name = headers.match(/name="([^"]+)"/)?.[1];
    const file = headers.match(/filename="([^"]*)"/)?.[1];
    if (file !== undefined) {
      fileName = Buffer.from(file, "latin1").toString("utf8");
      fileHead = value.slice(0, 12);
    } else if (name) {
      fields[name] = Buffer.from(value, "latin1").toString("utf8");
    }
  }
  const isImage = fileHead.startsWith("\xff\xd8\xff") || fileHead.startsWith("\x89PNG") || fileHead.startsWith("RIFF") || fileHead.slice(4, 8) === "ftyp";
  return { ...fields, fileName, isImage };
}

function browserRoute(method, path, query, body) {
  if (path === "/api/v1/auth/login" || path === "/api/v1/auth/refresh") return { status: 200, body: session };
  if (path === "/api/v1/auth/logout") return noContent;
  if (path === "/api/v1/auth/me") return { status: 200, body: session.user };
  return path.startsWith("/api/v1/admin/") ? adminRoute(method, path, query, body) : undefined;
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const contentType = request.headers["content-type"] ?? "";
      if (contentType.startsWith("multipart/")) {
        resolve(parseUpload(buffer, contentType));
      } else {
        resolve(buffer.length > 0 ? JSON.parse(buffer.toString("utf8")) : undefined);
      }
    });
  });
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://stub");
  const path = decodeURIComponent(url.pathname);
  const origin = request.headers.origin;
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Headers", "content-type, authorization, x-requested-with");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  const result = browserRoute(request.method, path, url.searchParams, await readBody(request));
  if (result) {
    const failed = result.status >= 400;
    response.writeHead(result.status, result.body ? { "content-type": failed ? "application/problem+json" : "application/json" } : {});
    response.end(result.body ? JSON.stringify(result.body) : undefined);
    return;
  }

  const body = route(path, url.searchParams);

  if (body) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
    return;
  }

  response.writeHead(404, { "content-type": "application/problem+json" });
  response.end(JSON.stringify({ status: 404, title: "Não encontrado", code: "Stub.NotFound" }));
}).listen(port, () => console.log(`API stub em http://localhost:${port}`));

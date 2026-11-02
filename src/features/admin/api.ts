import { apiRequest } from "@/shared/api/browser-client";

// Chamadas do painel (arquivo 07 §9). Tipos escritos à mão até o próximo `npm run gen:api` com a API rodando.

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  colorLabel: string | null;
  sizeLabel: string | null;
  isActive: boolean;
  productCount: number;
  version: number;
}

export interface CategoryInput {
  parentId: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  colorLabel: string | null;
  sizeLabel: string | null;
}

export interface AdminColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  variantCount: number;
}

export interface AdminSize {
  id: string;
  name: string;
  sortOrder: number;
  variantCount: number;
}

export interface AdminProductSummary {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  basePrice: number;
  isActive: boolean;
  variantCount: number;
  imageCount: number;
  imageUrl: string | null;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminVariant {
  id: string;
  colorId: string | null;
  colorName: string | null;
  sizeId: string | null;
  sizeName: string | null;
  sku: string;
  barcode: string | null;
  price: number | null;
  weightGrams: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
  isActive: boolean;
  quantityOnHand: number;
}

export interface AdminProductImage {
  id: string;
  url: string;
  alt: string;
  colorId: string | null;
  position: number;
  width: number | null;
  height: number | null;
}

export interface UploadedImage extends AdminProductImage {
  width: number;
  height: number;
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  version: number;
  variantLabels: { color: string; size: string };
  variants: AdminVariant[];
  images: AdminProductImage[];
  collectionIds: string[];
}

export interface ProductInput {
  categoryId: string;
  name: string;
  slug: string | null;
  description: string | null;
  basePrice: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface VariantInput {
  sku: string;
  price: number | null;
  barcode: string | null;
  weightGrams: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
}

export interface VariantByBarcode {
  variantId: string;
  productId: string;
  productName: string;
  colorName: string | null;
  sizeName: string | null;
  sku: string;
  barcode: string;
}

export interface ProductListFilters {
  page: number;
  search: string;
  categoryId: string;
  status: "" | "active" | "inactive";
  collectionId: string;
}

export type CardTheme = "Ivory" | "Graphite";

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  cardTheme: CardTheme;
  position: number;
  imageUrl: string | null;
  isActive: boolean;
  productCount: number;
  version: number;
}

export interface CollectionInput {
  name: string;
  slug: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  cardTheme: CardTheme;
  position: number;
}

export interface AdminFeatured {
  productId: string;
  productName: string;
  colorId: string | null;
  isAvailable: boolean;
}

export interface AdminOccasionProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
}

export interface AdminOccasion {
  id: string;
  name: string;
  text: string;
  imageUrl: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
  version: number;
  products: AdminOccasionProduct[];
}

export interface OccasionInput {
  name: string;
  text: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
  productIds: string[];
}

const ROOT = "/api/v1/admin";

const get = <T>(path: string) => apiRequest<T>(`${ROOT}${path}`, { auth: true });
const send = <T = void>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown) =>
  apiRequest<T>(`${ROOT}${path}`, { method, body, auth: true });

/** Capa de coleção ou imagem de ocasião (RF-061): um arquivo só, e a API devolve o endereço final. */
function putImage(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ imageUrl: string }>(`${ROOT}${path}`, { method: "PUT", form, auth: true });
}

export const adminApi = {
  categories: () => get<AdminCategory[]>("/categories"),
  createCategory: (input: CategoryInput) => send<{ id: string }>("POST", "/categories", input),
  updateCategory: (id: string, version: number, category: CategoryInput) => send("PUT", `/categories/${id}`, { version, category }),
  setCategoryStatus: (id: string, isActive: boolean) => send("PATCH", `/categories/${id}/status`, { isActive }),
  deleteCategory: (id: string) => send("DELETE", `/categories/${id}`),

  colors: () => get<AdminColor[]>("/colors"),
  createColor: (name: string, hex: string) => send<{ id: string }>("POST", "/colors", { name, hex }),
  updateColor: (id: string, name: string, hex: string) => send("PUT", `/colors/${id}`, { name, hex }),
  deleteColor: (id: string) => send("DELETE", `/colors/${id}`),

  sizes: () => get<AdminSize[]>("/sizes"),
  createSize: (name: string, sortOrder: number) => send<{ id: string }>("POST", "/sizes", { name, sortOrder }),
  updateSize: (id: string, name: string, sortOrder: number) => send("PUT", `/sizes/${id}`, { name, sortOrder }),
  deleteSize: (id: string) => send("DELETE", `/sizes/${id}`),

  products: (filters: ProductListFilters) => {
    const query = new URLSearchParams({ page: String(filters.page) });
    if (filters.search) {
      query.set("search", filters.search);
    }
    if (filters.categoryId) {
      query.set("categoryId", filters.categoryId);
    }
    if (filters.status) {
      query.set("isActive", String(filters.status === "active"));
    }
    if (filters.collectionId) {
      query.set("collectionId", filters.collectionId);
    }
    return get<Paged<AdminProductSummary>>(`/products?${query.toString()}`);
  },
  product: (id: string) => get<AdminProduct>(`/products/${id}`),
  createProduct: (input: ProductInput) => send<{ id: string }>("POST", "/products", input),
  updateProduct: (id: string, version: number, product: ProductInput) => send("PUT", `/products/${id}`, { version, product }),
  setProductStatus: (id: string, isActive: boolean) => send("PATCH", `/products/${id}/status`, { isActive }),
  generateVariants: (id: string, colorIds: string[], sizeIds: string[]) =>
    send<{ created: number }>("POST", `/products/${id}/variants/generate`, { colorIds, sizeIds }),
  updateVariant: (id: string, variantId: string, input: VariantInput) => send("PUT", `/products/${id}/variants/${variantId}`, input),
  setVariantStatus: (id: string, variantId: string, isActive: boolean) =>
    send("PATCH", `/products/${id}/variants/${variantId}/status`, { isActive }),

  uploadImage: (id: string, file: File, alt: string, colorId: string | null) => {
    const form = new FormData();
    form.append("file", file);
    form.append("alt", alt);
    if (colorId) {
      form.append("colorId", colorId);
    }
    return apiRequest<UploadedImage>(`${ROOT}/products/${id}/images`, { method: "POST", form, auth: true });
  },
  updateImage: (id: string, imageId: string, alt: string, colorId: string | null) => send("PUT", `/products/${id}/images/${imageId}`, { alt, colorId }),
  deleteImage: (id: string, imageId: string) => send("DELETE", `/products/${id}/images/${imageId}`),
  reorderImages: (id: string, colorId: string | null, imageIds: string[]) => send("PUT", `/products/${id}/images/order`, { colorId, imageIds }),

  collections: () => get<AdminCollection[]>("/collections"),
  createCollection: (input: CollectionInput) => send<{ id: string }>("POST", "/collections", input),
  updateCollection: (id: string, version: number, collection: CollectionInput) => send("PUT", `/collections/${id}`, { version, collection }),
  setCollectionStatus: (id: string, isActive: boolean) => send("PATCH", `/collections/${id}/status`, { isActive }),
  deleteCollection: (id: string) => send("DELETE", `/collections/${id}`),
  addCollectionProducts: (id: string, productIds: string[]) => send<{ added: number }>("POST", `/collections/${id}/products`, { productIds }),
  removeCollectionProducts: (id: string, productIds: string[]) => send("DELETE", `/collections/${id}/products`, { productIds }),
  setCollectionImage: (id: string, file: File) => putImage(`/collections/${id}/image`, file),
  removeCollectionImage: (id: string) => send("DELETE", `/collections/${id}/image`),

  /** A API responde 204 quando nada foi escolhido; a home mostra a novidade mais recente. */
  featured: async () => (await get<AdminFeatured | undefined>("/showcase/featured")) ?? null,
  setFeatured: (productId: string | null, colorId: string | null) => send("PUT", "/showcase/featured", { productId, colorId }),

  occasions: () => get<AdminOccasion[]>("/occasions"),
  createOccasion: (input: OccasionInput) => send<{ id: string }>("POST", "/occasions", input),
  updateOccasion: (id: string, version: number, occasion: OccasionInput) => send("PUT", `/occasions/${id}`, { version, occasion }),
  deleteOccasion: (id: string) => send("DELETE", `/occasions/${id}`),
  setOccasionImage: (id: string, file: File) => putImage(`/occasions/${id}/image`, file),
  removeOccasionImage: (id: string) => send("DELETE", `/occasions/${id}/image`),

  variantByBarcode: (code: string) => get<VariantByBarcode>(`/variants/by-barcode/${encodeURIComponent(code)}`),
};

export const adminKeys = {
  categories: ["admin", "categories"] as const,
  colors: ["admin", "colors"] as const,
  sizes: ["admin", "sizes"] as const,
  products: ["admin", "products"] as const,
  collections: ["admin", "collections"] as const,
  featured: ["admin", "featured"] as const,
  occasions: ["admin", "occasions"] as const,
  product: (id: string) => ["admin", "product", id] as const,
};

export const CATEGORY_KEYS = [
  "hookahs",
  "tobacco",
  "smokingDevices",
  "accessories",
  "electronicDevices",
  "charcoalMore",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];
export type Availability = "on_request" | "available" | "out_of_stock";

export type CatalogVariant = {
  id: string;
  name: string;
  availability: Availability;
  image?: string;
};

export type CatalogProduct = {
  id: string;
  category: CategoryKey;
  name: string;
  brand: string;
  priceAED: number | null;
  availability: Availability;
  shortDescription: string;
  detailedDescription: string;
  specifications: string[];
  keywords: string[];
  variants?: CatalogVariant[];
  image: string;
  featured: boolean;
  newestRank: number;
  archived?: boolean;
};

export type CatalogSnapshot = {
  products: CatalogProduct[];
  metadata: { categories: string[]; brands: string[]; flavors: string[] };
};

export let catalogProducts: CatalogProduct[] = [];

export const getCatalogSnapshot = (): CatalogSnapshot => {
  const products = catalogProducts.filter((product) => !product.archived);
  const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const flavors = Array.from(new Set(products.flatMap((product) => product.keywords))).sort();
  return { products, metadata: { categories, brands, flavors } };
};

export const fetchCatalogProducts = async (): Promise<CatalogProduct[]> => {
  try {
    const response = await fetch("/api/catalog", { headers: { Accept: "application/json" } });
    if (!response.ok) return catalogProducts;
    const payload = await response.json() as { products?: CatalogProduct[] };
    if (Array.isArray(payload.products) && payload.products.length > 0) {
      catalogProducts = payload.products.map((product) => ({ ...product, archived: Boolean(product.archived) }));
      return catalogProducts;
    }
  } catch {
    // fall back to the current in-memory catalog for static local hosting
  }
  return catalogProducts;
};

export const syncCatalogProducts = (products: CatalogProduct[]) => {
  catalogProducts = products.map((product) => ({ ...product, archived: Boolean(product.archived) }));
  return catalogProducts;
};

export const getProduct = (id: string) => catalogProducts.find((product) => product.id === id && !product.archived);
export const getCategoryProducts = (category: CategoryKey) => catalogProducts.filter((product) => product.category === category && !product.archived);
export const formatAED = (price: number | null) => price === null ? "Price to confirm" : `AED ${price.toFixed(2)}`;

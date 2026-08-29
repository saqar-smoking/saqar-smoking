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
  image: string;
  featured: boolean;
  newestRank: number;
};

const PLACEHOLDER_IMAGE = "/assets/placeholder.svg";
const ACCESSORY_IMAGE = PLACEHOLDER_IMAGE;
const DEVICES_IMAGE = PLACEHOLDER_IMAGE;
const HOOKAH_IMAGE = PLACEHOLDER_IMAGE;

/**
 * Replace every `placeholder` field with verified shop data before publishing
 * a live inventory. Null prices intentionally mean “confirm on WhatsApp”;
 * they are never rendered as fabricated AED amounts.
 */
export const catalogProducts: CatalogProduct[] = [
  { id: "hookah-01", category: "hookahs", name: "Placeholder — Hookah 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder hookah entry ready for verified product details.", detailedDescription: "Replace this text with the approved hookah description, materials, included pieces, and care information.", specifications: ["Material to confirm", "Height to confirm", "Origin to confirm"], keywords: ["hookah", "shisha", "placeholder"], image: HOOKAH_IMAGE, featured: true, newestRank: 12 },
  { id: "hookah-02", category: "hookahs", name: "Placeholder — Hookah 02", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for a second hookah product.", detailedDescription: "Replace with verified product information before using this product in customer communications.", specifications: ["Material to confirm", "Size to confirm", "Included items to confirm"], keywords: ["hookah", "shisha", "placeholder"], image: HOOKAH_IMAGE, featured: false, newestRank: 11 },
  { id: "tobacco-01", category: "tobacco", name: "Placeholder — Tobacco 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder tobacco entry with a clear confirmation status.", detailedDescription: "Replace with verified brand, flavor, pack size, origin, and legal product information.", specifications: ["Brand to confirm", "Pack size to confirm", "Flavor to confirm"], keywords: ["tobacco", "shisha tobacco", "placeholder"], image: PLACEHOLDER_IMAGE, featured: true, newestRank: 10 },
  { id: "tobacco-02", category: "tobacco", name: "Placeholder — Tobacco 02", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for a second tobacco product.", detailedDescription: "Replace with verified tobacco product information before publishing a price or claim.", specifications: ["Brand to confirm", "Pack size to confirm", "Origin to confirm"], keywords: ["tobacco", "placeholder"], image: PLACEHOLDER_IMAGE, featured: false, newestRank: 9 },
  { id: "device-01", category: "smokingDevices", name: "Placeholder — Smoking Device 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder smoking device entry for the future catalog.", detailedDescription: "Replace with verified device compatibility, contents, materials, and care information.", specifications: ["Device type to confirm", "Material to confirm", "Compatibility to confirm"], keywords: ["smoking device", "device", "placeholder"], image: DEVICES_IMAGE, featured: true, newestRank: 8 },
  { id: "device-02", category: "smokingDevices", name: "Placeholder — Smoking Device 02", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for another smoking device.", detailedDescription: "Replace with approved product copy and current stock status.", specifications: ["Device type to confirm", "Size to confirm", "Specifications to confirm"], keywords: ["smoking device", "placeholder"], image: DEVICES_IMAGE, featured: false, newestRank: 7 },
  { id: "accessory-01", category: "accessories", name: "Placeholder — Accessory 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder accessory entry for a considered essentials range.", detailedDescription: "Replace with verified accessory materials, dimensions, and included parts.", specifications: ["Accessory type to confirm", "Material to confirm", "Size to confirm"], keywords: ["accessory", "smoking accessory", "placeholder"], image: ACCESSORY_IMAGE, featured: true, newestRank: 6 },
  { id: "accessory-02", category: "accessories", name: "Placeholder — Accessory 02", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for a second accessory product.", detailedDescription: "Replace with approved product information and a verified price.", specifications: ["Accessory type to confirm", "Material to confirm", "Origin to confirm"], keywords: ["accessory", "placeholder"], image: ACCESSORY_IMAGE, featured: false, newestRank: 5 },
  { id: "electronic-01", category: "electronicDevices", name: "Placeholder — Electronic Device 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder electronic device entry for future verified inventory.", detailedDescription: "Replace with verified model, battery, compatibility, warranty, and safety details.", specifications: ["Model to confirm", "Battery to confirm", "Warranty to confirm"], keywords: ["electronic device", "vape", "placeholder"], image: DEVICES_IMAGE, featured: true, newestRank: 4 },
  { id: "electronic-02", category: "electronicDevices", name: "Placeholder — Electronic Device 02", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for another electronic device.", detailedDescription: "Replace with verified product information before customer use.", specifications: ["Model to confirm", "Power to confirm", "Compatibility to confirm"], keywords: ["electronic device", "placeholder"], image: DEVICES_IMAGE, featured: false, newestRank: 3 },
  { id: "charcoal-01", category: "charcoalMore", name: "Placeholder — Charcoal 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A placeholder charcoal and more entry for the catalog.", detailedDescription: "Replace with verified type, quantity, origin, and handling information.", specifications: ["Type to confirm", "Quantity to confirm", "Origin to confirm"], keywords: ["charcoal", "coal", "placeholder"], image: PLACEHOLDER_IMAGE, featured: true, newestRank: 2 },
  { id: "charcoal-02", category: "charcoalMore", name: "Placeholder — More 01", brand: "Brand to confirm", priceAED: null, availability: "on_request", shortDescription: "A structured placeholder for an additional charcoal product.", detailedDescription: "Replace with approved category details before publishing.", specifications: ["Product type to confirm", "Quantity to confirm", "Price to confirm"], keywords: ["charcoal", "more", "placeholder"], image: PLACEHOLDER_IMAGE, featured: false, newestRank: 1 },
];

export const getProduct = (id: string) => catalogProducts.find((product) => product.id === id);
export const getCategoryProducts = (category: CategoryKey) => catalogProducts.filter((product) => product.category === category);
export const formatAED = (price: number | null) => price === null ? "Price to confirm" : `AED ${price.toFixed(2)}`;

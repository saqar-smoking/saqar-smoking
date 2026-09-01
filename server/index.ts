import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { sql } from "@vercel/postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The repo-bundled seed catalog. Readable in every environment, including Vercel's
// read-only serverless filesystem, but must never be written to in production.
const SEED_FILE = path.resolve(__dirname, "..", "data", "catalog.json");
// Vercel functions can only write inside the OS temp directory; everywhere else
// (local dev, tests) we read/write the seed file directly so data persists on disk.
const DATA_FILE = process.env.CATALOG_DATA_FILE || (process.env.VERCEL ? path.join(os.tmpdir(), "al-saqar-catalog.json") : SEED_FILE);

type CatalogProductRecord = {
  id: string;
  category: string;
  name: string;
  brand: string;
  priceAED: number | null;
  availability: string;
  shortDescription: string;
  detailedDescription: string;
  specifications: string[];
  keywords: string[];
  variants?: { id: string; name: string; availability: string; image?: string }[];
  image: string;
  featured: boolean;
  newestRank: number;
  archived: boolean;
};

type CatalogData = {
  products: CatalogProductRecord[];
  metadata: { categories: string[]; brands: string[]; flavors: string[] };
};

const VALID_CATEGORIES = ["hookahs", "tobacco", "smokingDevices", "accessories", "electronicDevices", "charcoalMore"];

// The admin category dropdown must always offer every valid category, regardless
// of which categories the current products happen to use.
const DEFAULT_CATALOG: CatalogData = {
  products: [],
  metadata: { categories: [...VALID_CATEGORIES].sort(), brands: [], flavors: [] }
};

const ensureDataFile = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed a fresh writable copy (e.g. /tmp on Vercel) from the bundled seed file when available.
    if (DATA_FILE !== SEED_FILE && fs.existsSync(SEED_FILE)) {
      fs.copyFileSync(SEED_FILE, DATA_FILE);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CATALOG, null, 2), "utf8");
    }
  }
};

const readCatalogFromDisk = (): CatalogData => {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as { products?: unknown[]; metadata?: { categories?: string[]; brands?: string[]; flavors?: string[] } };
    if (!parsed || !Array.isArray(parsed.products)) {
      return DEFAULT_CATALOG;
    }
    return { products: parsed.products as CatalogProductRecord[], metadata: { categories: parsed.metadata?.categories ?? DEFAULT_CATALOG.metadata.categories, brands: parsed.metadata?.brands ?? DEFAULT_CATALOG.metadata.brands, flavors: parsed.metadata?.flavors ?? DEFAULT_CATALOG.metadata.flavors } };
  } catch (error) {
    console.warn("Falling back to the default catalog because the disk store could not be read:", error);
    return DEFAULT_CATALOG;
  }
};

const writeCatalogToDisk = (catalog: CatalogData) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(catalog, null, 2), "utf8");
};

const readCatalog = async (): Promise<CatalogData> => {
  let catalog: CatalogData;
  if (process.env.POSTGRES_URL) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS catalog_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`;
      const result = await sql<{ value: CatalogData }>`SELECT value FROM catalog_store WHERE key = 'catalog';`;
      if (result.rows[0]?.value && Array.isArray(result.rows[0].value.products)) {
        catalog = result.rows[0].value;
      } else {
        catalog = readCatalogFromDisk();
      }
    } catch (error) {
      console.warn("Falling back to disk catalog storage because Postgres is unavailable:", error);
      catalog = readCatalogFromDisk();
    }
  } else {
    catalog = readCatalogFromDisk();
  }
  // The category dropdown must always list every valid category, not just the ones in use.
  return { ...catalog, metadata: { ...catalog.metadata, categories: [...VALID_CATEGORIES].sort() } };
};

const writeCatalog = async (catalog: CatalogData) => {
  if (process.env.POSTGRES_URL) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS catalog_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`;
      await sql`INSERT INTO catalog_store (key, value) VALUES ('catalog', ${JSON.stringify(catalog)}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;
      return;
    } catch (error) {
      console.warn("Postgres catalog write failed; falling back to disk storage:", error);
    }
  }
  writeCatalogToDisk(catalog);
};

const VALID_CATEGORIES_SET = new Set(VALID_CATEGORIES);
const VALID_AVAILABILITY = new Set(["on_request", "available", "out_of_stock"]);

const validateProducts = (products: unknown[]) => {
  const ids = new Set<string>();
  const normalized = products.map((value, index) => {
    if (!value || typeof value !== "object") throw new Error(`Product ${index + 1} is invalid`);
    const product = value as Record<string, unknown>;
    const id = typeof product.id === "string" && product.id.trim() ? product.id.trim() : `product-${crypto.randomUUID()}`;
    if (ids.has(id)) throw new Error(`Duplicate product ID: ${id}`);
    ids.add(id);

    const name = typeof product.name === "string" ? product.name.trim() : "";
    const category = typeof product.category === "string" ? product.category : "";
    const brand = typeof product.brand === "string" ? product.brand.trim() : "";
    const availability = typeof product.availability === "string" ? product.availability : "";
    const priceAED = product.priceAED === null || product.priceAED === undefined || product.priceAED === "" ? null : Number(product.priceAED);
    if (!name || name.length > 200) throw new Error(`Product ${index + 1} needs a name under 200 characters`);
    if (!VALID_CATEGORIES_SET.has(category)) throw new Error(`Product ${index + 1} has an invalid category`);
    if (!VALID_AVAILABILITY.has(availability)) throw new Error(`Product ${index + 1} has an invalid availability`);
    if (priceAED !== null && (!Number.isFinite(priceAED) || priceAED < 0 || priceAED > 100000000)) throw new Error(`Product ${index + 1} has an invalid price`);
    const list = (key: string) => {
      if (!Array.isArray(product[key]) || !product[key].every((item) => typeof item === "string")) throw new Error(`Product ${index + 1} has invalid ${key}`);
      return product[key] as string[];
    };
    return {
      ...product,
      id,
      category,
      name,
      brand,
      priceAED,
      availability,
      shortDescription: typeof product.shortDescription === "string" ? product.shortDescription.trim() : "",
      detailedDescription: typeof product.detailedDescription === "string" ? product.detailedDescription.trim() : "",
      specifications: list("specifications"),
      keywords: list("keywords"),
      variants: Array.isArray(product.variants) ? product.variants.map((variant, variantIndex) => {
        if (!variant || typeof variant !== "object") throw new Error(`Product ${index + 1} has invalid variant data`);
        const item = variant as Record<string, unknown>;
        const name = typeof item.name === "string" ? item.name.trim() : "";
        const variantAvailability = typeof item.availability === "string" ? item.availability : "";
        if (!name || !VALID_AVAILABILITY.has(variantAvailability)) throw new Error(`Product ${index + 1} has invalid variant ${variantIndex + 1}`);
        return { id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `variant-${crypto.randomUUID()}`, name, availability: variantAvailability, image: typeof item.image === "string" && item.image ? item.image : undefined };
      }) : [],
      image: typeof product.image === "string" ? product.image : "/assets/placeholder.svg",
      featured: Boolean(product.featured),
      newestRank: Number.isFinite(Number(product.newestRank)) ? Number(product.newestRank) : 1,
      archived: Boolean(product.archived),
    };
  });
  return normalized as CatalogProductRecord[];
};

export const createApp = () => {
  const app = express();

  const staticPath = path.resolve(__dirname, "public");

  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  // Admin authentication has been removed; all admin routes are open.
  const requireAdmin = (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    next();
  };

  app.get("/api/catalog", async (_req, res) => {
    try {
      const catalog = await readCatalog();
      res.json(catalog);
    } catch (error) {
      console.error("Failed to load catalog:", error);
      res.status(500).json({ error: "Failed to load catalog" });
    }
  });

  app.get("/api/admin/catalog", requireAdmin, async (_req, res) => {
    try {
      const catalog = await readCatalog();
      res.json(catalog);
    } catch (error) {
      console.error("Failed to load admin catalog:", error);
      res.status(500).json({ error: "Failed to load catalog" });
    }
  });

  app.put("/api/admin/catalog", requireAdmin, async (req, res) => {
    const payload = req.body as { products?: CatalogProductRecord[]; metadata?: typeof DEFAULT_CATALOG.metadata };
    if (!Array.isArray(payload.products)) {
      res.status(400).json({ error: "Invalid catalog payload" });
      return;
    }

    let products: CatalogProductRecord[];
    try {
      products = validateProducts(payload.products);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid product data" });
      return;
    }

    const catalog = {
      products,
      metadata: {
        categories: [...VALID_CATEGORIES].sort(),
        brands: Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
        flavors: Array.from(new Set(products.flatMap((product) => product.keywords))).sort(),
      },
    };

    try {
      await writeCatalog(catalog);
      res.json(catalog);
    } catch (error) {
      console.error("Failed to save catalog:", error);
      res.status(500).json({ error: "Failed to save catalog. Please try again." });
    }
  });

  app.use(express.static(staticPath, { maxAge: "1h" }));

  app.get("/admin", requireAdmin, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  return app;
};

const startServer = () => {
  const app = createApp();
  const server = createServer(app);
  const port = Number(process.env.PORT) || 3000;

  server.listen(port, () => {
    console.log(`AL SAQAR server running on http://localhost:${port}/`);
  });
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}

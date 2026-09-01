import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { sql } from "@vercel/postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = process.env.CATALOG_DATA_FILE || path.resolve(__dirname, "..", "data", "catalog.json");
const SESSION_SECRET_FILE = path.resolve(path.dirname(DATA_FILE), ".admin-session-secret");

const COOKIE_NAME = "al_saqaar_admin_session";
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

const DEFAULT_CATALOG: CatalogData = {
  products: [],
  metadata: { categories: [], brands: [], flavors: [] }
};

const ensureDataFile = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CATALOG, null, 2), "utf8");
  }
};

const readCatalogFromDisk = (): CatalogData => {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as { products?: unknown[]; metadata?: { categories?: string[]; brands?: string[]; flavors?: string[] } };
    if (!parsed || !Array.isArray(parsed.products)) {
      return DEFAULT_CATALOG;
    }
    return { products: parsed.products as CatalogProductRecord[], metadata: { categories: parsed.metadata?.categories ?? DEFAULT_CATALOG.metadata.categories, brands: parsed.metadata?.brands ?? DEFAULT_CATALOG.metadata.brands, flavors: parsed.metadata?.flavors ?? DEFAULT_CATALOG.metadata.flavors } };
  } catch {
    return DEFAULT_CATALOG;
  }
};

const writeCatalogToDisk = (catalog: CatalogData) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(catalog, null, 2), "utf8");
};

const readCatalog = async (): Promise<CatalogData> => {
  if (process.env.POSTGRES_URL) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS catalog_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`;
      const result = await sql<{ value: CatalogData }>`SELECT value FROM catalog_store WHERE key = 'catalog';`;
      if (result.rows[0]?.value) {
        const catalog = result.rows[0].value as CatalogData;
        if (Array.isArray(catalog.products)) {
          return catalog;
        }
      }
    } catch (error) {
      console.warn("Falling back to disk catalog storage because Postgres is unavailable:", error);
    }
  }
  return readCatalogFromDisk();
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

const VALID_CATEGORIES = new Set(["hookahs", "tobacco", "smokingDevices", "accessories", "electronicDevices", "charcoalMore"]);
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
    if (!VALID_CATEGORIES.has(category)) throw new Error(`Product ${index + 1} has an invalid category`);
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

const getSessionSecret = () => {
  const envSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (envSecret) return envSecret;
  
  if (fs.existsSync(SESSION_SECRET_FILE)) {
    return fs.readFileSync(SESSION_SECRET_FILE, "utf8").trim();
  }
  
  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(SESSION_SECRET_FILE, generated, { encoding: "utf8", mode: 0o600 });
  return generated;
};

const getAdminCredentials = () => {
  // Production credentials - hardcoded as fallback, can be overridden by env vars
  const defaultUsername = "saqar_admin";
  const defaultPassword = "Admin_03C1CCDE6759C3D906B71621!Sq2026";
  
  // Try environment variables first
  const envUsername = process.env.ADMIN_USERNAME?.trim();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  
  // Use env vars if both are set and non-empty, otherwise use defaults
  if (envUsername && envPassword) {
    return { username: envUsername, password: envPassword };
  }
  
  // Fallback to hardcoded production credentials
  return { username: defaultUsername, password: defaultPassword };
};

const getSessionHash = (sessionSecret: string, username: string, password: string) => crypto.createHmac("sha256", sessionSecret).update(`${username}:${password}`).digest("hex");

export const createApp = () => {
  const app = express();
  ensureDataFile();
  const sessionSecret = getSessionSecret();

  const staticPath = path.resolve(__dirname, "public");

  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });

  app.post("/api/admin/login", (req, res) => {
    const submittedUsername = String(req.body?.username ?? "").trim();
    const submittedPassword = String(req.body?.password ?? "").trim();
    
    // Read credentials fresh on every request
    const { username: expectedUsername, password: expectedPassword } = getAdminCredentials();
    
    // Validate credentials
    if (submittedUsername !== expectedUsername || submittedPassword !== expectedPassword) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Create session token and set cookie
    const sessionToken = getSessionHash(sessionSecret, submittedUsername, submittedPassword);
    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    });

    // Send success response
    res.json({ ok: true, username: submittedUsername });
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ ok: true });
  });

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Temporary: Allow bypassing authentication if ADMIN_AUTH_DISABLED is set to true
    const authDisabled = process.env.ADMIN_AUTH_DISABLED === "true";
    if (authDisabled) {
      console.log("[AUTH] Bypassing authentication - ADMIN_AUTH_DISABLED is set to true");
      next();
      return;
    }

    const cookieHeader = req.headers.cookie ?? "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((entry) => {
        const index = entry.indexOf("=");
        const key = index >= 0 ? entry.slice(0, index).trim() : entry.trim();
        const value = index >= 0 ? decodeURIComponent(entry.slice(index + 1).trim()) : "";
        return [key, value];
      }).filter(([key]) => Boolean(key))
    );

    const token = cookies[COOKIE_NAME];
    const { username, password } = getAdminCredentials();
    if (!token || token !== getSessionHash(sessionSecret, username, password)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };

  app.get("/api/catalog", async (_req, res) => {
    const catalog = await readCatalog();
    res.json(catalog);
  });

  app.get("/api/admin/catalog", requireAdmin, async (_req, res) => {
    const catalog = await readCatalog();
    res.json(catalog);
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
        categories: Array.from(new Set(products.map((product) => product.category))).sort(),
        brands: Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
        flavors: Array.from(new Set(products.flatMap((product) => product.keywords))).sort(),
      },
    };

    await writeCatalog(catalog);
    res.json(catalog);
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

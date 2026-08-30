import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { CatalogProduct } from "../../client/src/lib/catalog";

const adminUsername = "test-owner";
const adminPassword = crypto.randomUUID();
const sessionSecret = crypto.randomUUID();
const tempDirectory = mkdtempSync(path.join(tmpdir(), "al-saqar-admin-"));
const catalogFile = path.join(tempDirectory, "catalog.json");
const catalogSeed = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../data/catalog.json"), "utf8")) as { products: CatalogProduct[] };
writeFileSync(catalogFile, JSON.stringify({ products: catalogSeed.products, metadata: { categories: [], brands: [], flavors: [] } }), "utf8");
process.env.ADMIN_USERNAME = adminUsername;
process.env.ADMIN_PASSWORD = adminPassword;
process.env.ADMIN_SESSION_SECRET = sessionSecret;
process.env.CATALOG_DATA_FILE = catalogFile;

const { createApp } = await import("../index");

describe("admin catalog API", () => {
  let server: Server;
  let baseUrl: string;
  let cookie = "";

  beforeAll(async () => {
    server = createServer(createApp());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("requires authentication and logs the owner in", async () => {
    const unauthorized = await fetch(`${baseUrl}/api/admin/catalog`);
    expect(unauthorized.status).toBe(401);
    const privatePage = await fetch(`${baseUrl}/admin`);
    expect(privatePage.status).toBe(401);

    const login = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: adminUsername, password: adminPassword }),
    });
    expect(login.status).toBe(200);
    cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(cookie).toContain("al_saqaar_admin_session=");
  });

  it("supports CRUD and persists the result for the public catalog", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`, { headers: { Cookie: cookie } });
    const original = await read.json() as { products: CatalogProduct[] };
    const variants = Array.from({ length: 11 }, (_, index) => ({ id: `variant-${index + 1}`, name: `Flavor ${index + 1}`, availability: index === 10 ? "out_of_stock" as const : "available" as const }));
    const updated = { ...original.products[0], name: "Updated browser-safe product", priceAED: 125, brand: "Updated brand", shortDescription: "Updated short description", detailedDescription: "Updated detailed description", availability: "available" as const, keywords: ["mint"], variants };
    const created = { ...updated, id: "test-product", name: "Created test product" };
    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ products: [updated, created, ...original.products.slice(1)] }),
    });
    expect(save.status).toBe(200);

    const publicAfterSave = await fetch(`${baseUrl}/api/catalog`);
    const savedCatalog = await publicAfterSave.json() as { products: CatalogProduct[] };
    expect(savedCatalog.products.find((product) => product.id === updated.id)).toMatchObject({ name: updated.name, priceAED: 125 });
    const savedUpdated = savedCatalog.products.find((product) => product.id === updated.id);
    expect(savedUpdated?.variants).toHaveLength(11);
    expect(savedUpdated?.variants?.[10]).toMatchObject({ name: "Flavor 11", availability: "out_of_stock" });
    expect(savedCatalog.products.some((product) => product.id === created.id)).toBe(true);

    const remove = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ products: savedCatalog.products.filter((product) => product.id !== created.id && product.id !== updated.id).concat({ ...original.products[0] }) }),
    });
    expect(remove.status).toBe(200);
    const persisted = JSON.parse(readFileSync(catalogFile, "utf8")) as { products: CatalogProduct[] };
    expect(persisted.products.some((product) => product.id === created.id)).toBe(false);
    expect(persisted.products.find((product) => product.id === original.products[0].id)?.name).toBe(original.products[0].name);
    expect(persisted.products.find((product) => product.id === original.products[0].id)?.variants).toEqual(original.products[0].variants);
  });

  it("rejects invalid prices and duplicate IDs", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`, { headers: { Cookie: cookie } });
    const original = await read.json() as { products: CatalogProduct[] };
    const invalidPrice = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ products: [{ ...original.products[0], priceAED: -1 }] }),
    });
    expect(invalidPrice.status).toBe(400);

    const duplicateId = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ products: [original.products[0], original.products[0]] }),
    });
    expect(duplicateId.status).toBe(400);

    const generatedId = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ products: [{ ...original.products[0], id: "", name: "Generated ID product" }] }),
    });
    expect(generatedId.status).toBe(200);
    const generatedCatalog = await generatedId.json() as { products: CatalogProduct[] };
    expect(generatedCatalog.products[0]?.id).toMatch(/^product-[0-9a-f-]{36}$/);
  });
});
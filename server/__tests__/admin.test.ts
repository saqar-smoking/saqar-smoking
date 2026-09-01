import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CatalogProduct } from "../../client/src/lib/catalog";

const tempDirectory = mkdtempSync(path.join(tmpdir(), "al-saqar-admin-"));
const catalogFile = path.join(tempDirectory, "catalog.json");
const catalogSeed = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../data/catalog.json"), "utf8")) as { products: CatalogProduct[] };
writeFileSync(catalogFile, JSON.stringify({ products: catalogSeed.products, metadata: { categories: [], brands: [], flavors: [] } }), "utf8");
process.env.CATALOG_DATA_FILE = catalogFile;

const { createApp } = await import("../index");

const ALL_CATEGORIES = ["accessories", "charcoalMore", "electronicDevices", "hookahs", "smokingDevices", "tobacco"];

describe("admin catalog API", () => {
  let server: Server;
  let baseUrl: string;

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

  it("allows open access to the admin page and API", async () => {
    const open = await fetch(`${baseUrl}/api/admin/catalog`);
    expect(open.status).toBe(200);
    const privatePage = await fetch(`${baseUrl}/admin`);
    expect(privatePage.status).not.toBe(401);
    expect(privatePage.status).not.toBe(403);
  });

  it("always returns every valid category for the dropdown, even when the stored catalog has none", async () => {
    const publicCatalog = await fetch(`${baseUrl}/api/catalog`);
    const publicPayload = await publicCatalog.json() as { metadata: { categories: string[] } };
    expect(publicPayload.metadata.categories).toEqual(ALL_CATEGORIES);

    const adminCatalog = await fetch(`${baseUrl}/api/admin/catalog`);
    const adminPayload = await adminCatalog.json() as { metadata: { categories: string[] } };
    expect(adminPayload.metadata.categories).toEqual(ALL_CATEGORIES);
  });

  it("keeps returning all categories after saving products that only use one category", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    const singleCategoryProduct = { ...original.products[0], category: "hookahs" as const };

    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [singleCategoryProduct] }),
    });
    expect(save.status).toBe(200);
    const saved = await save.json() as { metadata: { categories: string[] } };
    expect(saved.metadata.categories).toEqual(ALL_CATEGORIES);

    // restore the original catalog for the remaining tests
    await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: original.products }),
    });
  });

  it("supports CRUD and persists the result for the public catalog", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    const variants = Array.from({ length: 11 }, (_, index) => ({ id: `variant-${index + 1}`, name: `Flavor ${index + 1}`, availability: index === 10 ? "out_of_stock" as const : "available" as const }));
    const updated = { ...original.products[0], name: "Updated browser-safe product", priceAED: 125, brand: "Updated brand", shortDescription: "Updated short description", detailedDescription: "Updated detailed description", availability: "available" as const, keywords: ["mint"], variants };
    const created = { ...updated, id: "test-product", name: "Created test product" };
    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: savedCatalog.products.filter((product) => product.id !== created.id && product.id !== updated.id).concat({ ...original.products[0] }) }),
    });
    expect(remove.status).toBe(200);
    const persisted = JSON.parse(readFileSync(catalogFile, "utf8")) as { products: CatalogProduct[] };
    expect(persisted.products.some((product) => product.id === created.id)).toBe(false);
    expect(persisted.products.find((product) => product.id === original.products[0].id)?.name).toBe(original.products[0].name);
    expect(persisted.products.find((product) => product.id === original.products[0].id)?.variants).toEqual(original.products[0].variants);
  });

  it("rejects invalid prices and duplicate IDs", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    const invalidPrice = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [{ ...original.products[0], priceAED: -1 }] }),
    });
    expect(invalidPrice.status).toBe(400);

    const duplicateId = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [original.products[0], original.products[0]] }),
    });
    expect(duplicateId.status).toBe(400);

    const generatedId = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [{ ...original.products[0], id: "", name: "Generated ID product" }] }),
    });
    expect(generatedId.status).toBe(200);
    const generatedCatalog = await generatedId.json() as { products: CatalogProduct[] };
    expect(generatedCatalog.products[0]?.id).toMatch(/^product-[0-9a-f-]{36}$/);
  });

  it("creates and updates a product with an electronicDevices category and a base64 uploaded image", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    // ~350KB of base64 data, representative of a real uploaded photo.
    const base64Image = `data:image/png;base64,${"A".repeat(350_000)}`;
    const created = {
      ...original.products[0],
      id: "electronic-device-test",
      name: "Vape kit",
      category: "electronicDevices" as const,
      image: base64Image,
    };

    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [created, ...original.products] }),
    });
    expect(save.status).toBe(200);
    const saved = await save.json() as { products: CatalogProduct[] };
    const savedProduct = saved.products.find((product) => product.id === created.id);
    expect(savedProduct?.category).toBe("electronicDevices");
    expect(savedProduct?.image).toBe(base64Image);

    const updated = { ...created, name: "Vape kit (updated)", image: `data:image/jpeg;base64,${"B".repeat(350_000)}` };
    const update = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [updated, ...original.products] }),
    });
    expect(update.status).toBe(200);
    const updatedCatalog = await update.json() as { products: CatalogProduct[] };
    const updatedProduct = updatedCatalog.products.find((product) => product.id === created.id);
    expect(updatedProduct?.name).toBe("Vape kit (updated)");
    expect(updatedProduct?.image).toBe(updated.image);

    // restore the original catalog for the remaining tests
    await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: original.products }),
    });
  });

  it("returns a descriptive JSON error instead of crashing when the payload is too large", async () => {
    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    // Comfortably over the server's 4MB body limit.
    const oversizedImage = `data:image/png;base64,${"A".repeat(5_000_000)}`;
    const tooLarge = { ...original.products[0], id: "too-large-test", image: oversizedImage };

    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [tooLarge] }),
    });
    expect(save.status).toBe(413);
    const payload = await save.json() as { error?: string };
    expect(typeof payload.error).toBe("string");
    expect(payload.error).toMatch(/too large/i);
  });
});
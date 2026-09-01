import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CatalogProduct } from "../../client/src/lib/catalog";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname: string, _body: unknown, options: { contentType?: string }) => ({
    url: `https://example-blob.public.blob.vercel-storage.com/${pathname}`,
    pathname,
    contentType: options.contentType,
  })),
}));

const tempDirectory = mkdtempSync(path.join(tmpdir(), "al-saqar-upload-"));
const catalogFile = path.join(tempDirectory, "catalog.json");
const catalogSeed = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../data/catalog.json"), "utf8")) as { products: CatalogProduct[] };
writeFileSync(catalogFile, JSON.stringify({ products: catalogSeed.products, metadata: { categories: [], brands: [], flavors: [] } }), "utf8");
process.env.CATALOG_DATA_FILE = catalogFile;
process.env.BLOB_READ_WRITE_TOKEN = "test-token";

const { createApp } = await import("../index");

describe("image upload API", () => {
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

  it("uploads a valid image and returns a hosted URL", async () => {
    const buffer = Buffer.from("fake-image-bytes");
    const response = await fetch(`${baseUrl}/api/admin/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: buffer,
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { url: string };
    expect(payload.url).toMatch(/^https:\/\/example-blob\.public\.blob\.vercel-storage\.com\/products\/.+\.jpeg$/);
  });

  it("rejects non-image content types", async () => {
    const response = await fetch(`${baseUrl}/api/admin/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "hello",
    });
    expect(response.status).toBe(400);
    const payload = await response.json() as { error?: string };
    expect(typeof payload.error).toBe("string");
  });

  it("rejects images that are still too large after compression", async () => {
    const oversized = Buffer.alloc(2_100_000, 1);
    const response = await fetch(`${baseUrl}/api/admin/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: oversized,
    });
    expect(response.status).toBe(413);
    const payload = await response.json() as { error?: string };
    expect(payload.error).toMatch(/too large/i);
  });

  it("persists an uploaded image URL through save, reload, and the public catalog", async () => {
    const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-image`, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: Buffer.from("abc"),
    });
    const { url } = await uploadResponse.json() as { url: string };

    const read = await fetch(`${baseUrl}/api/admin/catalog`);
    const original = await read.json() as { products: CatalogProduct[] };
    const updated = { ...original.products[0], image: url };

    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: [updated, ...original.products.slice(1)] }),
    });
    expect(save.status).toBe(200);

    const reload = await fetch(`${baseUrl}/api/admin/catalog`);
    const reloaded = await reload.json() as { products: CatalogProduct[] };
    expect(reloaded.products.find((product) => product.id === updated.id)?.image).toBe(url);

    const publicCatalog = await fetch(`${baseUrl}/api/catalog`);
    const publicPayload = await publicCatalog.json() as { products: CatalogProduct[] };
    expect(publicPayload.products.find((product) => product.id === updated.id)?.image).toBe(url);

    // restore the original catalog for isolation
    await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: original.products }),
    });
  });
});

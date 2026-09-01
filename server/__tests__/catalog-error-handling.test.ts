import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Point CATALOG_DATA_FILE at a path whose parent directory is actually a file,
// so writes fail with ENOTDIR instead of succeeding. This reproduces the
// Vercel read-only filesystem failure that used to crash the PUT route.
const tempDirectory = mkdtempSync(path.join(tmpdir(), "al-saqar-catalog-error-"));
const notADirectory = path.join(tempDirectory, "not-a-directory");
writeFileSync(notADirectory, "", "utf8");
process.env.CATALOG_DATA_FILE = path.join(notADirectory, "catalog.json");

const { createApp } = await import("../index");

describe("catalog save failure handling", () => {
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
    if (server) {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("returns a JSON 500 instead of crashing when the catalog cannot be written", async () => {
    const save = await fetch(`${baseUrl}/api/admin/catalog`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: [{
          id: "test-product",
          category: "hookahs",
          name: "Test product",
          brand: "Brand",
          priceAED: 10,
          availability: "available",
          shortDescription: "",
          detailedDescription: "",
          specifications: [],
          keywords: [],
          variants: [],
          image: "/assets/placeholder.svg",
          featured: false,
          newestRank: 1,
          archived: false,
        }],
      }),
    });

    expect(save.status).toBe(500);
    const payload = await save.json() as { error?: string };
    expect(typeof payload.error).toBe("string");
  });
});

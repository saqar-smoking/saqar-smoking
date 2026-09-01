import { describe, expect, it, vi, afterEach } from "vitest";
import { uploadProductImage } from "../imageUpload";

describe("uploadProductImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the hosted URL on a successful upload", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ url: "https://blob.example.com/products/abc.jpg" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const url = await uploadProductImage(blob);

    expect(url).toBe("https://blob.example.com/products/abc.jpg");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/upload-image", expect.objectContaining({ method: "POST" }));
  });

  it("throws the server error message when the upload fails", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: "Image is too large" }), { status: 413 }));
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    await expect(uploadProductImage(blob)).rejects.toThrow("Image is too large");
  });

  it("throws a fallback error when the server response has no JSON body", async () => {
    const fetchMock = vi.fn(async () => new Response("Internal Server Error", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    await expect(uploadProductImage(blob)).rejects.toThrow(/server responded with 500/);
  });
});

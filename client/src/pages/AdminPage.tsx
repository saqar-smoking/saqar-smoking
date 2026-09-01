import { useEffect, useMemo, useState } from "react";
import type { CatalogProduct, CategoryKey, CatalogVariant } from "@/lib/catalog";
import { CATEGORY_KEYS, getCatalogSnapshot, syncCatalogProducts } from "@/lib/catalog";

const emptyProduct = (): CatalogProduct => ({
  id: "",
  category: "hookahs",
  name: "",
  brand: "",
  priceAED: null,
  availability: "on_request",
  shortDescription: "",
  detailedDescription: "",
  specifications: [],
  keywords: [],
  variants: [],
  image: "/assets/placeholder.svg",
  featured: false,
  newestRank: 1,
  archived: false,
});

const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const parseVariants = (value: string): CatalogVariant[] => value.split("\n").flatMap((line, index) => {
  const [name, availability = "on_request", image = ""] = line.split("|").map((item) => item.trim());
  return name ? [{ id: `variant-${index + 1}`, name, availability: availability as CatalogVariant["availability"], ...(image ? { image } : {}) }] : [];
});
const formatVariants = (variants: CatalogVariant[] = []) => variants.map((variant) => [variant.name, variant.availability, variant.image ?? ""].join(" | ")).join("\n");

// Admin auth has been removed; the dashboard is reachable directly at /admin.
export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<CatalogProduct>(emptyProduct());

  const catalogSummary = useMemo(() => getCatalogSnapshot(), [products]);

  const loadCatalog = async () => {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/catalog", { credentials: "same-origin" });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Unable to load catalog");
      }

      const payload = await response.json() as { products?: CatalogProduct[]; metadata?: { categories?: string[]; brands?: string[]; flavors?: string[] } };
      const nextProducts = Array.isArray(payload.products) ? payload.products : [];
      setProducts(nextProducts);
      syncCatalogProducts(nextProducts);
      if (nextProducts.length > 0) {
        setSelectedId(nextProducts[0].id);
        setDraft(nextProducts[0]);
      }
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : "Catalog could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const saveCatalog = async (nextProducts: CatalogProduct[]) => {
    const payload = {
      products: nextProducts,
      metadata: {
        categories: Array.from(new Set(nextProducts.map((product) => product.category))).sort(),
        brands: Array.from(new Set(nextProducts.map((product) => product.brand).filter(Boolean))).sort(),
        flavors: Array.from(new Set(nextProducts.flatMap((product) => product.keywords))).sort(),
      },
    };

    const response = await fetch("/api/admin/catalog", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error || `Save failed (server responded with ${response.status}).`);
    }

    const json = await response.json() as { products?: CatalogProduct[] };
    const refreshedProducts = json.products ?? nextProducts;
    setProducts(refreshedProducts);
    syncCatalogProducts(refreshedProducts);
    if (refreshedProducts.length > 0) {
      const match = refreshedProducts.find((product) => product.id === selectedId) ?? refreshedProducts[0];
      setSelectedId(match.id);
      setDraft(match);
    }
    return refreshedProducts;
  };

  const updateDraft = <K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const normalizedDraft: CatalogProduct = {
      ...draft,
      id: draft.id,
      category: draft.category as CategoryKey,
      brand: draft.brand.trim() || "Brand to confirm",
      name: draft.name.trim() || "Untitled product",
      shortDescription: draft.shortDescription.trim(),
      detailedDescription: draft.detailedDescription.trim(),
      specifications: parseList((draft.specifications ?? []).join(",")),
      keywords: parseList((draft.keywords ?? []).join(",")),
      variants: parseVariants(formatVariants(draft.variants)),
      priceAED: draft.priceAED === null || draft.priceAED === undefined ? null : Number(draft.priceAED),
      newestRank: Number(draft.newestRank) || 1,
      archived: Boolean(draft.archived),
      featured: Boolean(draft.featured),
      availability: draft.availability,
    };

    const nextProducts = products.some((product) => product.id === normalizedDraft.id)
      ? products.map((product) => product.id === normalizedDraft.id ? normalizedDraft : product)
      : [normalizedDraft, ...products];

    try {
      await saveCatalog(nextProducts);
      setNotice("Product saved successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The product could not be saved.");
    }
  };

  const handleArchive = async (id: string) => {
    const nextProducts = products.map((product) => product.id === id ? { ...product, archived: !product.archived } : product);
    try {
      await saveCatalog(nextProducts);
      setNotice("Catalog status updated.");
    } catch {
      setNotice("Could not update catalog status.");
    }
  };

  const handleDelete = async (id: string) => {
    const nextProducts = products.filter((product) => product.id !== id);
    try {
      await saveCatalog(nextProducts);
      setNotice("Product removed from the catalog.");
    } catch {
      setNotice("Could not delete the product.");
    }
  };

  const handleNewProduct = () => {
    const nextDraft = emptyProduct();
    setSelectedId(nextDraft.id);
    setDraft(nextDraft);
    setNotice("Creating a new catalog item.");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateDraft("image", result || "/assets/placeholder.svg");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f2eb", color: "#1f1c1a", padding: 32 }}>
      <div style={{ maxWidth: 1380, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ textTransform: "uppercase", letterSpacing: 2, fontSize: 12, opacity: 0.8 }}>AL SAQAR</p>
            <h1 style={{ margin: 0, fontSize: 36 }}>Catalog dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ background: "#efe2cb", padding: "8px 12px", borderRadius: 999, fontWeight: 600 }}>{catalogSummary.products.length} live products</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          <aside style={{ background: "#fffaf2", border: "1px solid #d8c8a9", borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Products</h2>
              <button onClick={handleNewProduct} style={{ background: "#2a261f", color: "#f8f1e6", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>Add Product</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {products.filter((product) => !product.archived).map((product) => (
                <button key={product.id} onClick={() => { setSelectedId(product.id); setDraft(product); }} style={{ textAlign: "left", background: product.id === selectedId ? "#efe1c6" : "#f5efe7", border: "1px solid #d9c9a5", borderRadius: 12, padding: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{product.name || "Untitled"}</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{product.availability}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{product.brand} · {product.category}</div>
                </button>
              ))}
            </div>
          </aside>

          <section style={{ background: "#fffaf2", border: "1px solid #d8c8a9", borderRadius: 18, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ margin: 0 }}>Product editor</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => void handleArchive(draft.id)} style={{ background: "#efe3d0", color: "#2a261f", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>{draft.archived ? "Restore" : "Archive"}</button>
                <button onClick={() => void handleDelete(draft.id)} style={{ background: "#9b2f29", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Delete</button>
                <button onClick={handleSave} style={{ background: "#201d1b", color: "#f7f0e7", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Save</button>
              </div>
            </div>

            {notice ? <p style={{ marginBottom: 12, color: "#7d3d2d" }}>{notice}</p> : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span>Name</span>
                <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span>Brand</span>
                <input value={draft.brand} onChange={(event) => updateDraft("brand", event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span>Category</span>
                <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as CategoryKey)} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }}>
                  {CATEGORY_KEYS.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span>Availability</span>
                <select value={draft.availability} onChange={(event) => updateDraft("availability", event.target.value as CatalogProduct["availability"])} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }}>
                  <option value="on_request">On request</option>
                  <option value="available">Available</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span>Price (AED)</span>
                <input value={draft.priceAED ?? ""} onChange={(event) => updateDraft("priceAED", event.target.value === "" ? null : Number(event.target.value))} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span>New rank</span>
                <input type="number" value={draft.newestRank} onChange={(event) => updateDraft("newestRank", Number(event.target.value))} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Image URL</span>
                <input value={draft.image} onChange={(event) => updateDraft("image", event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, gridColumn: "1 / -1" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 12px", borderRadius: 10, background: "#efe2cb" }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <span>Upload image</span>
                </label>
                {draft.image ? <img src={draft.image} alt={draft.name || "Product preview"} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid #d9c9a5" }} /> : null}
              </div>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Short description</span>
                <textarea value={draft.shortDescription} onChange={(event) => updateDraft("shortDescription", event.target.value)} style={{ minHeight: 80, padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Detailed description</span>
                <textarea value={draft.detailedDescription} onChange={(event) => updateDraft("detailedDescription", event.target.value)} style={{ minHeight: 120, padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Specifications (comma separated)</span>
                <textarea value={(draft.specifications ?? []).join(", ")} onChange={(event) => updateDraft("specifications", parseList(event.target.value))} style={{ minHeight: 70, padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Keywords / flavors (comma separated)</span>
                <textarea value={(draft.keywords ?? []).join(", ")} onChange={(event) => updateDraft("keywords", parseList(event.target.value))} style={{ minHeight: 70, padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "grid", gap: 8, gridColumn: "1 / -1" }}>
                <span>Flavors / variants (one per line: name | availability | optional image URL)</span>
                <textarea value={formatVariants(draft.variants)} onChange={(event) => updateDraft("variants", parseVariants(event.target.value))} style={{ minHeight: 120, padding: 10, borderRadius: 10, border: "1px solid #d2bf9c" }} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={draft.featured} onChange={(event) => updateDraft("featured", event.target.checked)} />
                <span>Featured</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={Boolean(draft.archived)} onChange={(event) => updateDraft("archived", event.target.checked)} />
                <span>Archived</span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

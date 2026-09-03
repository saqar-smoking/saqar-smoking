import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AgeGateGuard, CommerceHeader, ProductCard } from "@/components/CommerceShell";
import { catalogProducts, CATEGORY_KEYS, fetchCatalogProducts, type CategoryKey, type CatalogProduct } from "@/lib/catalog";
import { categoryLabels } from "@/lib/translations";
import { useCommerce } from "@/contexts/CommerceContext";

const normalizeCategoryValue = (value: string | null | undefined): CategoryKey | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith("category-") ? trimmed.slice("category-".length) : trimmed;
  return CATEGORY_KEYS.includes(withoutPrefix as CategoryKey) ? (withoutPrefix as CategoryKey) : null;
};

export default function ShopPage() {
  const { language, t } = useCommerce();
  const [, routeParams] = useRoute("/shop/:category?");
  const pathCategory = normalizeCategoryValue(routeParams?.category ?? null);
  const queryCategory = normalizeCategoryValue(new URLSearchParams(window.location.search).get("category"));
  const initialCategory = pathCategory ?? queryCategory ?? null;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | "all">(initialCategory ?? "all");
  const [brand, setBrand] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>(catalogProducts);

  useEffect(() => {
    const nextCategory = normalizeCategoryValue(routeParams?.category ?? new URLSearchParams(window.location.search).get("category"));
    setCategory(nextCategory ?? "all");
  }, [routeParams?.category]);

  useEffect(() => {
    void fetchCatalogProducts().then((nextProducts) => setProducts(nextProducts.filter((product) => !product.archived)));
  }, []);

  const brands = Array.from(new Set(products.map((product) => product.brand)));

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Number.POSITIVE_INFINITY;
    const filtered = products.filter((product) => {
      const searchable = [product.name, product.brand, product.category, ...product.keywords, ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant.name) : [])].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesAvailability = availability === "all" || product.availability === availability;
      const matchesMin = product.priceAED === null || product.priceAED >= min;
      const matchesMax = product.priceAED === null || product.priceAED <= max;
      return matchesQuery && matchesCategory && matchesBrand && matchesAvailability && matchesMin && matchesMax;
    });
    return [...filtered].sort((a, b) => sort === "priceLow" ? (a.priceAED ?? Number.POSITIVE_INFINITY) - (b.priceAED ?? Number.POSITIVE_INFINITY) : sort === "priceHigh" ? (b.priceAED ?? -1) - (a.priceAED ?? -1) : sort === "newest" ? b.newestRank - a.newestRank : Number(b.featured) - Number(a.featured));
  }, [availability, brand, category, maxPrice, minPrice, products, query, sort]);

  const clear = () => { setQuery(""); setCategory("all"); setBrand("all"); setAvailability("all"); setMinPrice(""); setMaxPrice(""); setSort("featured"); };
  return <AgeGateGuard><div className="commerce-shell"><CommerceHeader /><main className="commerce-main">
    <div className="commerce-frame commerce-breadcrumb"><Link href="/"><ArrowLeft size={14} /> {t.home}</Link><span>/</span><strong>{t.shop}</strong></div>
    <section className="commerce-hero"><div className="commerce-frame"><span className="commerce-eyebrow">01 / {t.browseCollection}</span><h1>{t.browseCollection}<em>.</em></h1><p>{t.placeholderNotice}</p></div></section>
    <section className="commerce-frame shop-content">
      <div className="shop-toolbar"><label className="shop-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.search} /></label><button className="mobile-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> {t.filters}</button><div className="shop-result-count">{filteredProducts.length} {t.results}</div></div>
      <div className="shop-layout">
        <aside className={`shop-filters ${filtersOpen ? "shop-filters--open" : ""}`}><div className="shop-filters__header"><h2>{t.filters}</h2><button onClick={() => setFiltersOpen(false)} aria-label={t.clearFilters}><X size={18} /></button></div>
          <label>{t.category}<span className="select-wrap"><select value={category} onChange={(event) => setCategory(event.target.value as CategoryKey | "all")}><option value="all">{t.allCategories}</option>{CATEGORY_KEYS.map((key) => <option key={key} value={key}>{categoryLabels[language][key]}</option>)}</select><ChevronDown size={14} /></span></label>
          <label>{t.brand}<span className="select-wrap"><select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">{t.allBrands}</option>{brands.map((value) => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={14} /></span></label>
          <label>{t.availability}<span className="select-wrap"><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">{t.availability}</option><option value="on_request">{t.onRequest}</option><option value="available">{t.available}</option><option value="out_of_stock">{t.outOfStock}</option></select><ChevronDown size={14} /></span></label>
          <fieldset><legend>{t.priceRange}</legend><div className="price-inputs"><input inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder={t.minPrice} aria-label={t.minPrice} /><span>—</span><input inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder={t.maxPrice} aria-label={t.maxPrice} /></div></fieldset>
          <button className="filter-clear" onClick={clear}><Filter size={14} /> {t.clearFilters}</button>
        </aside>
        <div className="shop-results"><div className="shop-sort"><span>{t.sortBy}</span><span className="select-wrap"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">{t.featured}</option><option value="priceLow">{t.priceLowHigh}</option><option value="priceHigh">{t.priceHighLow}</option><option value="newest">{t.newest}</option></select><ChevronDown size={14} /></span></div>{filteredProducts.length > 0 ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-products"><SlidersHorizontal size={28} /><h2>{t.noResults}</h2><button className="commerce-button commerce-button--dark" onClick={clear}>{t.clearFilters}</button></div>}</div>
      </div>
    </section>
  </main></div></AgeGateGuard>;
}

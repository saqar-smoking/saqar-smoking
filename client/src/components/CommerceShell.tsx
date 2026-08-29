import { useState } from "react";
import { Check, ChevronDown, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Link } from "wouter";
import { useCommerce } from "@/contexts/CommerceContext";

export const LOGO_URL = "/assets/logo.svg";
export const WHATSAPP_URL = "https://wa.me/971526179396";
export const PHONE_URL = "tel:+971526179396";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <span className={`commerce-brand ${inverse ? "commerce-brand--inverse" : ""}`}><img src={LOGO_URL} alt="" /><span><strong>AL SAQAR</strong><small>SMOKING SHOP</small></span></span>;
}

export function CommerceHeader() {
  const { t, language, setLanguage, cartCount } = useCommerce();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <header className="commerce-header">
    <div className="commerce-frame commerce-header__inner">
      <Link href="/"><Brand /></Link>
      <nav className="commerce-nav"><Link href="/">{t.home}</Link><Link href="/shop">{t.shop}</Link><Link href="/#about">{t.about}</Link><Link href="/#contact">{t.contact}</Link></nav>
      <div className="commerce-header__actions">
        <div className="commerce-language"><button onClick={() => setOpen(!open)} aria-expanded={open}>{language.toUpperCase()} <ChevronDown size={14} /></button>{open && <div className="commerce-language__menu">{(["en", "ar", "fa"] as const).map((value) => <button key={value} onClick={() => { setLanguage(value); setOpen(false); }}>{value.toUpperCase()} {language === value && <Check size={13} />}</button>)}</div>}</div>
        <Link href="/cart" className="commerce-cart-link"><ShoppingBag size={18} /><span>{t.cart}</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
        <a className="commerce-header__wa" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle size={16} /> <span>{t.whatsappOrder}</span></a>
        <button className="commerce-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">{mobileOpen ? <X size={22} /> : <span>☰</span>}</button>
      </div>
    </div>{mobileOpen && <nav className="commerce-nav--mobile"><Link href="/" onClick={() => setMobileOpen(false)}>{t.home}</Link><Link href="/shop" onClick={() => setMobileOpen(false)}>{t.shop}</Link><Link href="/#about" onClick={() => setMobileOpen(false)}>{t.about}</Link><Link href="/#contact" onClick={() => setMobileOpen(false)}>{t.contact}</Link></nav>}
  </header>;
}

export function AgeGateGuard({ children }: { children: React.ReactNode }) {
  const { t } = useCommerce();
  const [approved, setApproved] = useState(() => localStorage.getItem("al-saqaar-age-approved") === "true");
  if (!approved) return <div className="commerce-age-gate"><div className="commerce-age-gate__backdrop" /><div className="commerce-age-gate__panel"><img src={LOGO_URL} alt="AL SAQAR" /><span className="commerce-eyebrow">{t.adultsOnly}</span><h1>{languageGateTitle(t)}</h1><p>{languageGateText(t)}</p><div><button className="commerce-button commerce-button--dark" onClick={() => { localStorage.setItem("al-saqaar-age-approved", "true"); setApproved(true); }}>{t.accept18 || "I am 18+"} →</button><a href="https://www.google.com/">{t.exit || "Exit"}</a></div><small>{t.ageNote || "By entering, you confirm that you meet the legal age requirement."}</small></div></div>;
  return <>{children}</>;
}

function languageGateTitle(t: Record<string, string>) { return t.ageTitle || "A considered experience, for adults."; }
function languageGateText(t: Record<string, string>) { return t.ageText || "You must be 18 years of age or older to enter this website."; }

export function ProductCard({ product }: { product: import("@/lib/catalog").CatalogProduct }) {
  const { t, addToCart } = useCommerce();
  const [added, setAdded] = useState(false);
  const add = () => { addToCart(product.id); setAdded(true); window.setTimeout(() => setAdded(false), 1600); };
  return <article className="product-card"><Link href={`/product/${product.id}`} className="product-card__image"><img src={product.image} alt="" /><span>{product.featured ? t.featured : t.newest}</span></Link><div className="product-card__body"><div><small>{product.brand}</small><h3><Link href={`/product/${product.id}`}>{product.name}</Link></h3></div><strong>{product.priceAED === null ? t.priceToConfirm : `AED ${product.priceAED.toFixed(2)}`}</strong></div><div className="product-card__meta"><span className={product.availability === "out_of_stock" ? "is-unavailable" : ""}>{product.availability === "out_of_stock" ? t.outOfStock : t.onRequest}</span><button disabled={product.availability === "out_of_stock"} onClick={add}>{added ? t.addedToCart : t.addToCart}</button></div></article>;
}

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Instagram,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import {
  AgeGateGuard,
  CommerceHeader,
  INSTAGRAM_URL,
  WHATSAPP_URL,
  PHONE_URL,
} from "@/components/CommerceShell";
import {
  fetchCatalogProducts,
  formatAED,
  type CatalogProduct,
} from "@/lib/catalog";
import { categoryLabels } from "@/lib/translations";
import { useCommerce } from "@/contexts/CommerceContext";
import { FlavorSelector } from "@/components/FlavorSelector";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const { language, t, addToCart } = useCommerce();
  const [product, setProduct] = useState<CatalogProduct>();
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantId, setVariantId] = useState<string>();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    void fetchCatalogProducts().then(products => {
      setProduct(
        products.find(item => item.id === params.id && !item.archived)
      );
      setCatalogLoaded(true);
    });
  }, [params?.id]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (!catalogLoaded)
    return (
      <AgeGateGuard>
        <div className="commerce-shell">
          <CommerceHeader />
          <div className="commerce-empty-page">
            <h1>Loading...</h1>
          </div>
        </div>
      </AgeGateGuard>
    );
  if (!product)
    return (
      <AgeGateGuard>
        <div className="commerce-shell">
          <CommerceHeader />
          <div className="commerce-empty-page">
            <h1>{t.pageNotFound}</h1>
            <Link
              className="commerce-button commerce-button--dark"
              href="/shop"
            >
              {t.backHome}
            </Link>
          </div>
        </div>
      </AgeGateGuard>
    );

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const selectedVariant = variants.find(
    variant => variant.id === variantId
  );
  const orderUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(`${t.productInquiry}: ${product.name}${selectedVariant ? ` (${t.flavor}: ${selectedVariant.name})` : ""}`)}`;
  const orderOptions = [
    { label: "Instagram", href: INSTAGRAM_URL, icon: Instagram },
    { label: "WhatsApp", href: orderUrl, icon: MessageCircle },
    { label: "Call", href: PHONE_URL, icon: Phone },
  ];

  const add = () => {
    addToCart(product.id, quantity, variantId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };
  return (
    <AgeGateGuard>
      <div className="commerce-shell">
        <CommerceHeader />
        <main className="commerce-main commerce-product-page">
          <div className="commerce-frame commerce-breadcrumb">
            <Link href="/shop">
              <ArrowLeft size={14} /> {t.shop}
            </Link>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>
          <div className="commerce-frame product-detail">
            <div className="product-detail__visual">
              <img src={product.image} alt="" />
              <span className="product-detail__stamp">{t.adultsOnly}</span>
            </div>
            <div className="product-detail__content">
              <span className="commerce-eyebrow">
                {categoryLabels[language][product.category]} · {product.brand}
              </span>
              <h1>{product.name}</h1>
              <div className="product-detail__price">
                {formatAED(product.priceAED).replace(
                  "Price to confirm",
                  t.priceToConfirm
                )}
              </div>
              <div className="product-detail__availability">
                <span className="availability-dot" />{" "}
                <strong>{t.availability}</strong>{" "}
                {product.availability === "out_of_stock"
                  ? t.outOfStock
                  : t.onRequest}
              </div>
              <p className="product-detail__short">
                {product.shortDescription}
              </p>
              {variants.length ? (
                <FlavorSelector
                  productId={product.id}
                  variants={variants}
                  value={variantId}
                  onChange={setVariantId}
                />
              ) : null}
              <div className="product-detail__actions">
                <div className="quantity-control">
                  <span>{t.quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  className="commerce-button commerce-button--dark"
                  onClick={add}
                  disabled={product.availability === "out_of_stock"}
                >
                  <ShoppingBag size={16} />{" "}
                  {added ? t.addedToCart : t.addToCart}
                </button>
              </div>
              <div className="product-detail__order-menu" ref={menuRef}>
                <button
                  className="product-detail__order-trigger"
                  onClick={() => setMenuOpen(open => !open)}
                  type="button"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  ORDER <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <div
                    className="product-detail__order-panel"
                    role="menu"
                    aria-label="Order options"
                  >
                    {orderOptions.map(({ label, href, icon: Icon }) => (
                      <a
                        key={label}
                        className="product-detail__order-option"
                        href={href}
                        target={label === "Call" ? undefined : "_blank"}
                        rel={label === "Call" ? undefined : "noreferrer"}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="product-detail__order-option__icon">
                          <Icon size={15} />
                        </span>
                        <span>{label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="product-detail__description">
                <h2>{t.description}</h2>
                <p>{product.detailedDescription}</p>
              </div>
              <div className="product-specs">
                <h2>{t.specifications}</h2>
                {product.specifications.map(spec => (
                  <div key={spec}>
                    <Check size={14} />
                    {spec}
                  </div>
                ))}
              </div>
              <div className="placeholder-note">{t.placeholderNotice}</div>
            </div>
          </div>
        </main>
      </div>
    </AgeGateGuard>
  );
}

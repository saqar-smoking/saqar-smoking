import { useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AgeGateGuard, CommerceHeader, WHATSAPP_URL, PHONE_URL } from "@/components/CommerceShell";
import { getProduct, formatAED } from "@/lib/catalog";
import { categoryLabels } from "@/lib/translations";
import { useCommerce } from "@/contexts/CommerceContext";

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const { language, t, addToCart } = useCommerce();
  const product = params?.id ? getProduct(params.id) : undefined;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return <AgeGateGuard><div className="commerce-shell"><CommerceHeader /><div className="commerce-empty-page"><h1>{t.pageNotFound}</h1><Link className="commerce-button commerce-button--dark" href="/shop">{t.backHome}</Link></div></div></AgeGateGuard>;
  const orderUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(`${t.productInquiry}: ${product.name}`)}`;
  const add = () => { addToCart(product.id, quantity); setAdded(true); window.setTimeout(() => setAdded(false), 1500); };
  return <AgeGateGuard><div className="commerce-shell"><CommerceHeader /><main className="commerce-main commerce-product-page"><div className="commerce-frame commerce-breadcrumb"><Link href="/shop"><ArrowLeft size={14} /> {t.shop}</Link><span>/</span><strong>{product.name}</strong></div><div className="commerce-frame product-detail"><div className="product-detail__visual"><img src={product.image} alt="" /><span className="product-detail__stamp">{t.adultsOnly}</span></div><div className="product-detail__content"><span className="commerce-eyebrow">{categoryLabels[language][product.category]} · {product.brand}</span><h1>{product.name}</h1><div className="product-detail__price">{formatAED(product.priceAED).replace("Price to confirm", t.priceToConfirm)}</div><div className="product-detail__availability"><span className="availability-dot" /> <strong>{t.availability}</strong> {product.availability === "out_of_stock" ? t.outOfStock : t.onRequest}</div><p className="product-detail__short">{product.shortDescription}</p><div className="product-detail__actions"><div className="quantity-control"><span>{t.quantity}</span><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={15} /></button><strong>{quantity}</strong><button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><button className="commerce-button commerce-button--dark" onClick={add} disabled={product.availability === "out_of_stock"}><ShoppingBag size={16} /> {added ? t.addedToCart : t.addToCart}</button></div><a className="product-detail__wa" href={orderUrl} target="_blank" rel="noreferrer">{t.whatsappOrder} →</a><a className="product-detail__call" href={PHONE_URL}>{t.callToOrder}: 052 617 9396</a><div className="product-detail__description"><h2>{t.description}</h2><p>{product.detailedDescription}</p></div><div className="product-specs"><h2>{t.specifications}</h2>{product.specifications.map((spec) => <div key={spec}><Check size={14} />{spec}</div>)}</div><div className="placeholder-note">{t.placeholderNotice}</div></div></div></main></div></AgeGateGuard>;
}

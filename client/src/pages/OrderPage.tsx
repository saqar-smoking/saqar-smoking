import { ArrowLeft, ArrowUpRight, Instagram, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { CommerceHeader, INSTAGRAM_URL, PHONE_URL, WHATSAPP_URL } from "@/components/CommerceShell";
import { formatAED, getProduct } from "@/lib/catalog";
import { buildOrderWhatsAppMessage } from "@/lib/orderMessage";
import { useCommerce } from "@/contexts/CommerceContext";

export default function OrderPage() {
  const { t, cartProducts, subtotal } = useCommerce();
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");
  const requestedQuantity = Number.parseInt(params.get("quantity") ?? "1", 10);
  const product = productId ? getProduct(productId) : undefined;
  const lines = product
    ? [{ product, quantity: Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1 }]
    : cartProducts;
  const orderSubtotal = product ? (product.priceAED === null ? null : product.priceAED * lines[0]!.quantity) : subtotal;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const backHref = product ? `/product/${product.id}` : cartProducts.length > 0 ? "/cart" : "/shop";
  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(buildOrderWhatsAppMessage(t, lines, orderSubtotal))}`;

  return (
    <div className="commerce-shell">
        <CommerceHeader />
        <main className="commerce-main">
          <div className="commerce-frame commerce-breadcrumb">
            <Link href={backHref}>
              <ArrowLeft size={14} /> Back to shopping
            </Link>
            <span>/</span>
            <strong>Place Your Order</strong>
          </div>

          <section className="commerce-frame order-page">
            <div className="order-page__header">
              <div>
                <span className="commerce-eyebrow">Order</span>
                <h1>Place Your Order<em>.</em></h1>
              </div>
              <p>Online payment is currently unavailable. Please place your order using one of the contact options below.</p>
            </div>

            <div className="order-layout">
              <div className="order-panel">
                <div className="order-panel__header">
                  <h2>Order summary</h2>
                  <span>{itemCount} {itemCount === 1 ? t.item : t.items}</span>
                </div>

                {lines.length === 0 ? (
                  <div className="order-empty">
                    <ShoppingBag size={28} />
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="order-list">
                    {lines.map(({ product, quantity }) => (
                      <article className="order-item" key={`${product.id}-${quantity}`}>
                        <img src={product.image} alt={product.name} />
                        <div className="order-item__content">
                          <small>{product.brand}</small>
                          <h3>{product.name}</h3>
                          <span>Qty: {quantity}</span>
                        </div>
                        <strong>{product.priceAED === null ? t.priceToConfirm : `AED ${(product.priceAED * quantity).toFixed(2)}`}</strong>
                      </article>
                    ))}
                  </div>
                )}

                <div className="order-total">
                  <span>{t.total}</span>
                  <strong>{orderSubtotal === null ? t.priceToConfirm : `AED ${orderSubtotal.toFixed(2)}`}</strong>
                </div>
              </div>

              <aside className="order-panel order-panel--contact">
                <h2>Contact options</h2>
                <div className="order-contact-grid">
                  <a className="order-contact-card order-contact-card--whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                    <ArrowUpRight size={16} />
                  </a>

                  <a className="order-contact-card order-contact-card--instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    <Instagram size={18} />
                    <span>Instagram</span>
                    <ArrowUpRight size={16} />
                  </a>

                  <a className="order-contact-card order-contact-card--phone" href={PHONE_URL}>
                    <Phone size={18} />
                    <span>Phone</span>
                    <ArrowUpRight size={16} />
                  </a>
                </div>

                <div className="order-note">
                  <p>We will confirm the final details with you once you contact our team.</p>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
  );
}

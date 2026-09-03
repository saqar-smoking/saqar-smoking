import { FormEvent, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { CommerceHeader, WHATSAPP_URL } from "@/components/CommerceShell";
import { buildWhatsAppOrderMessage } from "@/lib/orderMessage";
import { useCommerce } from "@/contexts/CommerceContext";

export default function CheckoutPage() {
  const { t, cartProducts, subtotal } = useCommerce();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    residence: "",
    area: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const setField = (field: keyof typeof form, value: string) =>
    setForm(current => ({ ...current, [field]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError(t.validationName);
    if (!form.phone.trim()) return setError(t.validationPhone);
    if (!form.address.trim() || !form.area.trim())
      return setError(t.validationAddress);
    setError("");
    const message = buildWhatsAppOrderMessage(t, form, cartProducts, subtotal);
    window.open(
      `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <div className="commerce-shell">
      <CommerceHeader />
      <main className="commerce-main">
        <div className="commerce-frame commerce-breadcrumb">
          <Link href="/cart">
            <ArrowLeft size={14} /> {t.cart}
          </Link>
          <span>/</span>
          <strong>{t.checkout}</strong>
        </div>
        <section className="commerce-frame checkout-page">
          <div className="commerce-page-heading">
            <span className="commerce-eyebrow">03 / {t.checkout}</span>
            <h1>
              {t.checkoutTitle}
              <em>.</em>
            </h1>
          </div>
          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={submit}>
              <div className="checkout-form__section">
                <h2>{t.customerName}</h2>
                <div className="form-grid">
                  <label>
                    {t.customerName} <span>*</span>
                    <input
                      value={form.name}
                      onChange={event => setField("name", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    {t.phoneNumber} <span>*</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={event => setField("phone", event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    {t.whatsappNumber}
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={event =>
                        setField("whatsapp", event.target.value)
                      }
                      placeholder={form.phone || "+971 …"}
                    />
                  </label>
                </div>
              </div>
              <div className="checkout-form__section">
                <h2>{t.deliveryAddress}</h2>
                <div className="form-grid">
                  <label className="form-grid__wide">
                    {t.deliveryAddress} <span>*</span>
                    <input
                      value={form.address}
                      onChange={event =>
                        setField("address", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    {t.apartmentVilla}
                    <input
                      value={form.residence}
                      onChange={event =>
                        setField("residence", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    {t.area} <span>*</span>
                    <input
                      value={form.area}
                      onChange={event => setField("area", event.target.value)}
                      required
                    />
                  </label>
                  <label className="form-grid__wide">
                    {t.optionalNotes}
                    <textarea
                      value={form.notes}
                      onChange={event => setField("notes", event.target.value)}
                      placeholder={t.notesPlaceholder}
                    />
                  </label>
                </div>
              </div>
              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="commerce-button commerce-button--dark checkout-submit"
                type="submit"
              >
                <MessageCircle size={18} /> {t.placeOrder}
              </button>
              <p className="checkout-secure-note">{t.secureNote}</p>
            </form>
            <aside className="checkout-summary">
              <h2>{t.orderSummary}</h2>
              {cartProducts.map(({ product, quantity }) => (
                <div className="checkout-summary__line" key={product.id}>
                  <span>
                    {product.name}
                    <small>× {quantity}</small>
                  </span>
                  <strong>
                    {product.priceAED === null
                      ? t.priceToConfirm
                      : `AED ${(product.priceAED * quantity).toFixed(2)}`}
                  </strong>
                </div>
              ))}
              <div className="checkout-summary__total">
                <span>{t.total}</span>
                <strong>
                  {subtotal === null
                    ? t.priceToConfirm
                    : `AED ${subtotal.toFixed(2)}`}
                </strong>
              </div>
              <Link href="/cart">
                {t.cart} · {t.continueShopping}
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

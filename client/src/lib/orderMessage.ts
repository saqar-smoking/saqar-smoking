import { formatAED, type CatalogProduct } from "@/lib/catalog";
import type { CommerceCopy } from "@/lib/translations";

type CheckoutFields = { name: string; phone: string; whatsapp: string; address: string; residence: string; area: string; notes: string };
type OrderLine = { product: CatalogProduct; quantity: number };

export function buildWhatsAppOrderMessage(copy: CommerceCopy, fields: CheckoutFields, lines: OrderLine[], subtotal: number | null) {
  const items = lines.map(({ product, quantity }) => `- ${product.name} x ${quantity} — ${formatAED(product.priceAED).replace("Price to confirm", copy.priceToConfirm)}`).join("\n") || "- —";
  const total = subtotal === null ? copy.priceToConfirm : `AED ${subtotal.toFixed(2)}`;
  return [copy.orderMessageIntro, "", `${copy.orderMessageCustomer}: ${fields.name}`, `${copy.orderMessagePhone}: ${fields.phone}`, `${copy.orderMessageWhatsApp}: ${fields.whatsapp || fields.phone}`, `${copy.orderMessageAddress}: ${fields.address}`, `${copy.apartmentVilla}: ${fields.residence || "—"}`, `${copy.area}: ${fields.area}`, "", `${copy.orderMessageItems}:`, items, "", `${copy.orderMessageTotal}: ${total}`, fields.notes.trim() ? `${copy.orderMessageNotes}: ${fields.notes.trim()}` : ""].filter(Boolean).join("\n");
}

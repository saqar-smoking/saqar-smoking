import { describe, expect, it } from "vitest";
import { catalogProducts } from "../catalog";
import { commerceCopy } from "../translations";
import { buildWhatsAppOrderMessage } from "../orderMessage";
import { addLine, getCartSummary, removeLine, setLineQuantity } from "../cart";

describe("commerce catalog", () => {
  it("contains the six requested categories", () => {
    expect(new Set(catalogProducts.map((product) => product.category))).toEqual(new Set(["hookahs", "tobacco", "smokingDevices", "accessories", "electronicDevices", "charcoalMore"]));
  });

  it("does not invent an AED price for placeholder products", () => {
    expect(catalogProducts.every((product) => product.priceAED === null)).toBe(true);
  });
});

describe("cart operations", () => {
  it("adds and increments a line, then updates quantity and removes it", () => {
    const productId = catalogProducts[0]!.id;
    let cart = addLine([], productId);
    cart = addLine(cart, productId, 2);
    expect(getCartSummary(cart).cartCount).toBe(3);
    cart = setLineQuantity(cart, productId, 4);
    expect(getCartSummary(cart).cartCount).toBe(4);
    cart = removeLine(cart, productId);
    expect(getCartSummary(cart).cartCount).toBe(0);
  });

  it("calculates a priced subtotal and uses null while any price is unknown", () => {
    const pricedId = catalogProducts[0]!.id;
    const unknownId = catalogProducts[1]!.id;
    const pricedProduct = { ...catalogProducts[0]!, priceAED: 80 };
    const original = catalogProducts[0]!.priceAED;
    catalogProducts[0]!.priceAED = pricedProduct.priceAED;
    expect(getCartSummary([{ productId: pricedId, quantity: 2 }]).subtotal).toBe(160);
    expect(getCartSummary([{ productId: pricedId, quantity: 2 }, { productId: unknownId, quantity: 1 }]).subtotal).toBeNull();
    catalogProducts[0]!.priceAED = original;
  });
});

describe("WhatsApp order message", () => {
  it("includes customer details, products, quantities, prices, total, and notes", () => {
    const product = catalogProducts[0]!;
    const message = buildWhatsAppOrderMessage(commerceCopy.en, { name: "Amina", phone: "0500000000", whatsapp: "0500000001", address: "Dubai Marina", residence: "Villa 4", area: "Dubai Marina", notes: "Call before delivery" }, [{ product: { ...product, priceAED: 120 }, quantity: 2 }], 240);
    expect(message).toContain("Customer: Amina");
    expect(message).toContain("Phone: 0500000000");
    expect(message).toContain(`${product.name} x 2 — AED 120.00`);
    expect(message).toContain("Total: AED 240.00");
    expect(message).toContain("Notes: Call before delivery");
  });

  it("labels unknown prices for WhatsApp confirmation instead of fabricating totals", () => {
    const message = buildWhatsAppOrderMessage(commerceCopy.en, { name: "Amina", phone: "0500000000", whatsapp: "", address: "Dubai", residence: "", area: "Deira", notes: "" }, [{ product: catalogProducts[0]!, quantity: 1 }], null);
    expect(message).toContain("Price to confirm");
    expect(message).not.toContain("AED 0.00");
  });
});

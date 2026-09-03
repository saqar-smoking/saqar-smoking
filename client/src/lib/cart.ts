import { getProduct, type CatalogProduct, type CatalogVariant } from "@/lib/catalog";

export type CartLine = { productId: string; variantId?: string; quantity: number };
export type CartProductLine = { product: CatalogProduct; variant?: CatalogVariant; quantity: number };

export function addLine(cart: CartLine[], productId: string, quantity = 1, variantId?: string): CartLine[] {
  if (!getProduct(productId)) return cart;
  const safeQuantity = Math.max(1, quantity);
  const existing = cart.find((line) => line.productId === productId && line.variantId === variantId);
  const nextLine = variantId ? { productId, variantId, quantity: safeQuantity } : { productId, quantity: safeQuantity };
  return existing ? cart.map((line) => line.productId === productId && line.variantId === variantId ? { ...line, quantity: line.quantity + safeQuantity } : line) : [...cart, nextLine];
}

export function removeLine(cart: CartLine[], productId: string, variantId?: string): CartLine[] {
  return cart.filter((line) => !(line.productId === productId && line.variantId === variantId));
}

export function setLineQuantity(cart: CartLine[], productId: string, quantity: number, variantId?: string): CartLine[] {
  return quantity <= 0 ? removeLine(cart, productId, variantId) : cart.map((line) => line.productId === productId && line.variantId === variantId ? { ...line, quantity } : line);
}

export function getCartProducts(cart: CartLine[]): CartProductLine[] {
  return cart.flatMap((line) => {
    const product = getProduct(line.productId);
    const variant = line.variantId ? product?.variants?.find((item) => item.id === line.variantId) : undefined;
    return product && (!line.variantId || variant) ? [{ product, variant, quantity: line.quantity }] : [];
  });
}

export function getCartSummary(cart: CartLine[]) {
  const cartProducts = getCartProducts(cart);
  const cartCount = cartProducts.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartProducts.some((line) => line.product.priceAED === null) ? null : cartProducts.reduce((sum, line) => sum + (line.product.priceAED || 0) * line.quantity, 0);
  return { cartProducts, cartCount, subtotal };
}

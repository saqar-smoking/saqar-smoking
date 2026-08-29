import { getProduct, type CatalogProduct } from "@/lib/catalog";

export type CartLine = { productId: string; quantity: number };
export type CartProductLine = { product: CatalogProduct; quantity: number };

export function addLine(cart: CartLine[], productId: string, quantity = 1): CartLine[] {
  if (!getProduct(productId)) return cart;
  const safeQuantity = Math.max(1, quantity);
  const existing = cart.find((line) => line.productId === productId);
  return existing ? cart.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + safeQuantity } : line) : [...cart, { productId, quantity: safeQuantity }];
}

export function removeLine(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((line) => line.productId !== productId);
}

export function setLineQuantity(cart: CartLine[], productId: string, quantity: number): CartLine[] {
  return quantity <= 0 ? removeLine(cart, productId) : cart.map((line) => line.productId === productId ? { ...line, quantity } : line);
}

export function getCartProducts(cart: CartLine[]): CartProductLine[] {
  return cart.flatMap((line) => { const product = getProduct(line.productId); return product ? [{ product, quantity: line.quantity }] : []; });
}

export function getCartSummary(cart: CartLine[]) {
  const cartProducts = getCartProducts(cart);
  const cartCount = cartProducts.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartProducts.some((line) => line.product.priceAED === null) ? null : cartProducts.reduce((sum, line) => sum + (line.product.priceAED || 0) * line.quantity, 0);
  return { cartProducts, cartCount, subtotal };
}

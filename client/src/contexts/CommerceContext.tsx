import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { addLine, getCartSummary, removeLine, setLineQuantity, type CartLine, type CartProductLine } from "@/lib/cart";
import { commerceCopy, type Language } from "@/lib/translations";

type CartContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof commerceCopy.en;
  isRTL: boolean;
  cart: CartLine[];
  cartProducts: CartProductLine[];
  cartCount: number;
  subtotal: number | null;
  addToCart: (productId: string, quantity?: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
};

const CommerceContext = createContext<CartContextValue | null>(null);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("al-saqaar-language") as Language) || "en");
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem("al-saqaar-cart") || "[]") as CartLine[]; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("al-saqaar-language", language); document.documentElement.lang = language; document.documentElement.dir = language === "en" ? "ltr" : "rtl"; }, [language]);
  useEffect(() => { localStorage.setItem("al-saqaar-cart", JSON.stringify(cart)); }, [cart]);

  const addToCart = (productId: string, quantity = 1, variantId?: string) => setCart((current) => addLine(current, productId, quantity, variantId));
  const removeFromCart = (productId: string, variantId?: string) => setCart((current) => removeLine(current, productId, variantId));
  const setQuantity = (productId: string, quantity: number, variantId?: string) => setCart((current) => setLineQuantity(current, productId, quantity, variantId));
  const clearCart = () => setCart([]);
  const { cartProducts, cartCount, subtotal } = useMemo(() => getCartSummary(cart), [cart]);
  const value = useMemo(() => ({ language, setLanguage, t: commerceCopy[language], isRTL: language !== "en", cart, cartProducts, cartCount, subtotal, addToCart, removeFromCart, setQuantity, clearCart }), [language, cart, cartProducts, cartCount, subtotal]);
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}

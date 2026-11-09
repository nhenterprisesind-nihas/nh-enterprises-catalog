"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  mrp: number;
  retail_price: number;
  wholesale_price: number;
  images: string[];
  stock: number;
  originalRowIndex: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: "mrp" | "retail" | "wholesale";
}

interface SavedCartItem {
  name: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, priceType: "mrp" | "retail" | "wholesale") => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  reconcileProducts: (products: Product[]) => void;
  cartNotice: string | null;
  dismissCartNotice: () => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const MOQ_WHOLESALE = 10;
const CART_STORAGE_KEY = "nh-cart-v1";
const CART_UPDATE_NOTICE =
  "Some items in your cart were updated because prices or stock changed.";

export function getAvailableStock(stock: unknown): number {
  const parsedStock =
    typeof stock === "number"
      ? stock
      : typeof stock === "string" && stock.trim() !== ""
        ? Number(stock)
        : 0;

  return Number.isFinite(parsedStock) ? Math.max(0, Math.floor(parsedStock)) : 0;
}

function clampQuantity(quantity: number, stock: number): number {
  if (stock < 1) return 0;

  const parsedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(parsedQuantity, 1), stock);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [productsReconciled, setProductsReconciled] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const savedItemsRef = useRef<SavedCartItem[]>([]);
  const productsRef = useRef<Product[] | null>(null);
  const isHydratedRef = useRef(false);

  const reconcileSavedItems = useCallback((products: Product[]) => {
    const productsByName = new Map(
      products.map((product) => [product.name.trim().toLowerCase(), product])
    );
    let itemsWereUpdated = false;
    const reconciledItems: CartItem[] = [];

    for (const savedItem of savedItemsRef.current) {
      const product = productsByName.get(savedItem.name.trim().toLowerCase());
      const availableStock = product ? getAvailableStock(product.stock) : 0;
      if (!product || availableStock === 0) {
        itemsWereUpdated = true;
        continue;
      }

      const quantity = clampQuantity(savedItem.quantity, availableStock);
      if (quantity !== savedItem.quantity) {
        itemsWereUpdated = true;
      }
      reconciledItems.push({
        product,
        quantity,
        priceType: "retail",
      });
    }

    savedItemsRef.current = reconciledItems.map((item) => ({
      name: item.product.name.trim(),
      quantity: item.quantity,
    }));
    setItems(reconciledItems);
    if (itemsWereUpdated) {
      setCartNotice(CART_UPDATE_NOTICE);
    }
  }, []);

  const reconcileProducts = useCallback(
    (products: Product[]) => {
      productsRef.current = products;
      setProductsReconciled(true);
      if (isHydratedRef.current) {
        reconcileSavedItems(products);
      }
    },
    [reconcileSavedItems]
  );

  useEffect(() => {
    let savedItems: SavedCartItem[] = [];
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart !== null) {
        const parsed: unknown = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          savedItems = parsed.filter(
            (item): item is SavedCartItem =>
              typeof item === "object" &&
              item !== null &&
              "name" in item &&
              typeof item.name === "string" &&
              item.name.trim() !== "" &&
              "quantity" in item &&
              typeof item.quantity === "number" &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0
          );
        }
      }
    } catch {
      savedItems = [];
    }

    savedItemsRef.current = savedItems.map((item) => ({
      name: item.name.trim(),
      quantity: Math.floor(item.quantity),
    }));
    isHydratedRef.current = true;
    setIsHydrated(true);

    if (productsRef.current) {
      reconcileSavedItems(productsRef.current);
    }
  }, [reconcileSavedItems]);

  useEffect(() => {
    if (!isHydrated || !productsReconciled) return;

    try {
      if (items.length === 0) {
        savedItemsRef.current = [];
        window.localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }

      const minimalCart = items.map((item) => ({
        name: item.product.name.trim(),
        quantity: item.quantity,
      }));
      savedItemsRef.current = minimalCart;
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(minimalCart));
    } catch {
      // Storage may be unavailable in private browsing; keep the in-memory cart.
    }
  }, [items, isHydrated, productsReconciled]);

  const addToCart = useCallback(
    (product: Product, quantity: number, priceType: "mrp" | "retail" | "wholesale") => {
      const availableStock = getAvailableStock(product.stock);
      if (availableStock === 0) return;

      const requestedQuantity =
        priceType === "wholesale" ? Math.max(quantity, MOQ_WHOLESALE) : quantity;

      setItems((prev) => {
        const existing = prev.find((item) => item.product.name === product.name);
        if (existing) {
          return prev.map((item) =>
            item.product.name === product.name
              ? {
                  ...item,
                  product,
                  quantity: clampQuantity(item.quantity + requestedQuantity, availableStock),
                  priceType,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            product,
            quantity: clampQuantity(requestedQuantity, availableStock),
            priceType,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((productName: string) => {
    setItems((prev) => prev.filter((item) => item.product.name !== productName));
  }, []);

  const updateQuantity = useCallback((productName: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.product.name !== productName) return [item];

        const availableStock = getAvailableStock(item.product.stock);
        if (availableStock === 0) return [];

        return [{ ...item, quantity: clampQuantity(quantity, availableStock) }];
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    savedItemsRef.current = [];
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in private browsing; the in-memory cart is still cleared.
    }
  }, []);

  const dismissCartNotice = useCallback(() => {
    setCartNotice(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce((sum, item) => {
    const price =
      item.priceType === "wholesale"
        ? item.product.wholesale_price
        : item.priceType === "retail"
        ? item.product.retail_price
        : item.product.mrp;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        reconcileProducts,
        cartNotice,
        dismissCartNotice,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

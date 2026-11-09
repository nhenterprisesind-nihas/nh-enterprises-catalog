"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Product {
  name: string;
  description: string;
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

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, priceType: "mrp" | "retail" | "wholesale") => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const MOQ_WHOLESALE = 10;

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

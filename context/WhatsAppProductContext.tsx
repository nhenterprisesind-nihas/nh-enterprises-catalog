"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/context/CartContext";

interface WhatsAppProductContextValue {
  product: Product | null;
  setProduct: (product: Product | null) => void;
}

const WhatsAppProductContext =
  createContext<WhatsAppProductContextValue | undefined>(undefined);

export function WhatsAppProductProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);

  return (
    <WhatsAppProductContext.Provider value={{ product, setProduct }}>
      {children}
    </WhatsAppProductContext.Provider>
  );
}

export function useWhatsAppProduct() {
  const context = useContext(WhatsAppProductContext);
  if (!context) {
    throw new Error(
      "useWhatsAppProduct must be used within a WhatsAppProductProvider"
    );
  }
  return context;
}

"use client";

import { useEffect } from "react";
import type { Product } from "@/context/CartContext";
import { useWhatsAppProduct } from "@/context/WhatsAppProductContext";

export default function SetWhatsAppProduct({ product }: { product: Product }) {
  const { setProduct } = useWhatsAppProduct();

  useEffect(() => {
    setProduct(product);
    return () => setProduct(null);
  }, [product, setProduct]);

  return null;
}

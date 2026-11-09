"use client";

import { useEffect } from "react";
import { Product, useCart } from "@/context/CartContext";

export default function ReconcileCartProducts({
  products,
}: {
  products: Product[];
}) {
  const { reconcileProducts } = useCart();

  useEffect(() => {
    reconcileProducts(products);
  }, [products, reconcileProducts]);

  return null;
}

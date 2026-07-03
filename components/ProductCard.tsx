"use client";

import React, { useState } from "react";
import { Product, useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [selectedPrice, setSelectedPrice] = useState<"mrp" | "retail" | "wholesale">("retail");
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const MOQ_WHOLESALE = 10;

  const getPrice = () => {
    switch (selectedPrice) {
      case "wholesale":
        return product.wholesale_price;
      case "retail":
        return product.retail_price;
      default:
        return product.mrp;
    }
  };

  const handleAdd = () => {
    const effectiveQty = selectedPrice === "wholesale" ? Math.max(quantity, MOQ_WHOLESALE) : quantity;
    addToCart(product, effectiveQty, selectedPrice);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="card-luxury overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative w-full h-48 bg-maroon-900 overflow-hidden">
        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon-800 to-maroon-900">
            <svg className="w-16 h-16 text-gold-400/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}
        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-gold-400/90 text-maroon-900 text-xs font-semibold px-2 py-1 rounded-md">
          {product.category}
        </span>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-gold-400 font-serif text-lg font-semibold mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-maroon-200 text-sm mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price Tiers */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setSelectedPrice("mrp")}
              className={`text-center p-2 rounded-md text-xs transition-all ${
                selectedPrice === "mrp"
                  ? "bg-gold-400 text-maroon-900 font-bold"
                  : "bg-maroon-800 text-maroon-200 hover:bg-maroon-700"
              }`}
            >
              <div className="font-medium">MRP</div>
              <div className="text-sm font-bold">₹{product.mrp}</div>
            </button>
            <button
              onClick={() => setSelectedPrice("retail")}
              className={`text-center p-2 rounded-md text-xs transition-all ${
                selectedPrice === "retail"
                  ? "bg-gold-400 text-maroon-900 font-bold"
                  : "bg-maroon-800 text-maroon-200 hover:bg-maroon-700"
              }`}
            >
              <div className="font-medium">Retail</div>
              <div className="text-sm font-bold">₹{product.retail_price}</div>
            </button>
            <button
              onClick={() => {
                setSelectedPrice("wholesale");
                if (quantity < MOQ_WHOLESALE) setQuantity(MOQ_WHOLESALE);
              }}
              className={`text-center p-2 rounded-md text-xs transition-all ${
                selectedPrice === "wholesale"
                  ? "bg-gold-400 text-maroon-900 font-bold"
                  : "bg-maroon-800 text-maroon-200 hover:bg-maroon-700"
              }`}
            >
              <div className="font-medium">Wholesale</div>
              <div className="text-sm font-bold">₹{product.wholesale_price}</div>
            </button>
          </div>
          {selectedPrice === "wholesale" && (
            <p className="text-gold-300 text-xs text-center">
              ⚡ MOQ: {MOQ_WHOLESALE} units minimum
            </p>
          )}
        </div>

        {/* Quantity + Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gold-400/30 rounded-lg overflow-hidden">
            <button
              onClick={() => {
                const minQty = selectedPrice === "wholesale" ? MOQ_WHOLESALE : 1;
                setQuantity(Math.max(quantity - 1, minQty));
              }}
              className="px-3 py-1 text-gold-400 hover:bg-maroon-700 transition-colors"
            >
              −
            </button>
            <span className="px-3 py-1 text-gold-300 text-sm min-w-[2.5rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1 text-gold-400 hover:bg-maroon-700 transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="btn-gold flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add ₹{(getPrice() * quantity).toLocaleString("en-IN")}
          </button>
        </div>

        {/* Stock indicator */}
        {!isOutOfStock && product.stock < 20 && (
          <p className="text-yellow-400 text-xs mt-2 text-center">
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
}

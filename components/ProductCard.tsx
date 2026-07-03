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

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      const minQty = selectedPrice === "wholesale" ? MOQ_WHOLESALE : 1;
      setQuantity(minQty);
      return;
    }
    const minQty = selectedPrice === "wholesale" ? MOQ_WHOLESALE : 1;
    setQuantity(Math.max(num, minQty));
  };

  const handleAdd = () => {
    const effectiveQty = selectedPrice === "wholesale" ? Math.max(quantity, MOQ_WHOLESALE) : quantity;
    addToCart(product, effectiveQty, selectedPrice);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}
        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-md">
          {product.category}
        </span>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-red-600 font-bold text-lg bg-white px-3 py-1 rounded-md border border-red-200">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-gray-900 font-semibold text-base mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price Tiers */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setSelectedPrice("mrp")}
              className={`text-center p-2 rounded-md text-xs transition-all ${
                selectedPrice === "mrp"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="font-medium">MRP</div>
              <div className="text-sm font-bold">₹{product.mrp}</div>
            </button>
            <button
              onClick={() => setSelectedPrice("retail")}
              className={`text-center p-2 rounded-md text-xs transition-all ${
                selectedPrice === "retail"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="font-medium">Wholesale</div>
              <div className="text-sm font-bold">₹{product.wholesale_price}</div>
            </button>
          </div>
          {selectedPrice === "wholesale" && (
            <p className="text-amber-600 text-xs text-center font-medium bg-amber-50 py-1 rounded">
              ⚡ MOQ: 10 units minimum
            </p>
          )}
        </div>

        {/* Quantity + Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => {
                const minQty = selectedPrice === "wholesale" ? MOQ_WHOLESALE : 1;
                setQuantity(Math.max(quantity - 1, minQty));
              }}
              className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              −
            </button>
            <input
              type="number"
              min={selectedPrice === "wholesale" ? MOQ_WHOLESALE : 1}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-12 text-center text-sm text-gray-800 border-x border-gray-200 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="flex-1 bg-emerald-600 text-white font-semibold text-sm px-3 py-2 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Add ₹{(getPrice() * quantity).toLocaleString("en-IN")}
          </button>
        </div>

        {/* Stock indicator */}
        {!isOutOfStock && product.stock < 20 && (
          <p className="text-amber-600 text-xs mt-2 text-center">
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
}

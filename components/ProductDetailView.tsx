"use client";

import { useState } from "react";
import Link from "next/link";
import { getAvailableStock, Product, useCart } from "@/context/CartContext";
import { getProductUrl, getWhatsAppShareUrl } from "@/lib/share";
import { trackEvent } from "@/lib/trackEvent";

const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function ProductDetailView({
  product,
}: {
  product: Product;
}) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const availableStock = getAvailableStock(product.stock);
  const isOutOfStock = availableStock === 0;
  const retailPrice =
    Number.isFinite(product.retail_price) && product.retail_price > 0
      ? product.retail_price
      : null;
  const mrp =
    Number.isFinite(product.mrp) && retailPrice !== null && product.mrp > retailPrice
      ? product.mrp
      : null;
  const wholesalePrice =
    Number.isFinite(product.wholesale_price) && product.wholesale_price > 0
      ? product.wholesale_price
      : null;
  const discountPercent =
    mrp !== null && retailPrice !== null
      ? Math.round(((mrp - retailPrice) / mrp) * 100)
      : 0;
  const productUrl = getProductUrl(product.id);
  const whatsappOrderUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm interested in ${product.name} – ${productUrl}`
  )}`;

  const addProductToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, Math.min(quantity, availableStock), "retail");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
      <div className="md:sticky md:top-8">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {product.images.length > 0 ? (
            <>
              <img
                src={product.images[selectedImage]}
                alt={`${product.name} - Image ${selectedImage + 1}`}
                width={800}
                height={800}
                loading={selectedImage === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-contain"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous product image"
                    onClick={() =>
                      setSelectedImage(
                        (selectedImage - 1 + product.images.length) %
                          product.images.length
                      )
                    }
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-gray-700 shadow"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next product image"
                    onClick={() =>
                      setSelectedImage((selectedImage + 1) % product.images.length)
                    }
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-gray-700 shadow"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        aria-label={`Show product image ${index + 1}`}
                        aria-pressed={selectedImage === index}
                        onClick={() => setSelectedImage(index)}
                        className={`h-2.5 w-2.5 rounded-full shadow ${
                          selectedImage === index ? "bg-emerald-600" : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Product image coming soon
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={`${image}-thumbnail-${index}`}
                type="button"
                aria-label={`Select product image ${index + 1}`}
                onClick={() => setSelectedImage(index)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                  selectedImage === index ? "border-emerald-600" : "border-gray-200"
                }`}
              >
                <img
                  src={image}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {product.name}
        </h1>

        <div className="mt-5 space-y-2">
          {retailPrice !== null ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(retailPrice)}
              </p>
              {mrp !== null && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(mrp)}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-lg font-medium text-gray-500">Price not available</p>
          )}
          {mrp !== null && retailPrice !== null && (
            <p className="text-sm font-medium text-emerald-700">
              You save {formatPrice(mrp - retailPrice)}
            </p>
          )}
          {wholesalePrice !== null && (
            <p className="border-t border-gray-100 pt-2 text-sm text-gray-600">
              Wholesale price:{" "}
              <span className="font-semibold text-gray-800">
                {formatPrice(wholesalePrice)}
              </span>
            </p>
          )}
        </div>

        <p
          className={`mt-5 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            isOutOfStock
              ? "bg-red-50 text-red-700"
              : availableStock <= 5
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isOutOfStock
            ? "Out of stock"
            : availableStock <= 5
              ? `Only ${availableStock} left`
              : "In stock"}
        </p>

        {product.description?.trim() && (
          <section className="mt-5 border-t border-gray-100 pt-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Description</h2>
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
              {product.description.trim()}
            </p>
          </section>
        )}

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <label htmlFor={`quantity-${product.id}`} className="text-sm text-gray-600">
              Quantity
            </label>
            <input
              id={`quantity-${product.id}`}
              type="number"
              min={1}
              max={availableStock}
              value={quantity}
              disabled={isOutOfStock}
              onChange={(event) => {
                const nextQuantity = Number(event.target.value);
                if (Number.isFinite(nextQuantity) && nextQuantity > 0) {
                  setQuantity(Math.min(Math.floor(nextQuantity), availableStock));
                }
              }}
              className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={addProductToCart}
            disabled={isOutOfStock}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOutOfStock ? "Out of stock" : "Add to cart"}
          </button>
          <a
            href={whatsappOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("wa-product-order-click")}
            className="flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20BD5A]"
          >
            Order on WhatsApp
          </a>
          <a
            href={getWhatsAppShareUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("wa-share-click")}
            className="flex w-full items-center justify-center rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Share on WhatsApp
          </a>
          <Link
            href="/"
            className="block pt-1 text-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

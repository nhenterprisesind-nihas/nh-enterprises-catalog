"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { getAvailableStock, Product, useCart } from "@/context/CartContext";
import Link from "next/link";
import { getWhatsAppShareUrl } from "@/lib/share";
import { trackEvent } from "@/lib/trackEvent";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
      <line x1="11" x2="11" y1="8" y2="14" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </svg>
  );
}

interface ProductCardProps {
  product: Product;
  eagerImage: boolean;
}

function ProductCard({ product, eagerImage }: ProductCardProps) {
  const { addToCart } = useCart();
  const [selectedPrice, setSelectedPrice] = useState<"retail" | "wholesale">("retail");
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const MOQ_WHOLESALE = 10;
  const availableStock = getAvailableStock(product.stock);
  const isOutOfStock = availableStock === 0;

  const images = product.images.length > 0 ? product.images : [];
  const hasMultipleImages = images.length > 1;

  const getPrice = () => {
    switch (selectedPrice) {
      case "wholesale":
        return product.wholesale_price;
      case "retail":
      default:
        return product.retail_price;
    }
  };

  const handleQuantityChange = (value: string) => {
    if (isOutOfStock || value.trim() === "") return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setQuantity(Math.min(Math.max(Math.floor(num), 1), availableStock));
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    const effectiveQty = selectedPrice === "wholesale" ? Math.max(quantity, MOQ_WHOLESALE) : quantity;
    addToCart(product, effectiveQty, selectedPrice);
  };

  const handleImageError = (index: number) => {
    setImageError((prev) => new Set(prev).add(index));
  };

  const scrollToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, images.length - 1));
    setCurrentSlide(clamped);
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth;
      sliderRef.current.scrollTo({ left: clamped * slideWidth, behavior: "smooth" });
    }
  }, [images.length]);

  const handleSliderScroll = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth;
      const newIndex = Math.round(sliderRef.current.scrollLeft / slideWidth);
      setCurrentSlide(newIndex);
    }
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const discountPercent =
  product.mrp > product.retail_price
    ? Math.round(
        ((product.mrp - product.retail_price) / product.mrp) * 100
      )
    : 0;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden group">
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {discountPercent}% OFF
        </div>
       )}
          {images.length > 0 ? (
            <>
              <div
                ref={sliderRef}
                onScroll={handleSliderScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
              >
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-full h-full snap-center relative"
                  >
                    {!imageError.has(idx) ? (
                      <img
                        src={url}
                        alt={`${product.name} - Image ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        width={400}
                        height={192}
                        loading={eagerImage && idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        onError={() => handleImageError(idx)}
                        onClick={() => openGallery(idx)}
                      />
                     ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => scrollToSlide(currentSlide - 1)}
                    className={`absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === 0 ? "hidden" : ""}`}
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollToSlide(currentSlide + 1)}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${currentSlide === images.length - 1 ? "hidden" : ""}`}
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-700" />
                  </button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSlide(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentSlide ? "bg-white w-3" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => openGallery(currentSlide)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomInIcon className="w-3.5 h-3.5 text-gray-700" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-xs font-medium">Product image coming soon</p>
            </div>
          )}

          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-md z-10">
            {product.category || "Uncategorized"}
          </span>
          <a
            href={getWhatsAppShareUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share ${product.name} on WhatsApp`}
            onClick={() => trackEvent("wa-share-click")}
            className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-colors hover:bg-[#20BD5A]"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.32.22 11.87c0 2.1.55 4.15 1.6 5.96L.12 24l6.31-1.66a11.9 11.9 0 0 0 5.67 1.44h.01c6.55 0 11.88-5.33 11.89-11.88a11.8 11.8 0 0 0-3.48-8.42ZM12.1 21.76a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.52-5.26c0-5.46 4.45-9.9 9.92-9.9a9.84 9.84 0 0 1 7.01 2.9 9.84 9.84 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.92 9.91Zm5.44-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
            </svg>
          </a>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <span className="text-red-600 font-bold text-lg bg-white px-3 py-1 rounded-md border border-red-200">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-gray-900 font-semibold text-base mb-1 line-clamp-2">
            <Link href={`/product/${product.id}`} prefetch={false}>
              {product.name}
            </Link>
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">
            {product.description}
          </p>

          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-3 gap-1">
              <div
                className="text-center p-2 rounded-md text-xs bg-gray-50 border border-gray-200 cursor-default"
              >
                <div className="font-medium text-gray-400 line-through">MRP</div>
                <div className="text-sm font-bold text-gray-400 line-through">₹{product.mrp}</div>
              </div>
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
                  if (quantity < MOQ_WHOLESALE && !isOutOfStock) {
                    setQuantity(Math.min(MOQ_WHOLESALE, availableStock));
                  }
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

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(quantity - 1, 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={availableStock}
                value={quantity}
                disabled={isOutOfStock}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={() => {
                  if (!isOutOfStock) {
                    setQuantity(Math.min(Math.max(quantity, 1), availableStock));
                  }
                }}
                className="w-12 text-center text-sm text-gray-800 border-x border-gray-200 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setQuantity(Math.min(quantity + 1, availableStock))}
                disabled={quantity >= availableStock || isOutOfStock}
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
              {isOutOfStock
                ? "Out of stock"
                : `Add ₹${(getPrice() * quantity).toLocaleString("en-IN")}`}
            </button>
          </div>

          {!isOutOfStock && quantity >= availableStock && (
            <p className="text-amber-600 text-xs mt-2 text-center">
              Only {availableStock} available
            </p>
          )}
        </div>
      </div>

      {galleryOpen && images.length > 0 && (
        <ImageGalleryModal
          images={images}
          initialIndex={galleryIndex}
          productName={product.name}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

export default React.memo(ProductCard);

interface ImageGalleryModalProps {
  images: string[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}

function ImageGalleryModal({ images, initialIndex, productName, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <XIcon className="w-6 h-6 text-white" />
      </button>

      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-white font-semibold text-lg">{productName}</h3>
        <p className="text-white/60 text-sm">{currentIndex + 1} / {images.length}</p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-16 py-20">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeftIcon className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRightIcon className="w-7 h-7 text-white" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 bg-black/50 rounded-xl backdrop-blur-sm">
          {images.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-emerald-400 scale-110 shadow-lg"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

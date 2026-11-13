"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { optimizeImage } from "@/lib/images";

interface ProductImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: "eager" | "lazy";
  className: string;
  placeholderClassName: string;
}

export default function ProductImage({
  src,
  alt,
  width,
  height,
  loading,
  className,
  placeholderClassName,
}: ProductImageProps) {
  const [fallbackStage, setFallbackStage] = useState(0);
  const optimizedSrc = optimizeImage(src, width);
  const imageRef = useRef<HTMLImageElement>(null);
  const handledErrorSrcRef = useRef<string | null>(null);
  const displayedSrc = fallbackStage === 0 ? optimizedSrc : src;

  const handleImageError = useCallback(
    (failedSrc: string) => {
      if (handledErrorSrcRef.current === failedSrc) return;

      handledErrorSrcRef.current = failedSrc;
      setFallbackStage(
        failedSrc === optimizedSrc && optimizedSrc !== src ? 1 : 2
      );
    },
    [optimizedSrc, src]
  );

  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete || image.naturalWidth !== 0) return;

    const expectedSrc = new URL(displayedSrc, window.location.href).href;
    if (image.currentSrc === expectedSrc) {
      handleImageError(displayedSrc);
    }
  }, [displayedSrc, handleImageError]);

  if (fallbackStage === 2) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt}: Image unavailable` : "Image unavailable"}
        className={placeholderClassName}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      ref={imageRef}
      src={displayedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => handleImageError(displayedSrc)}
    />
  );
}

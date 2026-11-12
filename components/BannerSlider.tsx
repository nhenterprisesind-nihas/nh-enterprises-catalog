"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DealSlide } from "@/lib/dealBanners";
import { FESTIVALS } from "@/lib/festivalThemes";
import { getProductUrl } from "@/lib/share";
import { trackEvent } from "@/lib/trackEvent";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const MAX_DEAL_SLIDES = 6;

type FestivalSlide = {
  type: "festival";
  greeting: string;
};

type CarouselSlide = DealSlide | FestivalSlide;

function getProductHref(id: string): string {
  const productUrl = new URL(getProductUrl(id));
  return `${productUrl.pathname}${productUrl.search}${productUrl.hash}`;
}

function getImageUrl(images: string[]): string | undefined {
  return images.find((value) => {
    const url = value.trim();
    if (!url || url.startsWith("//") || url.startsWith("\\\\")) {
      return false;
    }

    if (!/^[a-z][a-z\d+.-]*:/i.test(url)) {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  });
}

function getSlideKey(slide: CarouselSlide): string {
  if (slide.type === "festival" || slide.type === "collage" || slide.type === "wholesale") {
    return slide.type;
  }
  if (slide.type === "hero" || slide.type === "savings") {
    return `${slide.type}-${slide.product.id}`;
  }
  return `category-${slide.category}`;
}

function ProductThumbnail({
  images,
  eager,
  className,
}: {
  images: string[];
  eager: boolean;
  className: string;
}) {
  const imageUrl = getImageUrl(images);
  if (!imageUrl) return null;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-2 ring-white/80 shadow-lg ${className}`}
      aria-hidden="true"
    >
      <img
        src={imageUrl}
        alt=""
        width={128}
        height={128}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function SlideBackdrop({
  imageUrl,
  tintClassName,
  opaqueTintClassName,
  eager,
  onImageError,
}: {
  imageUrl?: string;
  tintClassName: string;
  opaqueTintClassName: string;
  eager: boolean;
  onImageError: () => void;
}) {
  return (
    <>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          onError={onImageError}
          className="absolute inset-0 z-0 h-full w-full scale-110 object-cover blur-md"
        />
      )}
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-[1] ${
          imageUrl ? tintClassName : opaqueTintClassName
        }`}
      />
    </>
  );
}

function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function BannerSlider({ slides }: { slides: DealSlide[] }) {
  const pathname = usePathname();
  const trackRef = useRef<HTMLDivElement>(null);
  const [festivalGreeting, setFestivalGreeting] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [failedBackgrounds, setFailedBackgrounds] = useState<Set<number>>(
    () => new Set()
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const carouselSlides = useMemo<CarouselSlide[]>(() => {
    const dealSlides = slides.slice(0, MAX_DEAL_SLIDES);
    if (!festivalGreeting) return dealSlides;
    return [
      { type: "festival", greeting: festivalGreeting },
      ...dealSlides,
    ];
  }, [festivalGreeting, slides]);

  const scrollToSlide = useCallback((index: number, smooth = true) => {
    const track = trackRef.current;
    const slide = track?.children.item(index);
    if (!track || !slide) return;

    const left =
      track.scrollLeft +
      slide.getBoundingClientRect().left -
      track.getBoundingClientRect().left;
    track.scrollTo({
      left,
      behavior: smooth && !prefersReducedMotion ? "smooth" : "auto",
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    const theme = document.documentElement.dataset.theme;
    if (!theme || theme === "base") return;

    const festival = FESTIVALS.find((item) => item.theme === theme);
    if (!festival) return;

    setFestivalGreeting(
      document.documentElement.dataset.greeting || festival.greeting
    );
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || carouselSlides.length < 1) return;

    track.scrollLeft = 0;
    setActiveSlide(0);
    setFailedBackgrounds(new Set());
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = mostVisible?.target.getAttribute("data-slide-index");
        if (index !== null && index !== undefined) {
          setActiveSlide(Number(index));
        }
      },
      { root: track, threshold: [0.6] }
    );

    Array.from(track.children).forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [carouselSlides.length]);

  useEffect(() => {
    if (
      carouselSlides.length <= 1 ||
      isHovered ||
      isFocused ||
      isInteracting ||
      !isVisible ||
      prefersReducedMotion
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      scrollToSlide((activeSlide + 1) % carouselSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [
    activeSlide,
    carouselSlides.length,
    isFocused,
    isHovered,
    isInteracting,
    isVisible,
    prefersReducedMotion,
    scrollToSlide,
  ]);

  if (pathname !== "/" || carouselSlides.length === 0) {
    return null;
  }

  const whatsappUrl = getWhatsAppUrl("Hi, I'd like wholesale prices");
  const contentClassName =
    "relative z-10 mx-auto flex h-full w-full min-w-0 max-w-4xl items-center justify-center gap-5 px-4 sm:px-8 md:px-12";

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Offers and deals"
      className="relative isolate w-full max-w-full min-w-0 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsFocused(false);
        }
      }}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      onPointerCancel={() => setIsInteracting(false)}
    >
      <div
        ref={trackRef}
        className="flex h-36 w-full max-w-full min-w-0 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-44"
      >
        {carouselSlides.map((slide, index) => {
          const slideLabel = `${index + 1} of ${carouselSlides.length}`;
          const isFestival = slide.type === "festival";
          const isDark = index % 2 === 0;
          const baseColor = isFestival
            ? "bg-accent text-on-accent"
            : isDark
              ? "bg-brand-dark text-white"
              : "bg-brand text-on-brand";
          const opaqueTintClassName = isFestival
            ? "bg-accent"
            : isDark
              ? "bg-brand-dark"
              : "bg-brand";
          const tintClassName = isFestival
            ? "bg-accent"
            : isDark
              ? "bg-brand-dark/75"
              : "bg-brand/90";
          const imageUrl =
            slide.type !== "festival" && !failedBackgrounds.has(index)
              ? getImageUrl(slide.bg ? [slide.bg.url] : [])
              : undefined;
          const handleBackgroundError = () => {
            setFailedBackgrounds((previous) => {
              const next = new Set(previous);
              next.add(index);
              return next;
            });
          };

          let content: ReactNode;
          if (slide.type === "festival") {
            content = (
              <p className="max-w-full text-center text-base font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-lg md:text-xl">
                {slide.greeting}
              </p>
            );
          } else if (slide.type === "hero") {
            content = (
              <Link
                href={getProductHref(slide.product.id)}
                prefetch={false}
                onClick={() => trackEvent("banner-click")}
                aria-label={`View deal: ${slide.product.name}`}
                className="flex h-full w-full min-w-0 items-center gap-3 sm:gap-5"
              >
                <ProductThumbnail
                  images={slide.product.images}
                  eager={index === 0}
                  className="h-24 w-24 md:h-32 md:w-32"
                />
                <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-sm font-extrabold text-on-accent sm:text-base">
                      {slide.pct}% OFF
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-base md:text-lg">
                      {slide.product.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-lg font-bold sm:text-xl">
                        {formatPrice(slide.product.retail_price)}
                      </span>
                      <span className="text-xs opacity-80 line-through sm:text-sm">
                        {formatPrice(slide.product.mrp)}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">
                    View deal
                  </span>
                </span>
              </Link>
            );
          } else if (slide.type === "collage") {
            content = (
              <Link
                href="/"
                prefetch={false}
                onClick={() => trackEvent("banner-click")}
                className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-2"
                aria-label={`Shop today's top deals, up to ${slide.topPct}% off`}
              >
                <span className="max-w-full text-center text-base font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-lg md:text-xl">
                  Top deals today: up to {slide.topPct}% off
                </span>
                <span className="flex max-w-full items-center justify-center gap-2 sm:gap-3">
                  {slide.products.map(({ product, pct }) => {
                    const thumbnailUrl = getImageUrl(product.images);
                    return (
                      <span
                        key={product.id}
                        className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-2 ring-white/80 shadow-lg md:h-[104px] md:w-[104px]"
                      >
                        {thumbnailUrl && (
                          <img
                            src={thumbnailUrl}
                            alt=""
                            width={104}
                            height={104}
                            loading={index === 0 ? "eager" : "lazy"}
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        )}
                        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-on-accent">
                          {pct}%
                        </span>
                      </span>
                    );
                  })}
                </span>
              </Link>
            );
          } else if (slide.type === "category") {
            content = (
              <Link
                href={`/?category=${encodeURIComponent(slide.category)}`}
                prefetch={false}
                onClick={() => {
                  trackEvent("banner-click");
                  window.dispatchEvent(
                    new CustomEvent("catalog-banner-category", {
                      detail: slide.category,
                    })
                  );
                }}
                className="flex max-w-full flex-col items-center gap-3 text-center"
              >
                <span className="max-w-full text-lg font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-xl md:text-2xl">
                  Up to {slide.topPct}% off on {slide.category}
                </span>
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">
                  Shop {slide.category}
                </span>
              </Link>
            );
          } else if (slide.type === "savings") {
            content = (
              <Link
                href={getProductHref(slide.product.id)}
                prefetch={false}
                onClick={() => trackEvent("banner-click")}
                aria-label={`View deal: ${slide.product.name}`}
                className="flex h-full w-full min-w-0 items-center gap-3 sm:gap-5"
              >
                <ProductThumbnail
                  images={slide.product.images}
                  eager={index === 0}
                  className="h-24 w-24 md:h-32 md:w-32"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-xl md:text-2xl">
                    Save ₹{slide.saveRs.toLocaleString("en-IN")} on
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-base">
                    {slide.product.name}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">
                  View deal
                </span>
              </Link>
            );
          } else {
            content = (
              <span className="flex max-w-full flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5">
                <span className="text-base font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-lg md:text-xl">
                  Buying in bulk? Wholesale prices available
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("banner-click")}
                  className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold"
                >
                  Chat on WhatsApp
                </a>
              </span>
            );
          }

          return (
            <div
              key={getSlideKey(slide)}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel}
              data-slide-index={index}
              className={`relative isolate flex h-36 w-full min-w-0 max-w-full shrink-0 snap-start overflow-hidden md:h-44 ${baseColor}`}
            >
              <SlideBackdrop
                imageUrl={imageUrl}
                tintClassName={tintClassName}
                opaqueTintClassName={opaqueTintClassName}
                eager={index === 0}
                onImageError={handleBackgroundError}
              />
              <div
                className={`${contentClassName} ${
                  slide.type === "collage" ? "flex-col gap-2" : ""
                }`}
              >
                {content}
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-accent"
      />

      {carouselSlides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() =>
              scrollToSlide(
                (activeSlide - 1 + carouselSlides.length) % carouselSlides.length
              )
            }
            className="absolute left-3 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 md:flex"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="m15 18-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => scrollToSlide((activeSlide + 1) % carouselSlides.length)}
            className="absolute right-3 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 md:flex"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="m9 18 6-6-6-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={activeSlide === index ? "true" : undefined}
                onClick={() => scrollToSlide(index)}
                className="flex min-h-6 min-w-6 items-center justify-center"
              >
                <span
                  className={`h-1.5 rounded-full ${
                    activeSlide === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

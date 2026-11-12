"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

function ProductThumbnail({
  images,
  name,
  eager,
  className,
}: {
  images: string[];
  name: string;
  eager: boolean;
  className: string;
}) {
  const imageUrl = getImageUrl(images);
  if (!imageUrl) return null;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ${className}`}
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
      <span className="sr-only">{name}</span>
    </span>
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
    if (!slide) return;

    slide.scrollIntoView({
      behavior: smooth && !prefersReducedMotion ? "smooth" : "auto",
      block: "nearest",
      inline: "start",
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

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Offers and deals"
      className="relative"
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
        className="flex h-32 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:h-40"
      >
        {carouselSlides.map((slide, index) => {
          const slideLabel = `${index + 1} of ${carouselSlides.length}`;
          const background =
            index % 2 === 0
              ? "bg-brand-dark text-white"
              : "bg-brand text-on-brand";
          const commonClassName =
            "flex h-32 w-full shrink-0 snap-start items-center justify-center px-4 md:h-40 md:px-12";

          if (slide.type === "festival") {
            return (
              <div
                key="festival"
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel}
                data-slide-index={index}
                className={`${commonClassName} bg-accent text-on-accent`}
              >
                <p className="max-w-4xl text-center text-base font-semibold sm:text-lg md:text-xl">
                  {slide.greeting}
                </p>
              </div>
            );
          }

          if (slide.type === "hero") {
            const href = getProductHref(slide.product.id);
            return (
              <div
                key={`hero-${slide.product.id}`}
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel}
                data-slide-index={index}
                className={`${commonClassName} ${background}`}
              >
                <Link
                  href={href}
                  prefetch={false}
                  onClick={() => trackEvent("banner-click")}
                  aria-label={`View deal: ${slide.product.name}`}
                  className="flex h-full w-full max-w-5xl items-center gap-3 sm:gap-5"
                >
                  <ProductThumbnail
                    images={slide.product.images}
                    name={slide.product.name}
                    eager={index === 0}
                    className="h-24 w-24 md:h-32 md:w-32"
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
                    <span className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-sm font-extrabold text-on-accent sm:text-base">
                        {slide.pct}% OFF
                      </span>
                      <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-tight sm:text-base md:text-lg">
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
              </div>
            );
          }

          if (slide.type === "collage") {
            return (
              <div
                key="collage"
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel}
                data-slide-index={index}
                className={`${commonClassName} ${background}`}
              >
                <Link
                  href="/"
                  prefetch={false}
                  onClick={() => trackEvent("banner-click")}
                  className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-2"
                  aria-label={`Shop today's top deals, up to ${slide.topPct}% off`}
                >
                  <span className="text-center text-base font-bold sm:text-lg md:text-xl">
                    Top deals today: up to {slide.topPct}% off
                  </span>
                  <span className="flex items-center justify-center gap-3">
                    {slide.products.map(({ product, pct }, productIndex) => (
                      <span
                        key={product.id}
                        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white p-1 sm:h-14 sm:w-14"
                      >
                        {getImageUrl(product.images) && (
                          <img
                            src={getImageUrl(product.images)}
                            alt=""
                            width={56}
                            height={56}
                            loading={index === 0 ? "eager" : "lazy"}
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        )}
                        <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-on-accent">
                          {pct}%
                        </span>
                        {productIndex === 0 && (
                          <span className="sr-only">{product.name}</span>
                        )}
                      </span>
                    ))}
                  </span>
                </Link>
              </div>
            );
          }

          if (slide.type === "category") {
            return (
              <div
                key={`category-${slide.category}`}
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel}
                data-slide-index={index}
                className={`${commonClassName} ${background}`}
              >
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
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <span className="text-lg font-bold sm:text-xl md:text-2xl">
                    Up to {slide.topPct}% off on {slide.category}
                  </span>
                  <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">
                    Shop {slide.category}
                  </span>
                </Link>
              </div>
            );
          }

          if (slide.type === "savings") {
            return (
              <div
                key={`savings-${slide.product.id}`}
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel}
                data-slide-index={index}
                className={`${commonClassName} ${background}`}
              >
                <Link
                  href={getProductHref(slide.product.id)}
                  prefetch={false}
                  onClick={() => trackEvent("banner-click")}
                  aria-label={`View deal: ${slide.product.name}`}
                  className="flex h-full w-full max-w-5xl items-center gap-3 sm:gap-5"
                >
                  <ProductThumbnail
                    images={slide.product.images}
                    name={slide.product.name}
                    eager={index === 0}
                    className="h-24 w-24 md:h-32 md:w-32"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold sm:text-xl md:text-2xl">
                      Save Rs {slide.saveRs.toLocaleString("en-IN")} on
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm font-semibold sm:text-base">
                      {slide.product.name}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">
                    View deal
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <div
              key="wholesale"
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel}
              data-slide-index={index}
              className={`${commonClassName} ${background}`}
            >
              <span className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-5">
                <span className="text-base font-bold sm:text-lg md:text-xl">
                  Buying in bulk? Wholesale prices available
                </span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("banner-click")}
                  className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold"
                >
                  Chat on WhatsApp
                </a>
              </span>
            </div>
          );
        })}
      </div>

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
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 md:flex"
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
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 md:flex"
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
          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center">
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

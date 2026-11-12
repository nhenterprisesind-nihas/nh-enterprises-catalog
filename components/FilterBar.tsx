"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SortOption =
  | "newest"
  | "price-low-to-high"
  | "price-high-to-low"
  | "name-a-to-z";

export interface CategoryOption {
  key: string;
  label: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (value: boolean) => void;
  resultCount: number;
}

export default function FilterBar({
  searchQuery,
  onSearchQueryChange,
  sortOption,
  onSortOptionChange,
  inStockOnly,
  onInStockOnlyChange,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="w-full min-w-0">
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-800 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand md:hidden"
      />
      <div className="mt-2 flex min-w-0 items-center gap-2 md:hidden">
        <select
          aria-label="Sort products"
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as SortOption)}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="newest">Newest first</option>
          <option value="price-low-to-high">Price: Low to High</option>
          <option value="price-high-to-low">Price: High to Low</option>
          <option value="name-a-to-z">Name: A to Z</option>
        </select>
        <label className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700">
          <input
            type="checkbox"
            aria-label="In stock only"
            checked={inStockOnly}
            onChange={(event) => onInStockOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-dark focus:ring-brand-dark"
          />
          <span>In stock only</span>
        </label>
        <p className="shrink-0 text-[11px] text-gray-500" aria-live="polite">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </p>
      </div>
      <div className="hidden gap-2 md:flex md:items-center">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-800 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <select
          aria-label="Sort products"
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as SortOption)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand sm:w-auto"
        >
          <option value="newest">Newest first</option>
          <option value="price-low-to-high">Price: Low to High</option>
          <option value="price-high-to-low">Price: High to Low</option>
          <option value="name-a-to-z">Name: A to Z</option>
        </select>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            aria-label="In stock only"
            checked={inStockOnly}
            onChange={(event) => onInStockOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-dark focus:ring-brand-dark"
          />
          <span>In stock only</span>
        </label>
      </div>
      <p className="mt-3 hidden text-sm text-gray-500 md:block" aria-live="polite">
        {resultCount} {resultCount === 1 ? "product" : "products"}
      </p>
    </div>
  );
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategory: string | null;
  onSelectedCategoryChange: (value: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
}: CategoryFilterProps) {
  if (categories.length < 2) {
    return null;
  }

  return (
    <>
      <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:block [scrollbar-width:thin]">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
          Categories
        </h2>
        <nav className="space-y-1" aria-label="Product categories">
          <button
            type="button"
            onClick={() => onSelectedCategoryChange(null)}
            aria-pressed={selectedCategory === null}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-brand text-on-brand shadow-sm"
                : "text-gray-600 hover:bg-brand-soft hover:text-gray-900"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.key}
              onClick={() => onSelectedCategoryChange(category.key)}
              aria-pressed={selectedCategory === category.key}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                selectedCategory === category.key
                  ? "bg-brand text-on-brand shadow-sm"
                  : "text-gray-600 hover:bg-brand-soft hover:text-gray-900"
              }`}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </aside>
      <MobileCategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectedCategoryChange={onSelectedCategoryChange}
      />
    </>
  );
}

function MobileCategoryChips({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string | null, HTMLButtonElement>());
  const animationFrameRef = useRef<number | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const row = scrollRef.current;
    if (!row) return;

    setShowLeftFade(row.scrollLeft > 1);
    setShowRightFade(row.scrollWidth - row.clientWidth - row.scrollLeft > 1);
  }, []);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updateFades();
    });
  }, [updateFades]);

  useEffect(() => {
    updateFades();
    const row = scrollRef.current;
    if (!row) return;

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(row);
    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [categories, updateFades]);

  useEffect(() => {
    chipRefs.current.get(selectedCategory)?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [categories, selectedCategory]);

  if (categories.length < 2) {
    return null;
  }

  return (
    <div className="sticky -mx-4 z-20 mb-4 border-b border-gray-200 bg-white md:hidden top-[77px] sm:top-[81px]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x gap-2 overflow-x-auto px-4 py-2 [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
        }}
        role="group"
        aria-label="Categories"
      >
        <button
          ref={(element) => {
            if (element) chipRefs.current.set(null, element);
            else chipRefs.current.delete(null);
          }}
          type="button"
          onClick={() => onSelectedCategoryChange(null)}
          aria-pressed={selectedCategory === null}
          className={`min-h-10 shrink-0 snap-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all ${
            selectedCategory === null
              ? "bg-brand text-on-brand shadow-sm"
              : "border border-gray-200 bg-brand-soft text-ink hover:bg-brand-soft"
          }`}
        >
          Categories: All
        </button>
        {categories.map((category) => (
          <button
            ref={(element) => {
              if (element) chipRefs.current.set(category.key, element);
              else chipRefs.current.delete(category.key);
            }}
            key={category.key}
            type="button"
            onClick={() => onSelectedCategoryChange(category.key)}
            aria-pressed={selectedCategory === category.key}
            className={`min-h-10 shrink-0 snap-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all ${
              selectedCategory === category.key
                ? "bg-brand text-on-brand shadow-sm"
                : "border border-gray-200 bg-brand-soft text-ink hover:bg-brand-soft"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
      {showLeftFade && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent"
        />
      )}
      {showRightFade && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
        />
      )}
    </div>
  );
}

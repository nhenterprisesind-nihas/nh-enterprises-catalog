"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import Cart from "@/components/Cart";
import { Product, useCart } from "@/context/CartContext";
import Footer from "@/components/Footer";
import FilterBar, {
  CategoryFilter,
  type CategoryOption,
  type SortOption,
} from "@/components/FilterBar";
import { parseProducts } from "@/lib/products";

const PRODUCTS_PER_BATCH = 24;
const EAGER_PRODUCT_IMAGE_COUNT = 6;
const PRODUCT_LOAD_ERROR =
  "Couldn't load products. Please check your connection and try again.";

export default function CatalogPage() {
  const { reconcileProducts } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visibleProductCount, setVisibleProductCount] = useState(PRODUCTS_PER_BATCH);
  const isMountedRef = useRef(false);
  const activeFetchRef = useRef<AbortController | null>(null);

  const deferredSelectedCategory = useDeferredValue(selectedCategory);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSortOption = useDeferredValue(sortOption);
  const deferredInStockOnly = useDeferredValue(inStockOnly);

  const loadProducts = useCallback(async () => {
    const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL;

    if (!sheetUrl) {
      const sampleProducts = getSampleProducts();
      reconcileProducts(sampleProducts);
      setProducts(sampleProducts);
      setError(null);
      setLoading(false);
      return;
    }

    activeFetchRef.current?.abort();
    const controller = new AbortController();
    activeFetchRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    setError(null);

    try {
      const cacheBuster = `${sheetUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
      const response = await fetch(sheetUrl + cacheBuster, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Product fetch failed with status ${response.status}`);
      }

      const csvText = await response.text();
      const parsed = parseProducts(csvText);

      if (isMountedRef.current && activeFetchRef.current === controller) {
        reconcileProducts(parsed);
        setProducts(parsed);
        setLoading(false);
      }
    } catch {
      if (isMountedRef.current && activeFetchRef.current === controller) {
        setError(PRODUCT_LOAD_ERROR);
        setLoading(false);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (activeFetchRef.current === controller) {
        activeFetchRef.current = null;
      }
    }
  }, [reconcileProducts]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadProducts();

    return () => {
      isMountedRef.current = false;
      activeFetchRef.current?.abort();
      activeFetchRef.current = null;
    };
  }, [loadProducts]);

  const categories = useMemo<CategoryOption[]>(() => {
    const categoryLabels = new Map<string, string>();
    products.forEach((product) => {
      const label = product.category.trim();
      const key = label.toLowerCase();
      if (key && !categoryLabels.has(key)) {
        categoryLabels.set(key, label);
      }
    });

    return Array.from(categoryLabels, ([key, label]) => ({ key, label })).sort(
      (a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
    const searchedProducts = products.filter(
      (product) =>
        normalizedSearch === "" ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch)
    );
    const categoryFilteredProducts = searchedProducts.filter(
      (product) =>
        deferredSelectedCategory === null ||
        product.category.trim().toLowerCase() === deferredSelectedCategory
    );
    const stockFilteredProducts = deferredInStockOnly
      ? categoryFilteredProducts.filter(
          (product) => Number.isFinite(product.stock) && product.stock > 0
        )
      : categoryFilteredProducts;

    return [...stockFilteredProducts].sort((a, b) => {
      if (
        deferredSortOption === "price-low-to-high" ||
        deferredSortOption === "price-high-to-low"
      ) {
        const aMissingPrice = !Number.isFinite(a.retail_price) || a.retail_price === 0;
        const bMissingPrice = !Number.isFinite(b.retail_price) || b.retail_price === 0;
        if (aMissingPrice !== bMissingPrice) {
          return aMissingPrice ? 1 : -1;
        }

        const priceOrder =
          deferredSortOption === "price-low-to-high"
            ? a.retail_price - b.retail_price
            : b.retail_price - a.retail_price;
        return priceOrder || b.originalRowIndex - a.originalRowIndex;
      }

      if (deferredSortOption === "name-a-to-z") {
        return (
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
          b.originalRowIndex - a.originalRowIndex
        );
      }

      return b.originalRowIndex - a.originalRowIndex;
    });
  }, [
    products,
    deferredSearchQuery,
    deferredSelectedCategory,
    deferredInStockOnly,
    deferredSortOption,
  ]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    setVisibleProductCount(PRODUCTS_PER_BATCH);
  }, []);

  const handleSelectedCategoryChange = useCallback((value: string | null) => {
    setSelectedCategory(value);
    setVisibleProductCount(PRODUCTS_PER_BATCH);
  }, []);

  const handleSortOptionChange = useCallback((value: SortOption) => {
    setSortOption(value);
    setVisibleProductCount(PRODUCTS_PER_BATCH);
  }, []);

  const handleInStockOnlyChange = useCallback((value: boolean) => {
    setInStockOnly(value);
    setVisibleProductCount(PRODUCTS_PER_BATCH);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setInStockOnly(false);
    setSortOption("newest");
    setVisibleProductCount(PRODUCTS_PER_BATCH);
  }, []);

  const visibleProducts = filteredProducts.slice(0, visibleProductCount);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex flex-shrink-0 items-center justify-center">
              {process.env.NEXT_PUBLIC_LOGO_URL ? (
                <img
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt="Brand Logo"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white">N</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Nikshas Collections
              </h1>
              <p className="text-xs text-gray-500">
                Quality products at retail and wholesale pricing
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start">
        {loading ? (
          <aside
            className="hidden h-fit w-56 shrink-0 animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:block"
            aria-hidden="true"
          >
            <div className="mb-4 h-4 w-2/3 rounded bg-gray-200" />
            <div className="space-y-3">
              <div className="h-9 w-full rounded-lg bg-gray-200" />
              <div className="h-9 w-full rounded-lg bg-gray-200" />
              <div className="h-9 w-4/5 rounded-lg bg-gray-200" />
              <div className="h-9 w-11/12 rounded-lg bg-gray-200" />
            </div>
          </aside>
        ) : (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={handleSelectedCategoryChange}
          />
        )}
        <section className="min-w-0 flex-1">
          <FilterBar
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            sortOption={sortOption}
            onSortOptionChange={handleSortOptionChange}
            inStockOnly={inStockOnly}
            onInStockOnlyChange={handleInStockOnlyChange}
            resultCount={filteredProducts.length}
          />
          {loading ? (
            <div role="status" aria-busy="true">
              <span className="sr-only">Loading products</span>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p role="alert" className="text-gray-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">No products match your filters</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      eagerImage={index < EAGER_PRODUCT_IMAGE_COUNT}
                    />
                  ))}
                </div>
              )}
              {visibleProducts.length < filteredProducts.length && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleProductCount((count) => count + PRODUCTS_PER_BATCH)
                    }
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Cart />
      <Footer />
    </div>
  );
}

function getSampleProducts(): Product[] {
  return [
    {
      id: "premium-silk-saree",
      name: "Premium Silk Saree",
      description: "Handwoven Banarasi silk saree with gold zari work",
      category: "Clothing",
      mrp: 12999,
      retail_price: 9999,
      wholesale_price: 7499,
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400",
      ],
      stock: 25,
      originalRowIndex: 0,
    }
  ];
}

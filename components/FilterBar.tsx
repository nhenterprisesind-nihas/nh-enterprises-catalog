"use client";

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-gray-800 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          aria-label="Sort products"
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as SortOption)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
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
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>In stock only</span>
        </label>
      </div>
      <p className="mt-3 text-sm text-gray-500" aria-live="polite">
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
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </aside>
      <div
        className="mb-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden md:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          onClick={() => onSelectedCategoryChange(null)}
          aria-pressed={selectedCategory === null}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            selectedCategory === null
              ? "bg-emerald-600 text-white shadow-sm"
              : "border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Categories: All
        </button>
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onSelectedCategoryChange(category.key)}
            aria-pressed={selectedCategory === category.key}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedCategory === category.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </>
  );
}

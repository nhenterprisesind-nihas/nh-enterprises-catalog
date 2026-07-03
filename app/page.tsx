"use client";

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { Product } from "@/context/CartContext";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL;

      if (!sheetUrl) {
        // Use sample data for demo
        setProducts(getSampleProducts());
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed: Product[] = results.data.map((row: any) => ({
              name: row.name || "",
              description: row.description || "",
              category: row.category || "Uncategorized",
              mrp: parseFloat(row.mrp) || 0,
              retail_price: parseFloat(row.retail_price) || 0,
              wholesale_price: parseFloat(row.wholesale_price) || 0,
              image_url: row.image_url || "",
              stock: parseInt(row.stock) || 0,
            }));
            setProducts(parsed.filter((p) => p.name));
            setLoading(false);
          },
          error: (err: Error) => {
            setError("Failed to parse product data: " + err.message);
            setLoading(false);
          },
        });
      } catch (err) {
        setError("Failed to fetch product data. Please check the sheet URL.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-400 font-serif text-xl">Loading Catalog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-luxury p-8 max-w-md text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-gold-400 font-serif text-xl mb-2">Something went wrong</h2>
          <p className="text-maroon-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-maroon-950/95 backdrop-blur-sm border-b border-gold-400/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-gold-400 font-serif text-2xl sm:text-3xl font-bold">
                ✦ Premium Catalog
              </h1>
              <p className="text-maroon-300 text-sm">
                {products.length} Products • 3-Tier Pricing
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-maroon-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-maroon-900 border border-gold-400/20 rounded-lg text-white placeholder-maroon-400 focus:outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-gold-400 text-maroon-900"
                    : "bg-maroon-800 text-maroon-200 hover:bg-maroon-700 border border-gold-400/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-maroon-400 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Component */}
      <Cart />
    </div>
  );
}

function getSampleProducts(): Product[] {
  return [
    {
      name: "Premium Silk Saree",
      description: "Handwoven Banarasi silk saree with gold zari work",
      category: "Clothing",
      mrp: 12999,
      retail_price: 9999,
      wholesale_price: 7499,
      image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
      stock: 25,
    },
    {
      name: "Organic Turmeric Powder",
      description: "100% pure lakadong turmeric from Meghalaya, 500g pack",
      category: "Groceries",
      mrp: 599,
      retail_price: 449,
      wholesale_price: 349,
      image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
      stock: 150,
    },
    {
      name: "Brass Diya Set (6pcs)",
      description: "Traditional hand-crafted brass oil lamps for puja",
      category: "Home & Decor",
      mrp: 1499,
      retail_price: 1199,
      wholesale_price: 899,
      image_url: "https://images.unsplash.com/photo-1605882174146-a464b70cf691?w=400",
      stock: 45,
    },
    {
      name: "Kashmiri Saffron (1g)",
      description: "Grade-1 Mongra saffron from Kashmir valley",
      category: "Groceries",
      mrp: 899,
      retail_price: 749,
      wholesale_price: 599,
      image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
      stock: 80,
    },
    {
      name: "Handmade Leather Journal",
      description: "Vintage style A5 journal with 200 handmade pages",
      category: "Stationery",
      mrp: 999,
      retail_price: 799,
      wholesale_price: 549,
      image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400",
      stock: 60,
    },
    {
      name: "Sterling Silver Jhumka",
      description: "Oxidized silver traditional jhumka earrings",
      category: "Jewelry",
      mrp: 2499,
      retail_price: 1999,
      wholesale_price: 1499,
      image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400",
      stock: 35,
    },
    {
      name: "Darjeeling First Flush Tea",
      description: "Premium FTGFOP1 first flush tea, 250g tin",
      category: "Groceries",
      mrp: 1299,
      retail_price: 999,
      wholesale_price: 749,
      image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
      stock: 100,
    },
    {
      name: "Madhubani Art Print",
      description: "Museum-quality Madhubani painting print on canvas, 18x24 inch",
      category: "Home & Decor",
      mrp: 3499,
      retail_price: 2799,
      wholesale_price: 1999,
      image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400",
      stock: 15,
    },
  ];
}

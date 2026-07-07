"use client";

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { Product } from "@/context/CartContext";
import Footer from "@/components/Footer";

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
        setProducts(getSampleProducts());
        setLoading(false);
        return;
      }

      try {
        const cacheBuster = `${sheetUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
        const response = await fetch(sheetUrl + cacheBuster);
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed: Product[] = results.data.map((row: any) => {
            const images: string[] = [];
						const hasMultiImages = row.image_url_1 !== undefined;

						const isValidImage = (url: string | undefined) => {
  					if (!url) return false;
    				const value = url.trim().toUpperCase();
					  return (
    								value !== "" &&
    								value !== "NA" &&
    								value !== "N/A" &&
    								value !== "-"
  								);
						};

						if (hasMultiImages) {
  						for (let i = 1; i <= 5; i++) {
    							const url = row[`image_url_${i}`];
    									if (isValidImage(url)) {
      										images.push(url.trim());
    											}
  									}
							} else if (isValidImage(row.image_url)) {
  									images.push(row.image_url.trim());
						}

              return {
                name: row.name || "",
                description: row.description || "",
                category: row.category || "Uncategorized",
                mrp: parseFloat(row.mrp) || 0,
                retail_price: parseFloat(row.retail_price) || 0,
                wholesale_price: parseFloat(row.wholesale_price) || 0,
                images,
                stock: parseInt(row.stock) || 0,
              };
            });
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
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">Loading Products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFBF7]">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center shadow-sm">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-gray-800 font-semibold text-xl mb-2">Something went wrong</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                {process.env.NEXT_PUBLIC_LOGO_URL ? (
                  <img
                    src={process.env.NEXT_PUBLIC_LOGO_URL}
                    alt="Brand Logo"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">N</span>
                )}
              </div>
              <div>
                <h1 className="text-gray-900 font-bold text-xl sm:text-2xl tracking-tight">
                  Nikshas Collections
                </h1>
                <p className="text-gray-500 text-xs">
                  Quality products at retail and wholesale pricing
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        )}
      </main>
      <Cart />
      <Footer />
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
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400",
        "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400",
      ],
      stock: 25,
    }
  ];
}

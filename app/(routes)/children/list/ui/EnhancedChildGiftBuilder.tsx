"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaSearch, FaFilter, FaTimes, FaHeart, FaFire, FaBolt, FaCheck, FaSpinner } from "react-icons/fa";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { addItemToChildGiftList, getChildExistingGifts } from "../actions-new";

type ChildLite = { id: string; name: string };
type CatalogItem = {
  _id: string;
  title: string;
  brand?: string;
  category?: string;
  gender?: string;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  blobUrl?: string;
  tags?: string[];
  popularity?: number;
  sourceType?: string;
  isInCatalog?: boolean;
};

interface EnhancedChildGiftBuilderProps {
  initialChildren: ChildLite[];
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "action-figures", label: "Action Figures" },
  { value: "dolls", label: "Dolls" },
  { value: "building-blocks", label: "Building Blocks" },
  { value: "vehicles", label: "Vehicles & RC" },
  { value: "arts-crafts", label: "Arts & Crafts" },
  { value: "games-puzzles", label: "Games & Puzzles" },
  { value: "educational", label: "Educational & STEM" },
  { value: "outdoor", label: "Outdoor & Sports" },
  { value: "plush", label: "Plush & Collectibles" },
  { value: "electronics", label: "Electronics & Gaming" },
];

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-25", label: "Under $25" },
  { value: "25-50", label: "$25 - $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-200", label: "$100 - $200" },
  { value: "200-500", label: "$200+" },
];

export default function EnhancedChildGiftBuilder({
  initialChildren,
}: EnhancedChildGiftBuilderProps) {
  const [selectedChild, setSelectedChild] = useState<string>(initialChildren[0]?.id || "");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<string>("neutral");
  const [category, setCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState<{
    total: number;
    source: string;
    databaseCount?: number;
    curatedCount?: number;
    message?: string;
  } | null>(null);
  
  // Track gifts that are already in the child's list
  const [existingGifts, setExistingGifts] = useState<Set<string>>(new Set());
  // Track items being added/removed (loading states)
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  // Track successfully added items this session
  const [sessionAddedItems, setSessionAddedItems] = useState<Set<string>>(new Set());

  // Load existing gifts when child changes
  useEffect(() => {
    const loadExistingGifts = async () => {
      try {
        const result = await getChildExistingGifts(selectedChild);
        if (result.success) {
          setExistingGifts(new Set(result.existingItems));
        }
      } catch (error) {
        console.error("Failed to load existing gifts:", error);
      }
    };

    if (selectedChild) {
      loadExistingGifts();
    }
  }, [selectedChild]);

  // Check if a catalog item is already in the child's list
  const isGiftInList = (item: CatalogItem) => {
    return existingGifts.has(item.productUrl || "") || 
           existingGifts.has(item.title.toLowerCase().trim()) ||
           sessionAddedItems.has(item._id);
  };

  const handleAddToList = async (item: CatalogItem) => {
    if (isGiftInList(item) || processingItems.has(item._id)) {
      return;
    }

    setProcessingItems(prev => new Set([...prev, item._id]));

    try {
      // Use the new addItemToChildGiftList function
      const result = await addItemToChildGiftList(selectedChild, {
        title: item.title,
        productUrl: item.productUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
        brand: item.brand,
        category: item.category,
        gender: item.gender as "boy" | "girl" | "neutral",
        price: item.price,
        retailer: item.retailer,
        imageUrl: item.imageUrl?.startsWith('/images/') ? undefined : item.imageUrl, // Skip placeholder images
        tags: item.tags,
        popularity: item.popularity,
        searchQuery: query,
        sourceType: item.sourceType as "live_search" | "manual" | "curated" | "trending",
      });
      
      if (result.success) {
        // Add to session tracking
        setSessionAddedItems(prev => new Set([...prev, item._id]));
        // Add to existing gifts tracking
        if (item.productUrl) {
          setExistingGifts(prev => new Set([...prev, item.productUrl!]));
        }
        setExistingGifts(prev => new Set([...prev, item.title.toLowerCase().trim()]));
      } else {
        alert(result.message || "Failed to add gift to list");
      }
    } catch (error) {
      console.error("Error adding gift:", error);
      alert("Failed to add gift to list. Please try again.");
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item._id);
        return newSet;
      });
    }
  };

  // Parse price range
  const { minPrice, maxPrice } = useMemo(() => {
    if (!priceRange) return { minPrice: undefined, maxPrice: undefined };
    const [min, max] = priceRange.split("-").map(Number);
    return { minPrice: min, maxPrice: max };
  }, [priceRange]);

  // Search function - Updated to use enhanced-v2 API
  const performSearch = async (searchQuery: string, searchGender: string, searchCategory: string, searchMinPrice?: number, searchMaxPrice?: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        gender: searchGender,
        limit: "24",
      });
      
      if (searchCategory) params.set("category", searchCategory);
      if (searchMinPrice) params.set("minPrice", searchMinPrice.toString());
      if (searchMaxPrice) params.set("maxPrice", searchMaxPrice.toString());

      // Use the new enhanced-v2 endpoint for better results
      const response = await fetch(`/api/catalog/enhanced-v2?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
        setSearchStats({
          total: data.total || 0,
          source: data.source || "enhanced",
          databaseCount: data.breakdown?.catalog || 0,
          curatedCount: data.breakdown?.curated || 0,
          message: data.message || `Found ${data.total} items`,
        });
      } else {
        console.error("Search failed:", data.error);
        setItems([]);
        setSearchStats(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      setItems([]);
      setSearchStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to trigger search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query, gender, category, minPrice, maxPrice);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, gender, category, minPrice, maxPrice]);

  // Quick search functions
  const quickTrending = () => {
    setQuery("trending toys");
  };

  const quickCurated = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const clearFilters = () => {
    setQuery("");
    setGender("neutral");
    setCategory("");
    setPriceRange("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-paytone-one text-santa mb-2">
            🎁 Build Your Christmas List
          </h1>
          <p className="text-gray-600 text-lg">
            Find the perfect gifts from thousands of popular toys
          </p>
          {sessionAddedItems.size > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
              <FaCheck />
              <span>{sessionAddedItems.size} gifts added this session</span>
            </div>
          )}
        </div>

        {/* Child Selection */}
        {initialChildren.length > 1 && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building list for:
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
            >
              {initialChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={quickTrending}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 max-w-none"
            >
              <FaFire className="mr-1" />
              Trending Now
            </Button>
            <Button
              onClick={() => quickCurated("lego")}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 max-w-none"
            >
              <FaBolt className="mr-1" />
              LEGO
            </Button>
            <Button
              onClick={() => quickCurated("barbie")}
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm px-3 py-2 max-w-none"
            >
              <FaBolt className="mr-1" />
              Barbie
            </Button>
            <Button
              onClick={() => quickCurated("pokemon")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-2 max-w-none"
            >
              <FaBolt className="mr-1" />
              Pokémon
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for toys, brands, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-santa focus:border-santa text-lg"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              >
                <option value="neutral">All</option>
                <option value="boy">Boys</option>
                <option value="girl">Girls</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm max-w-none"
            >
              <FaFilter className="mr-1" />
              Clear Filters
            </Button>

            {/* Search Stats */}
            {searchStats && (
              <div className="text-sm text-gray-600">
                {searchStats.total} items 
                {searchStats.source !== "database" && (
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {searchStats.source}
                  </span>
                )}
                {searchStats.curatedCount && searchStats.curatedCount > 0 && (
                  <span className="ml-1 text-green-600">
                    +{searchStats.curatedCount} popular
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa"></div>
            <span className="ml-3 text-gray-600">Searching toys...</span>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            // Use blobUrl first, then imageUrl, then fallback
            const bestImageUrl = item.blobUrl || item.imageUrl || "/images/christmasMagic.png";
            
            return (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                <Image
                  src={bestImageUrl}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="h-full w-full object-cover"
                  unoptimized={!item.blobUrl} // Only optimize blob URLs through Next.js
                  onError={(e) => {
                    // Fallback to default image on error
                    e.currentTarget.src = "/images/christmasMagic.png";
                  }}
                />
                {/* Source indicator */}
                {item.sourceType && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                    {item.sourceType === "master_catalog" ? "📦" : 
                     item.sourceType === "curated" ? "⭐" : 
                     item.sourceType === "trending" ? "🔥" : "🔍"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                
                {item.brand && (
                  <p className="text-sm text-gray-600 mb-1">{item.brand}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  {item.price && (
                    <span className="text-lg font-bold text-evergreen">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                  {item.popularity && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      🔥 {item.popularity}% popular
                    </span>
                  )}
                </div>

                {item.retailer && (
                  <p className="text-xs text-gray-500 mb-3 capitalize">
                    Available at {item.retailer}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddToList(item)}
                    disabled={isGiftInList(item) || processingItems.has(item._id)}
                    className={`flex-1 text-sm max-w-none ${
                      isGiftInList(item)
                        ? "bg-green-500 text-white cursor-default"
                        : processingItems.has(item._id)
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-santa text-white hover:bg-red-700"
                    }`}
                  >
                    {processingItems.has(item._id) ? (
                      <>
                        <FaSpinner className="mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : isGiftInList(item) ? (
                      <>
                        <FaCheck className="mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <FaHeart className="mr-1" />
                        Add to List
                      </>
                    )}
                  </Button>
                  
                  {item.productUrl && (
                    <Button
                      onClick={() => { window.open(item.productUrl, "_blank"); }}
                      className="bg-blueberry text-white text-sm px-3 max-w-none"
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No toys found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or browse trending toys
            </p>
            <Button
              onClick={quickTrending}
              className="bg-santa text-white max-w-none"
            >
              <FaFire className="mr-2" />
              Show Trending Toys
            </Button>
          </div>
        )}

        {/* Success Summary */}
        {sessionAddedItems.size > 0 && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <FaCheck />
              <span className="font-medium">{sessionAddedItems.size} items added to list</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
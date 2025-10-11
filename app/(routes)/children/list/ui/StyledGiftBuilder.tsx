"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { FaHeart, FaCheck, FaSpinner } from "react-icons/fa";
import { addItemToChildGiftList, getChildExistingGifts } from "../actions-new";
import RequestNewToy from "@/components/catalog/RequestNewItemButton";

interface MasterCatalogItem {
  _id?: string;
  title: string;
  productUrl?: string;
  brand?: string;
  category?: string;
  gender: string;
  price?: number;
  retailer?: string;
  imageUrl?: string;
  tags?: string[];
  popularity?: number;
  sourceType?: string;
}

interface BrandItem {
  brand: string;
  logoUrl?: string;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface StyledGiftBuilderProps {
  initialChildren: Array<{ id: string; name: string }>;
  selectedChildId?: string;
}

export function StyledGiftBuilder({ initialChildren, selectedChildId }: StyledGiftBuilderProps) {
  const [selectedChild, setSelectedChild] = useState(selectedChildId || initialChildren[0]?.id || "");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<MasterCatalogItem[]>([]);
  const [existingGifts, setExistingGifts] = useState<Set<string>>(new Set());
  const [sessionAddedItems, setSessionAddedItems] = useState<Set<string>>(new Set());
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [childMagicPoints, setChildMagicPoints] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);

  // Load available brands and categories
  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Load brands
        const brandsResponse = await fetch('/api/catalog/brands');
        if (brandsResponse.ok) {
          const brandsData = await brandsResponse.json();
          if (brandsData.success && Array.isArray(brandsData.brands)) {
            setAvailableBrands(brandsData.brands);
          }
        }

        // Load categories
        const categoriesResponse = await fetch('/api/catalog/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData.success && Array.isArray(categoriesData.categories)) {
            setAvailableCategories(categoriesData.categories);
          }
        }
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    };
    loadFilters();
  }, []);

  const loadItems = async (page: number, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });

      if (selectedBrand) {
        params.append("brand", selectedBrand);
      }

      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/catalog?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // API returns { items, hasMore, total } - no success field
      if (data.items) {
        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setCurrentPage(page);
        setHasMore(data.hasMore ?? false);
        setTotalCount(data.total ?? 0);
      } else {
        console.error("API returned unexpected format:", data);
        if (!append) {
          setItems([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreItems = () => {
    if (!isLoadingMore && hasMore) {
      loadItems(currentPage + 1, true);
    }
  };

  const handleBrandChange = (brand: string | null) => {
    setSelectedBrand(brand);
    setCurrentPage(0);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  // Load existing gifts when child changes
  useEffect(() => {
    const loadExistingGifts = async () => {
      try {
        const result = await getChildExistingGifts(selectedChild);
        if (result.success) {
          setExistingGifts(new Set(result.existingItems));
          if (result.magicPoints !== undefined) {
            setChildMagicPoints(result.magicPoints);
          }
        }
      } catch (error) {
        console.error("Failed to load existing gifts:", error);
      }
    };

    if (selectedChild) {
      loadExistingGifts();
    }
  }, [selectedChild]);

  // Load initial items
  useEffect(() => {
    loadItems(0, false);
  }, []);

  // Reload items when filters change
  useEffect(() => {
    loadItems(0, false);
  }, [selectedBrand, selectedCategory]);

  const refreshChildData = () => {
    const loadData = async () => {
      try {
        const result = await getChildExistingGifts(selectedChild);
        if (result.success && result.magicPoints !== undefined) {
          setChildMagicPoints(result.magicPoints);
        }
      } catch (error) {
        console.error("Failed to refresh child data:", error);
      }
    };
    loadData();
  };

  const isGiftInList = (item: MasterCatalogItem) => {
    const itemId = item._id?.toString() || "";
    return existingGifts.has(item.productUrl || "") || 
           existingGifts.has(item.title.toLowerCase().trim()) ||
           sessionAddedItems.has(itemId);
  };

  const handleAddToList = async (item: MasterCatalogItem) => {
    const itemId = item._id?.toString() || "";
    if (isGiftInList(item) || processingItems.has(itemId)) {
      return;
    }

    setProcessingItems(prev => new Set([...prev, itemId]));

    try {
      const result = await addItemToChildGiftList(selectedChild, {
        title: item.title,
        productUrl: item.productUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
        brand: item.brand,
        category: item.category,
        gender: item.gender as "boy" | "girl" | "neutral",
        price: item.price,
        retailer: item.retailer,
        imageUrl: item.imageUrl?.startsWith('/images/') ? undefined : item.imageUrl,
        tags: item.tags,
        popularity: item.popularity,
        searchQuery: "",
        sourceType: item.sourceType as "live_search" | "manual" | "curated" | "trending",
      });
      
      if (result.success) {
        setSessionAddedItems(prev => new Set([...prev, itemId]));
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
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <style jsx>{`
        @keyframes sway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(3px) rotate(2deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 5px currentColor; }
        }
        .garland {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1rem 0;
          justify-content: center;
          align-items: center;
          background: linear-gradient(to bottom, rgba(34, 139, 34, 0.1) 0%, transparent 100%);
        }
        .bulb {
          width: 20px;
          height: 28px;
          border-radius: 40% 40% 50% 50%;
          position: relative;
          animation: sway 3s ease-in-out infinite, blink 2s ease-in-out infinite;
          box-shadow: 0 0 15px currentColor;
        }
        .bulb:nth-child(1) { background: #e63946; color: #e63946; animation-delay: 0s, 0s; }
        .bulb:nth-child(2) { background: #2d6a4f; color: #2d6a4f; animation-delay: 0.3s, 0.2s; }
        .bulb:nth-child(3) { background: #457b9d; color: #457b9d; animation-delay: 0.6s, 0.4s; }
        .bulb:nth-child(4) { background: #f4a261; color: #f4a261; animation-delay: 0.9s, 0.6s; }
        .bulb:nth-child(5) { background: #f72585; color: #f72585; animation-delay: 1.2s, 0.8s; }
        .bulb:nth-child(6) { background: #9d4edd; color: #9d4edd; animation-delay: 1.5s, 1s; }
        .bulb:nth-child(7) { background: #ff6b35; color: #ff6b35; animation-delay: 1.8s, 1.2s; }
        .bulb:nth-child(8) { background: #06d6a0; color: #06d6a0; animation-delay: 2.1s, 1.4s; }
        .bulb::before {
          content: "";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 10px;
          background: linear-gradient(to bottom, #555 0%, #333 100%);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .shelf-board {
          background: linear-gradient(to bottom, #8b5a3c 0%, #6b4423 50%, #5a3415 100%);
          box-shadow: 
            inset 0 3px 6px rgba(0,0,0,0.4),
            inset 0 -2px 4px rgba(255,255,255,0.1),
            0 6px 12px rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 3px solid #4a2c15;
          position: relative;
        }
        .shelf-board::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(139, 90, 60, 0.3) 25%, 
            rgba(139, 90, 60, 0.3) 75%, 
            transparent 100%
          );
          border-radius: 12px 12px 0 0;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header with Christmas Lights */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-paytone-one text-santa mb-2">
            🎁 Build Your Christmas List
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Browse toys by category and add them to your list
          </p>
          
          {/* Christmas Lights Garland */}
          <div className="garland">
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
            <div className="bulb"><span className="bulb-glow"></span></div>
          </div>
        </div>

        {/* Request New Toy Section */}
        {selectedChild && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Can't find what you want?
                </h3>
                <p className="text-sm text-gray-600">
                  Request Santa to add a new toy to the catalog
                </p>
                <div className="mt-2 flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-sm text-evergreen font-medium">
                    Building for: {initialChildren.find(c => c.id === selectedChild)?.name}
                  </span>
                  <span className="text-sm text-blue-600">
                    ✨ {childMagicPoints} magic points
                  </span>
                </div>
              </div>
              <RequestNewToy
                childId={selectedChild}
                childName={initialChildren.find(c => c.id === selectedChild)?.name || ""}
                magicPoints={childMagicPoints}
                onRequestSent={refreshChildData}
              />
            </div>
          </div>
        )}

        {/* Child Selection */}
        {initialChildren.length > 1 && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building list for:
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa w-full"
            >
              {initialChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Row - Brand and Category Dropdowns */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Filter Toys
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Dropdown */}
            {availableBrands.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  By Brand
                </label>
                <select
                  value={selectedBrand || ""}
                  onChange={(e) => handleBrandChange(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-santa focus:border-santa"
                >
                  <option value="">All Brands</option>
                  {availableBrands.map((brandItem) => (
                    <option key={brandItem.brand} value={brandItem.brand}>
                      {brandItem.brand}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Dropdown */}
            {availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  By Category
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => handleCategoryChange(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-santa focus:border-santa"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((catItem) => (
                    <option key={catItem.category} value={catItem.category}>
                      {catItem.category} ({catItem.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa"></div>
            <span className="ml-3 text-gray-600">Loading toys...</span>
          </div>
        )}

        {/* Toy Shelf with Results Grid */}
        {!isLoading && items.length > 0 && (
          <div className="shelf-board">
            {/* Toy Count Display */}
            <div className="text-center mb-4 text-white font-semibold">
              Showing {items.length} of {totalCount} toys
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((item) => {
                // Use imageUrl for master catalog items (contains blob URLs)
                let bestImageUrl = "/images/christmasMagic.png";
                if (item.imageUrl && item.imageUrl.trim()) {
                  bestImageUrl = item.imageUrl;
                }
                
                return (
                  <div
                    key={item._id?.toString()}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all hover:scale-105 overflow-hidden flex flex-col"
                  >
                    {/* Image */}
                    <div className="h-32 sm:h-40 bg-gray-100 flex items-center justify-center relative">
                      <Image
                        src={bestImageUrl}
                        alt={item.title}
                        width={200}
                        height={200}
                        className="h-full w-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src = "/images/christmasMagic.png";
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-3 line-clamp-2 flex-1">
                        {item.title}
                      </h3>

                      {/* Add to List Button */}
                      <Button
                        onClick={() => handleAddToList(item)}
                        disabled={isGiftInList(item) || processingItems.has(item._id?.toString() || '')}
                        className={`w-full text-xs py-2 max-w-none ${
                          isGiftInList(item)
                            ? "bg-green-500 text-white cursor-default"
                            : processingItems.has(item._id?.toString() || '')
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-santa text-white hover:bg-red-700"
                        }`}
                      >
                        {processingItems.has(item._id?.toString() || '') ? (
                          <>
                            <FaSpinner className="inline animate-spin" />
                          </>
                        ) : isGiftInList(item) ? (
                          <>
                            <FaCheck className="inline mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <FaHeart className="inline mr-1" />
                            Add to List
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && items.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={loadMoreItems}
              disabled={isLoadingMore}
              className="bg-santa text-white px-8 py-3 text-lg max-w-none"
            >
              {isLoadingMore ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load 30 More Toys"
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No toys found
            </h3>
            <p className="text-gray-600 mb-4">
              Try selecting a different category or brand
            </p>
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

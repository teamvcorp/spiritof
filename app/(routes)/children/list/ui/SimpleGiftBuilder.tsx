"use client";

import React, { useState, useEffect } from "react";
import { FaHeart, FaCheck, FaSpinner } from "react-icons/fa";
import Button from "@/components/ui/Button";
import Image from "next/image";
import RequestNewToy from "./RequestNewToy";
import { addItemToChildGiftList, getChildExistingGifts } from "../actions-new";

type ChildLite = { 
  id: string; 
  name: string; 
  avatarUrl?: string; 
  magicPoints?: number; 
};

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
  tags?: string[];
  popularity?: number;
  sourceType?: string;
};

interface SimpleGiftBuilderProps {
  initialChildren: ChildLite[];
}

type GenderFilter = "boy" | "girl" | "neutral";

export default function SimpleGiftBuilder({ initialChildren }: SimpleGiftBuilderProps) {
  const [selectedChild, setSelectedChild] = useState<string>(initialChildren[0]?.id || "");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("neutral");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [existingGifts, setExistingGifts] = useState<Set<string>>(new Set());
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [sessionAddedItems, setSessionAddedItems] = useState<Set<string>>(new Set());
  const [childMagicPoints, setChildMagicPoints] = useState<number>(0);

  // Load items by gender
  const loadItems = async (gender: GenderFilter, page: number = 0, append: boolean = false) => {
    if (page === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const params = new URLSearchParams({
        gender: gender,
        page: page.toString(),
        limit: "10"
      });

      const response = await fetch(`/api/catalog/by-gender?${params}`);
      const data = await response.json();

      if (response.ok) {
        const newItems = data.items || [];
        
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        
        setHasMore(data.hasMore || false);
        setCurrentPage(page);
      } else {
        console.error("Load items failed:", data.error);
        if (!append) {
          setItems([]);
        }
      }
    } catch (error) {
      console.error("Load items error:", error);
      if (!append) {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreItems = () => {
    if (!isLoadingMore && hasMore) {
      loadItems(selectedGender, currentPage + 1, true);
    }
  };

  const handleGenderChange = (gender: GenderFilter) => {
    setSelectedGender(gender);
    setCurrentPage(0);
    loadItems(gender, 0, false);
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
    loadItems(selectedGender, 0, false);
  }, []);

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
        setSessionAddedItems(prev => new Set([...prev, item._id]));
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-paytone-one text-santa mb-2">
            🎁 Build Your Christmas List
          </h1>
          <p className="text-gray-600 text-lg">
            Browse toys by category and add them to your list
          </p>
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

        {/* Gender Filter Buttons */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Toys</h3>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => handleGenderChange("girl")}
              className={`px-8 py-3 text-lg font-semibold max-w-none ${
                selectedGender === "girl"
                  ? "bg-berryPink text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-berryPink hover:text-white"
              }`}
            >
              💖 Girls
            </Button>
            <Button
              onClick={() => handleGenderChange("boy")}
              className={`px-8 py-3 text-lg font-semibold max-w-none ${
                selectedGender === "boy"
                  ? "bg-blueberry text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-blueberry hover:text-white"
              }`}
            >
              💙 Boys
            </Button>
            <Button
              onClick={() => handleGenderChange("neutral")}
              className={`px-8 py-3 text-lg font-semibold max-w-none ${
                selectedGender === "neutral"
                  ? "bg-evergreen text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-evergreen hover:text-white"
              }`}
            >
              💚 Everyone
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa"></div>
            <span className="ml-3 text-gray-600">Loading toys...</span>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            // Use imageUrl for master catalog items (contains blob URLs)
            let bestImageUrl = "/images/christmasMagic.png";
            if (item.imageUrl && item.imageUrl.trim()) {
              bestImageUrl = item.imageUrl;
            }
            
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
                    onError={(e) => {
                      e.currentTarget.src = "/images/christmasMagic.png";
                    }}
                  />
                  {/* Source indicator */}
                  {item.sourceType && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                      {item.sourceType === "master_catalog" ? "📦" : "🔍"}
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
                "Load 10 More Toys"
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
              Try selecting a different category
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
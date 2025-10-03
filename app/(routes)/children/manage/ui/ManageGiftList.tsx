"use client";

import React, { useState, useEffect } from "react";
import { FaTrash, FaSpinner } from "react-icons/fa";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { getChildGiftListNew, removeItemFromChildGiftList } from "../../list/actions-new";

interface Gift {
  _id: string;
  title: string;
  brand?: string;
  category?: string;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  blobUrl?: string;
  originalImageUrl?: string;
  tags?: string[];
  popularity?: number;
  sourceType?: string;
  createdAt: Date;
}

interface ManageGiftListProps {
  childId: string;
  childName: string;
}

export default function ManageGiftList({ childId, childName }: ManageGiftListProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Load the child's gift list
  useEffect(() => {
    const loadGifts = async () => {
      try {
        const result = await getChildGiftListNew(childId);
        if (result.success) {
          setGifts(result.gifts);
        }
      } catch (error) {
        console.error("Failed to load gifts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGifts();
  }, [childId]);

  // Handle removing a gift
  const handleRemoveGift = async (giftId: string) => {
    if (removingItems.has(giftId)) return;

    setRemovingItems(prev => new Set([...prev, giftId]));

    try {
      const result = await removeItemFromChildGiftList(childId, giftId);
      if (result.success) {
        // Remove from local state
        setGifts(prev => prev.filter(gift => gift._id !== giftId));
      } else {
        alert(result.message || "Failed to remove gift");
      }
    } catch (error) {
      console.error("Error removing gift:", error);
      alert("Failed to remove gift. Please try again.");
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(giftId);
        return newSet;
      });
    }
  };

  // Get the best image URL for display
  const getBestImageUrl = (gift: Gift): string => {
    if (gift.blobUrl) return gift.blobUrl;
    if (gift.imageUrl && !gift.imageUrl.startsWith('/images/')) return gift.imageUrl;
    if (gift.originalImageUrl && !gift.originalImageUrl.startsWith('/images/')) return gift.originalImageUrl;
    return "/images/christmasMagic.png";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa"></div>
        <span className="ml-3 text-gray-600">Loading gifts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-paytone-one text-santa mb-2">
          {childName}&apos;s Christmas List
        </h2>
        <p className="text-gray-600">
          {gifts.length} {gifts.length === 1 ? 'gift' : 'gifts'} in your list
        </p>
      </div>

      {gifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No gifts yet!
          </h3>
          <p className="text-gray-600 mb-4">
            Start building your Christmas list by searching for toys
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => (
            <div
              key={gift._id}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                <Image
                  src={getBestImageUrl(gift)}
                  alt={gift.title}
                  width={300}
                  height={200}
                  className="h-full w-full object-cover"
                  unoptimized={!gift.blobUrl}
                  onError={(e) => {
                    e.currentTarget.src = "/images/christmasMagic.png";
                  }}
                />
                {/* Source indicator */}
                {gift.sourceType && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                    {gift.sourceType === "master_catalog" ? "📦" : 
                     gift.sourceType === "curated" ? "⭐" : 
                     gift.sourceType === "trending" ? "🔥" : "🔍"}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {gift.title}
                </h3>
                
                {gift.brand && (
                  <p className="text-sm text-gray-600 mb-1">{gift.brand}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  {gift.price && (
                    <span className="text-lg font-bold text-evergreen">
                      ${gift.price.toFixed(2)}
                    </span>
                  )}
                  {gift.popularity && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      🔥 {gift.popularity}% popular
                    </span>
                  )}
                </div>

                {gift.retailer && (
                  <p className="text-xs text-gray-500 mb-3 capitalize">
                    Available at {gift.retailer}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleRemoveGift(gift._id)}
                    disabled={removingItems.has(gift._id)}
                    className={`bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 max-w-none ${
                      removingItems.has(gift._id) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {removingItems.has(gift._id) ? (
                      <>
                        <FaSpinner className="animate-spin mr-1" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <FaTrash className="mr-1" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
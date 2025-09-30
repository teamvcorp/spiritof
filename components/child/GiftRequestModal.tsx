"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { requestGift, getChristmasWindow, getRewardGiftStats } from "@/app/(routes)/children/list/gift-actions";

interface ChristmasWindow {
  year: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  daysUntilStart: number;
}

interface RewardStats {
  usedRewardGifts: number;
  maxRewardGifts: number;
  remainingRewardGifts: number;
  maxRewardGiftPrice: number;
}

interface CatalogItem {
  _id: string;
  title: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  retailer?: string;
}

interface Child {
  _id: string;
  displayName: string;
  score365: number;
}

interface GiftRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  catalogItem: CatalogItem;
  onSuccess: () => void;
}

export default function GiftRequestModal({ 
  isOpen, 
  onClose, 
  child, 
  catalogItem, 
  onSuccess 
}: GiftRequestModalProps) {
  const [orderType, setOrderType] = useState<"CHRISTMAS" | "REWARD">("CHRISTMAS");
  const [behaviorReason, setBehaviorReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [christmasWindow, setChristmasWindow] = useState<ChristmasWindow | null>(null);
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null);

  useState(() => {
    if (isOpen) {
      loadWindowAndStats();
    }
  });

  const loadWindowAndStats = async () => {
    try {
      const window = await getChristmasWindow();
      setChristmasWindow(window);

      const stats = await getRewardGiftStats(child._id);
      setRewardStats(stats);

      // Auto-select order type based on Christmas window
      if (window.isActive) {
        setOrderType("CHRISTMAS");
      } else if (stats.remainingRewardGifts > 0) {
        setOrderType("REWARD");
      }
    } catch (error) {
      console.error("Error loading window and stats:", error);
    }
  };

  const handleRequest = async () => {
    if (!catalogItem.price) {
      alert("Gift price not available");
      return;
    }

    try {
      setLoading(true);
      
      const result = await requestGift(
        child._id,
        catalogItem._id,
        orderType,
        orderType === "REWARD" ? behaviorReason : undefined
      );

      if (result.success) {
        alert(result.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Failed to request gift:", error);
      alert(error instanceof Error ? error.message : "Failed to request gift");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const magicPointsCost = Math.ceil(catalogItem.price || 0);
  const hasEnoughPoints = child.score365 >= magicPointsCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-paytone-one text-santa-600">
              🎁 Request Gift
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Gift Details */}
          <div className="flex items-center space-x-4 mb-6">
            {catalogItem.imageUrl && (
              <div className="w-20 h-20 relative">
                <Image
                  src={catalogItem.imageUrl}
                  alt={catalogItem.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">
                {catalogItem.title}
              </h3>
              {catalogItem.brand && (
                <p className="text-sm text-gray-600">
                  by {catalogItem.brand}
                </p>
              )}
              <p className="text-lg font-bold text-evergreen-600">
                ${(catalogItem.price || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Child & Magic Points */}
          <div className="bg-santa-50 rounded-lg p-4 mb-6">
            <h4 className="font-paytone-one text-santa-700 mb-2">
              For: {child.displayName}
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Magic Points Cost:</span>
              <span className="font-bold text-lg">{magicPointsCost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available:</span>
              <span className={`font-bold text-lg ${
                hasEnoughPoints ? "text-evergreen-600" : "text-santa-600"
              }`}>
                {child.score365}
              </span>
            </div>
            {!hasEnoughPoints && (
              <p className="text-sm text-santa-600 mt-2">
                ⚠️ Not enough magic points! Need {magicPointsCost - child.score365} more.
              </p>
            )}
          </div>

          {/* Order Type Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Request Type:</h4>
            
            {/* Christmas Option */}
            <label className={`block p-3 rounded-lg border cursor-pointer mb-2 ${
              orderType === "CHRISTMAS" ? "border-santa-300 bg-santa-50" : "border-gray-200"
            }`}>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="orderType"
                  value="CHRISTMAS"
                  checked={orderType === "CHRISTMAS"}
                  onChange={(e) => setOrderType(e.target.value as "CHRISTMAS")}
                  className="mr-3"
                  disabled={!christmasWindow?.isActive}
                />
                <div className="flex-1">
                  <div className="font-medium text-santa-700">🎄 Christmas Gift</div>
                  {christmasWindow?.isActive ? (
                    <div className="text-xs text-evergreen-600">
                      ✅ Available now (Dec 11-25)
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      🔒 Available Dec 11-25 ({christmasWindow?.daysUntilStart} days)
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Reward Option */}
            <label className={`block p-3 rounded-lg border cursor-pointer ${
              orderType === "REWARD" ? "border-blueberry-300 bg-blueberry-50" : "border-gray-200"
            }`}>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="orderType"
                  value="REWARD"
                  checked={orderType === "REWARD"}
                  onChange={(e) => setOrderType(e.target.value as "REWARD")}
                  className="mr-3"
                  disabled={!rewardStats || rewardStats.remainingRewardGifts === 0}
                />
                <div className="flex-1">
                  <div className="font-medium text-blueberry-700">⭐ Behavior Reward</div>
                  {rewardStats && (
                    <div className="text-xs text-gray-600">
                      {rewardStats.remainingRewardGifts > 0 ? (
                        <>✅ {rewardStats.remainingRewardGifts} of {rewardStats.maxRewardGifts} rewards left</>
                      ) : (
                        <>🔒 No reward gifts remaining this year</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Behavior Reason (for rewards) */}
          {orderType === "REWARD" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you deserve this reward? *
              </label>
              <textarea
                value={behaviorReason}
                onChange={(e) => setBehaviorReason(e.target.value)}
                placeholder="I helped with chores, was kind to my sister, got good grades..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blueberry-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequest}
              disabled={
                loading || 
                !hasEnoughPoints ||
                (orderType === "CHRISTMAS" && !christmasWindow?.isActive) ||
                (orderType === "REWARD" && (!rewardStats || rewardStats.remainingRewardGifts === 0)) ||
                (orderType === "REWARD" && !behaviorReason.trim())
              }
              loading={loading}
              className="flex-2 bg-evergreen-500 hover:bg-evergreen-600 text-white"
            >
              🎁 Request Gift
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
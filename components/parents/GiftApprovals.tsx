"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getPendingApprovals, approveGiftRequest, getRewardGiftStats, getChristmasWindow } from "@/app/(routes)/children/list/gift-actions";

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

interface PendingApproval {
  _id: string;
  childId: string;
  parentId: string;
  catalogItemId: string;
  orderType: string;
  status: string;
  magicPointsCost: number;
  giftTitle: string;
  giftBrand?: string;
  giftPrice: number;
  giftImageUrl?: string;
  recipientName: string;
  behaviorReason?: string;
  requestedAt?: string;
  createdAt: string;
}

export default function GiftApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [rewardStats, setRewardStats] = useState<Record<string, RewardStats>>({});
  const [christmasWindow, setChristmasWindow] = useState<ChristmasWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pending approvals
      const approvals = await getPendingApprovals();
      setPendingApprovals(approvals as unknown as PendingApproval[]);

      // Load reward stats for each child with reward orders
      if (approvals.length > 0) {
        const rewardApprovals = approvals.filter((approval: unknown) => (approval as PendingApproval).orderType === "REWARD");
        const statsPromises = rewardApprovals.map(async (approval: unknown) => {
          try {
            const stats = await getRewardGiftStats((approval as PendingApproval).childId);
            return { childId: (approval as PendingApproval).childId, stats };
          } catch (error) {
            console.error("Error loading stats for child:", (approval as PendingApproval).childId, error);
            return null;
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = statsResults
          .filter(result => result !== null)
          .reduce((acc: Record<string, RewardStats>, result: { childId: string; stats: RewardStats } | null) => {
            if (result) {
              acc[result.childId] = result.stats;
            }
            return acc;
          }, {});

        setRewardStats(statsMap);
      }

      // Load Christmas window info
      const window = await getChristmasWindow();
      setChristmasWindow(window);

    } catch (error) {
      console.error("Failed to load gift approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (giftOrderId: string, approved: boolean, note?: string) => {
    try {
      setProcessingId(giftOrderId);
      
      const result = await approveGiftRequest(giftOrderId, approved, note);
      
      if (result.success) {
        // Remove from pending list
        setPendingApprovals(prev => prev.filter(approval => approval._id !== giftOrderId));
        
        // Show success message
        alert(result.message);
        
        // Reload data to refresh stats
        await loadData();
      }
    } catch (error) {
      console.error("Failed to process approval:", error);
      alert(error instanceof Error ? error.message : "Failed to process approval");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-santa-50 via-evergreen-50 to-blueberry-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-santa-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gift approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-santa-50 via-evergreen-50 to-blueberry-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-paytone-one text-santa-600 mb-2">
            🎁 Gift Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve gift requests from your children
          </p>
        </div>

        {/* Christmas Window Status */}
        {christmasWindow && (
          <Card className="mb-6 bg-gradient-to-r from-santa-100 to-evergreen-100 border-santa-200">
            <div className="p-4 text-center">
              <h3 className="font-paytone-one text-lg text-santa-700 mb-2">
                🎄 Christmas Window Status
              </h3>
              {christmasWindow.isActive ? (
                <p className="text-evergreen-700">
                  <span className="font-bold">Christmas approvals are ACTIVE!</span><br/>
                  Auto-approving Christmas gifts until December 25th
                </p>
              ) : (
                <p className="text-gray-600">
                  Christmas window opens December 11th<br/>
                  <span className="font-semibold">{christmasWindow.daysUntilStart} days remaining</span>
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Pending Approvals */}
        {pendingApprovals.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-paytone-one text-gray-700 mb-2">
              No Pending Approvals
            </h3>
            <p className="text-gray-600">
              All gift requests have been processed!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((approval: PendingApproval) => (
              <Card key={approval._id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-santa-100 rounded-full flex items-center justify-center">
                        <span className="text-santa-600 font-bold text-lg">
                          {approval.recipientName?.[0] || "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-paytone-one text-gray-800">
                          {approval.recipientName || "Child"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {approval.magicPointsCost} magic points needed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        approval.orderType === "CHRISTMAS" 
                          ? "bg-santa-100 text-santa-700"
                          : "bg-blueberry-100 text-blueberry-700"
                      }`}>
                        {approval.orderType === "CHRISTMAS" ? "🎄 Christmas" : "⭐ Reward"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested {formatDate(approval.requestedAt || approval.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    {approval.giftImageUrl && (
                      <div className="w-16 h-16 relative">
                        <Image
                          src={approval.giftImageUrl}
                          alt={approval.giftTitle}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {approval.giftTitle}
                      </h4>
                      {approval.giftBrand && (
                        <p className="text-sm text-gray-600">
                          by {approval.giftBrand}
                        </p>
                      )}
                      <p className="text-lg font-bold text-evergreen-600">
                        ${(approval.giftPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {approval.behaviorReason && (
                    <div className="bg-blueberry-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blueberry-700 mb-1">
                        Behavior Reason:
                      </p>
                      <p className="text-sm text-blueberry-600">
                        {approval.behaviorReason}
                      </p>
                    </div>
                  )}

                  {approval.orderType === "REWARD" && rewardStats[approval.childId] && (
                    <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-yellow-700 mb-1">
                        Reward Gift Usage:
                      </p>
                      <p className="text-sm text-yellow-600">
                        {rewardStats[approval.childId].usedRewardGifts} of {rewardStats[approval.childId].maxRewardGifts} used this year
                        {rewardStats[approval.childId].remainingRewardGifts === 0 && (
                          <span className="text-red-600 font-medium"> (Limit reached!)</span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApproval(approval._id, true)}
                      disabled={processingId === approval._id}
                      loading={processingId === approval._id}
                      className="flex-1 bg-evergreen-500 hover:bg-evergreen-600 text-white"
                    >
                      ✅ Approve Gift
                    </Button>
                    <Button
                      onClick={() => handleApproval(approval._id, false)}
                      disabled={processingId === approval._id}
                      loading={processingId === approval._id}
                      className="flex-1 border border-santa-300 text-santa-600 hover:bg-santa-50 bg-white"
                    >
                      ❌ Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
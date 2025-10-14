"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaGift, FaLock, FaExclamationTriangle, FaCreditCard, FaCheck, FaCalendarCheck } from "react-icons/fa";

interface ChildGiftSummary {
  childId: string;
  childName: string;
  giftCount: number;
  giftCostCents: number;
  gifts: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface FinalizationSummary {
  totalChildren: number;
  childrenWithGifts: number;
  totalGiftCostCents: number;
  parentWalletBalanceCents: number;
  totalNeighborDonationsCents: number;
  totalAvailableFundsCents: number;
  shortfallCents: number;
  finalBalanceCents: number;
  paymentCharged: number;
  childrenDetails: ChildGiftSummary[];
}

interface FinalizationResult {
  success: boolean;
  message: string;
  summary: FinalizationSummary;
  paymentResult?: {
    paymentIntentId: string;
    amountCharged: number;
    status: string;
  };
  finalizedAt: string;
}

interface ChristmasFinalizationProps {
  isFinalized: boolean;
  finalizedAt?: string;
  listLockDate?: string;
  onFinalizationComplete: () => void;
}

export default function ChristmasFinalization({ 
  isFinalized, 
  finalizedAt, 
  listLockDate,
  onFinalizationComplete 
}: ChristmasFinalizationProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewData, setPreviewData] = useState<FinalizationSummary | null>(null);
  const [finalizationResult, setFinalizationResult] = useState<FinalizationResult | null>(null);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setError(null);

    try {
      const response = await fetch("/api/parent/finalize-christmas/preview", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load preview");
      }

      setPreviewData(result.summary);
      setShowConfirmation(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFinalizeLists = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/parent/finalize-christmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to finalize Christmas lists");
      }

      setFinalizationResult(result);
      setShowConfirmation(false);
      onFinalizationComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isBeforeLockDate = () => {
    if (!listLockDate) return true;
    const lockDate = new Date(listLockDate);
    const today = new Date();
    return today < lockDate;
  };

  const canFinalize = () => {
    return !isFinalized && isBeforeLockDate();
  };

  if (isFinalized) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center mb-4">
          <FaCheck className="text-green-600 text-2xl mr-3" />
          <div>
            <h3 className="text-lg text-center uppercase text-evergreen">
              Christmas Lists Finalized
            </h3>
            <p className="text-green-600 text-sm">
              Completed on {finalizedAt ? new Date(finalizedAt).toLocaleDateString() : "Unknown date"}
            </p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm gray-box">
          <p>✅ All gift lists have been locked and submitted for fulfillment.</p>
          <p>✅ Payment has been processed for the total gift cost.</p>
          <p>✅ Your order is now in the logistics queue for shipment approval.</p>
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-xs text-green-600">
            <FaLock className="inline mr-1" />
            Gift lists are now locked and cannot be modified. 
            Contact support if you need to make changes.
          </p>
        </div>
      </Card>
    );
  }

  if (finalizationResult) {
    return (
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center mb-4">
          <FaCalendarCheck className="text-blue-600 text-2xl mr-3" />
          <h3 className="text-lg font-semibold text-blue-800">
            Finalization Successful!
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-100 rounded">
              <div className="font-semibold text-blue-800">Total Children</div>
              <div className="text-xl text-blue-600">{finalizationResult.summary.totalChildren}</div>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded">
              <div className="font-semibold text-blue-800">Total Gifts</div>
              <div className="text-xl text-blue-600">
                {finalizationResult.summary.childrenDetails.reduce((sum, child) => sum + child.giftCount, 0)}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-100 rounded">
              <div className="font-semibold text-blue-800">Total Cost</div>
              <div className="text-xl text-blue-600">
                ${(finalizationResult.summary.totalGiftCostCents / 100).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Funding Breakdown */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Funding Breakdown:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Your Wallet:</span>
                <span className="font-medium text-blue-800">
                  ${(finalizationResult.summary.parentWalletBalanceCents / 100).toFixed(2)}
                </span>
              </div>
              {finalizationResult.summary.totalNeighborDonationsCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Neighbor Donations:</span>
                  <span className="font-medium text-green-700">
                    ${(finalizationResult.summary.totalNeighborDonationsCents / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-semibold text-gray-800">Total Available:</span>
                <span className="font-bold text-blue-800">
                  ${(finalizationResult.summary.totalAvailableFundsCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {finalizationResult.summary.paymentCharged > 0 && (
            <div className="p-3 bg-green-100 border border-green-200 rounded">
              <div className="flex items-center text-green-800">
                <FaCreditCard className="mr-2" />
                <span className="font-semibold">
                  Payment Processed: ${(finalizationResult.summary.paymentCharged / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Additional payment was charged to cover the full gift cost.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">Children's Gift Summary:</h4>
            {finalizationResult.summary.childrenDetails.map((child) => (
              <div key={child.childId} className="p-3 bg-white border rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{child.childName}</span>
                  <span className="text-sm text-gray-600">
                    {child.giftCount} gifts • ${(child.giftCostCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <FaGift className="text-santa text-2xl mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Finalize Christmas Lists
          </h3>
          <p className="text-gray-600 text-sm">
            Lock all gift lists and process final payment
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded">
          <div className="flex items-center text-red-800">
            <FaExclamationTriangle className="mr-2" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">What happens when you finalize:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>✅ All children's gift lists will be locked (no more changes)</li>
            <li>✅ Total cost will be calculated for all gifts</li>
            <li>✅ Any remaining balance will be charged to your payment method</li>
            <li>✅ Your order will be submitted to our logistics team</li>
            <li>✅ You'll receive confirmation and tracking information</li>
          </ul>
        </div>

        {listLockDate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <FaCalendarCheck className="inline mr-1" />
              {isBeforeLockDate() ? (
                <>Lists will automatically finalize on {new Date(listLockDate).toLocaleDateString()}</>
              ) : (
                <>Automatic finalization date has passed ({new Date(listLockDate).toLocaleDateString()})</>
              )}
            </p>
          </div>
        )}

        <div className="flex justify-center  space-x-6">
          {!showConfirmation ? (
            <Button
              onClick={fetchPreview}
              disabled={!canFinalize() || loadingPreview}
              className="bg-evergreen link-btn hover:bg-[#1E534A]"
            >
              {loadingPreview ? "Loading..." : (isBeforeLockDate() ? "Preview & Finalize" : "Preview & Finalize")}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleFinalizeLists}
                disabled={loading}
                className="link-btn evergreen-btn"
              >
                {loading ? "Processing..." : "Confirm Finalization"}
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmation(false);
                  setError(null);
                }}
                disabled={loading}
                className="link-btn santa-btn"
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {showConfirmation && previewData && (
          <div className="space-y-4">
            {/* Cost Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Order Summary:</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-700">Total Gift Cost:</div>
                  <div className="font-semibold text-right">${(previewData.totalGiftCostCents / 100).toFixed(2)}</div>
                  
                  <div className="text-gray-700">Your Wallet:</div>
                  <div className="text-green-700 text-right">${(previewData.parentWalletBalanceCents / 100).toFixed(2)}</div>
                  
                  {previewData.totalNeighborDonationsCents > 0 && (
                    <>
                      <div className="text-gray-700">Neighbor Donations:</div>
                      <div className="text-green-700 text-right">${(previewData.totalNeighborDonationsCents / 100).toFixed(2)}</div>
                    </>
                  )}
                  
                  <div className="col-span-2 border-t border-blue-300 my-2"></div>
                  
                  <div className="font-semibold text-gray-800">Amount to Charge:</div>
                  <div className="font-bold text-lg text-right text-santa">
                    ${(previewData.shortfallCents / 100).toFixed(2)}
                  </div>
                </div>

                {previewData.shortfallCents === 0 && (
                  <div className="p-2 bg-green-100 rounded text-center text-sm text-green-800">
                    ✅ Fully covered! No additional charge needed.
                  </div>
                )}
              </div>
            </div>

            {/* Final Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-800 mb-2">
                <FaExclamationTriangle className="mr-2" />
                <span className="font-semibold">Final Confirmation</span>
              </div>
              <p className="text-sm text-yellow-700">
                {previewData.shortfallCents > 0 
                  ? `Your card will be charged $${(previewData.shortfallCents / 100).toFixed(2)}. ` 
                  : ''}
                All gift lists will be locked and cannot be modified. Are you sure you want to proceed?
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
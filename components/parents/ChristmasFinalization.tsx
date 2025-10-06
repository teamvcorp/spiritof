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
  previousBalanceCents: number;
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
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<FinalizationResult | null>(null);

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
            <h3 className="text-lg  text-evergreen">
              Christmas Lists Finalized
            </h3>
            <p className="text-green-600 text-sm">
              Completed on {finalizedAt ? new Date(finalizedAt).toLocaleDateString() : "Unknown date"}
            </p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-green-700">
          <p>✅ All gift lists have been locked and submitted for fulfillment</p>
          <p>✅ Payment has been processed for the total gift cost</p>
          <p>✅ Your order is now in the logistics queue for shipment approval</p>
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

        <div className="flex space-x-3">
          {!showConfirmation ? (
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={!canFinalize() || loading}
              className="bg-santa hover:bg-red-700 text-white"
            >
              <FaGift className="mr-2" />
              {isBeforeLockDate() ? "Finalize Early" : "Finalize Now"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleFinalizeLists}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Processing..." : "Confirm Finalization"}
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmation(false);
                  setError(null);
                }}
                disabled={loading}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {showConfirmation && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800 mb-2">
              <FaExclamationTriangle className="mr-2" />
              <span className="font-semibold">Final Confirmation</span>
            </div>
            <p className="text-sm text-yellow-700">
              This action cannot be undone. All gift lists will be locked and final payment will be processed. 
              Are you sure you want to proceed?
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
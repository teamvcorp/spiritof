"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { FaCheck, FaTruck, FaExclamationTriangle, FaShippingFast, FaDollarSign, FaUsers, FaGift, FaUndo } from "react-icons/fa";

interface GiftItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

interface ChildWithGifts {
  _id: string;
  displayName: string;
  gifts: GiftItem[];
  totalGiftCostCents: number;
  canAffordGifts: boolean;
  score365: number;
}

interface FamilyData {
  _id: string;
  name: string;
  email: string;
  walletBalanceCents: number;
  christmasSettings: {
    shippingAddress?: {
      recipientName?: string;
      street?: string;
      apartment?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    shipmentApproved?: boolean;
    shipmentApprovedAt?: string;
    shipped?: boolean;
    shippedAt?: string;
    trackingNumber?: string;
    carrier?: string;
  };
  childrenWithGifts: ChildWithGifts[];
  totalFamilyGiftCostCents: number;
  canAffordAllGifts: boolean;
  paymentCoverage: number;
  successfulPayments: number;
  totalSuccessfulPayments: number;
}

interface LogisticsStats {
  totalFamilies: number;
  fullyFundedFamilies: number;
  totalValue: number;
}

interface LogisticsData {
  readyForShipment: FamilyData[];
  stats: LogisticsStats;
}

export default function LogisticsManager() {
  const [data, setData] = useState<LogisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "shipped">("all");

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Fetching logistics data...");
      
      const response = await fetch("/api/admin/logistics");
      console.log("📡 Response status:", response.status);
      
      const result = await response.json();
      console.log("📋 Response data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setData(result);
    } catch (err) {
      console.error("❌ Logistics fetch error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveForShipment = async (parentId: string) => {
    setActionLoading(parentId);
    try {
      const response = await fetch("/api/admin/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_for_shipment",
          parentId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      await fetchLogisticsData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetFinalization = async (parentId: string) => {
    if (!confirm("Are you sure you want to reset the finalization status? This will unlock the gift lists and allow modifications again.")) {
      return;
    }

    setActionLoading(parentId);
    try {
      const response = await fetch("/api/admin/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_finalization",
          parentId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      await fetchLogisticsData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset finalization");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkShipped = async (parentId: string, trackingNumber: string, carrier: string) => {
    setActionLoading(parentId);
    try {
      const response = await fetch("/api/admin/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_shipped",
          parentId,
          trackingNumber,
          carrier
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      await fetchLogisticsData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as shipped");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredFamilies = data?.readyForShipment?.filter(family => {
    if (filter === "approved") return family.christmasSettings.shipmentApproved && !family.christmasSettings.shipped;
    if (filter === "shipped") return family.christmasSettings.shipped;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-santa mx-auto mb-4"></div>
          <p className="text-gray-600">Loading logistics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchLogisticsData} className="bg-santa hover:bg-red-700">
          Try Again
        </Button>
        <div className="mt-4 text-sm text-gray-500">
          <p>Debug: Make sure you're logged in as an admin user.</p>
          <p>Check the browser console for more details.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center bg-gradient-to-br from-santa-50 to-santa-100">
          <FaUsers className="text-santa text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-santa">{data?.stats.fullyFundedFamilies}</div>
          <div className="text-sm text-gray-600">Ready Families</div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-evergreen-50 to-evergreen-100">
          <FaDollarSign className="text-evergreen text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-evergreen">
            ${((data?.stats.totalValue || 0) / 100).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-blueberry-50 to-blueberry-100">
          <FaGift className="text-blueberry text-3xl mx-auto mb-2" />
          <div className="text-2xl font-bold text-blueberry">
            {filteredFamilies.reduce((sum, f) => 
              sum + f.childrenWithGifts.reduce((childSum, c) => childSum + c.gifts.length, 0), 0
            )}
          </div>
          <div className="text-sm text-gray-600">Total Gifts</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all" 
              ? "border-santa text-santa" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({data?.readyForShipment.length || 0})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "approved" 
              ? "border-santa text-santa" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Approved ({data?.readyForShipment.filter(f => f.christmasSettings.shipmentApproved && !f.christmasSettings.shipped).length || 0})
        </button>
        <button
          onClick={() => setFilter("shipped")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "shipped" 
              ? "border-santa text-santa" 
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Shipped ({data?.readyForShipment.filter(f => f.christmasSettings.shipped).length || 0})
        </button>
      </div>

      {/* Family List */}
      <div className="space-y-6">
        {filteredFamilies.length === 0 ? (
          <Card className="p-8 text-center">
            <FaGift className="text-gray-400 text-5xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No families found
            </h3>
            <p className="text-gray-500">
              {filter === "all" ? "No families are ready for shipment yet." :
               filter === "approved" ? "No families are approved and pending shipment." :
               "No orders have been shipped yet."}
            </p>
          </Card>
        ) : (
          filteredFamilies.map((family) => (
            <FamilyLogisticsCard
              key={family._id}
              family={family}
              onApprove={() => handleApproveForShipment(family._id)}
              onMarkShipped={(tracking, carrier) => handleMarkShipped(family._id, tracking, carrier)}
              onResetFinalization={() => handleResetFinalization(family._id)}
              loading={actionLoading === family._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FamilyLogisticsCardProps {
  family: FamilyData;
  onApprove: () => void;
  onMarkShipped: (trackingNumber: string, carrier: string) => void;
  onResetFinalization: () => void;
  loading: boolean;
}

function FamilyLogisticsCard({ family, onApprove, onMarkShipped, onResetFinalization, loading }: FamilyLogisticsCardProps) {
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("FedEx");

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      onMarkShipped(trackingNumber.trim(), carrier);
      setShowShippingForm(false);
      setTrackingNumber("");
    }
  };

  const getStatusBadge = () => {
    if (family.christmasSettings.shipped) {
      return (
        <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
          <FaTruck className="mr-2" />
          Shipped
        </div>
      );
    }
    if (family.christmasSettings.shipmentApproved) {
      return (
        <div className="flex items-center text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm">
          <FaCheck className="mr-2" />
          Approved
        </div>
      );
    }
    return (
      <div className="flex items-center text-orange-600 bg-orange-100 px-3 py-1 rounded-full text-sm">
        <FaExclamationTriangle className="mr-2" />
        Pending Review
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{family.name}</h3>
          <p className="text-gray-600">{family.email}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Payment & Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Wallet Balance</div>
          <div className="text-lg font-semibold text-green-600">
            ${(family.walletBalanceCents / 100).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Gift Cost</div>
          <div className="text-lg font-semibold text-gray-900">
            ${(family.totalFamilyGiftCostCents / 100).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Coverage</div>
          <div className={`text-lg font-semibold ${
            family.paymentCoverage >= 100 ? "text-green-600" : "text-orange-600"
          }`}>
            {family.paymentCoverage.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {family.christmasSettings.shippingAddress && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Shipping Address</h4>
          <div className="text-sm text-blue-800">
            <div>{family.christmasSettings.shippingAddress.recipientName}</div>
            <div>{family.christmasSettings.shippingAddress.street}</div>
            {family.christmasSettings.shippingAddress.apartment && (
              <div>{family.christmasSettings.shippingAddress.apartment}</div>
            )}
            <div>
              {family.christmasSettings.shippingAddress.city}, {family.christmasSettings.shippingAddress.state} {family.christmasSettings.shippingAddress.zipCode}
            </div>
          </div>
        </div>
      )}

      {/* Children & Gifts */}
      <div className="space-y-4 mb-6">
        {family.childrenWithGifts.map((child) => (
          <div key={child._id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{child.displayName}</h4>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Magic Score: <span className="font-semibold">{child.score365}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Cost: <span className="font-semibold">${(child.totalGiftCostCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {child.gifts.map((gift) => (
                <div key={gift._id} className="flex items-center space-x-3 p-2 border rounded">
                  {gift.imageUrl && (
                    <Image
                      src={gift.imageUrl}
                      alt={gift.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {gift.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(gift.price / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tracking Information */}
      {family.christmasSettings.shipped && family.christmasSettings.trackingNumber && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Shipping Information</h4>
          <div className="text-sm text-green-800">
            <div><strong>Carrier:</strong> {family.christmasSettings.carrier}</div>
            <div><strong>Tracking:</strong> {family.christmasSettings.trackingNumber}</div>
            <div><strong>Shipped:</strong> {new Date(family.christmasSettings.shippedAt!).toLocaleDateString()}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!family.christmasSettings.shipmentApproved && (
          <Button
            onClick={onApprove}
            disabled={loading || !family.canAffordAllGifts}
            className="bg-evergreen hover:bg-green-700 text-white"
          >
            {loading ? "Processing..." : "Approve for Shipment"}
          </Button>
        )}
        
        {family.christmasSettings.shipmentApproved && !family.christmasSettings.shipped && (
          <Button
            onClick={() => setShowShippingForm(true)}
            disabled={loading}
            className="bg-santa hover:bg-red-700 text-white"
          >
            <FaShippingFast className="mr-2" />
            Mark as Shipped
          </Button>
        )}

        {/* Reset Finalization Button - Admin Testing Feature */}
        <Button
          onClick={onResetFinalization}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          title="Reset finalization status for testing purposes"
        >
          <FaUndo className="mr-2" />
          Reset Finalization
        </Button>
      </div>

      {/* Shipping Form Modal */}
      {showShippingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Shipping Information</h3>
            <form onSubmit={handleSubmitShipping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-santa focus:border-santa"
                >
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Amazon">Amazon Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-santa focus:border-santa"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={loading || !trackingNumber.trim()}
                  className="flex-1 bg-santa hover:bg-red-700"
                >
                  {loading ? "Processing..." : "Confirm Shipping"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowShippingForm(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}
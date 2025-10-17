"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { FaCheck, FaTimes, FaGift, FaHeart, FaClock, FaUser, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import { useToast } from "@/components/ui/Toast";

interface SpecialRequest {
  type: 'early_gift' | 'friend_gift';
  requestId: string;
  childId: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  giftTitle: string;
  giftPrice: number;
  giftImageUrl?: string;
  reason?: string;
  friendName?: string;
  friendAddress?: string;
  message?: string;
  requestedPoints: number;
  requestedAt: string;
  status: string;
  respondedAt?: string;
  parentResponse?: string;
  shippingAddress?: {
    recipientName?: string;
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
}

interface SpecialRequestsStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  earlyGiftRequests: number;
  friendGiftRequests: number;
  totalValue: number;
}

interface SpecialRequestsData {
  requests: SpecialRequest[];
  stats: SpecialRequestsStats;
}

export default function SpecialRequestsManager() {
  const { showToast } = useToast();
  const [data, setData] = useState<SpecialRequestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "early_gifts" | "friend_gifts">("all");

  useEffect(() => {
    fetchSpecialRequests();
  }, []);

  const fetchSpecialRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/special-requests');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch special requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch special requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, childId: string, requestType: string, action: 'approve' | 'deny') => {
    try {
      setActionLoading(`${requestId}-${action}`);
      const response = await fetch('/api/admin/special-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          childId,
          requestId,
          requestType
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} request`);
      }

      const result = await response.json();
      showToast('success', result.message || `Request ${action}d successfully! 🎅`);

      // Refresh data
      await fetchSpecialRequests();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} request`;
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredRequests = () => {
    if (!data) return [];
    
    switch (filter) {
      case "pending":
        return data.requests.filter(r => r.status === 'pending');
      case "approved":
        return data.requests.filter(r => r.status === 'approved');
      case "early_gifts":
        return data.requests.filter(r => r.type === 'early_gift');
      case "friend_gifts":
        return data.requests.filter(r => r.type === 'friend_gift');
      default:
        return data.requests;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading special requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center text-red-800">
          <FaTimes className="mr-2" />
          <span className="font-medium">Error loading special requests</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <Button 
          onClick={fetchSpecialRequests}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <FaClock className="text-blue-600 mr-3 text-xl" />
              <div>
                <div className="text-2xl font-bold text-blue-800">{data.stats.totalRequests}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <FaClock className="text-yellow-600 mr-3 text-xl" />
              <div>
                <div className="text-2xl font-bold text-yellow-800">{data.stats.pendingRequests}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center">
              <FaCheck className="text-green-600 mr-3 text-xl" />
              <div>
                <div className="text-2xl font-bold text-green-800">{data.stats.approvedRequests}</div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <FaGift className="text-orange-600 mr-3 text-xl" />
              <div>
                <div className="text-2xl font-bold text-orange-800">{data.stats.earlyGiftRequests}</div>
                <div className="text-sm text-orange-600">Early</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-pink-50 border-pink-200">
            <div className="flex items-center">
              <FaHeart className="text-pink-600 mr-3 text-xl" />
              <div>
                <div className="text-2xl font-bold text-pink-800">{data.stats.friendGiftRequests}</div>
                <div className="text-sm text-pink-600">Friend</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center">
              <span className="text-emerald-600 mr-3 text-xl font-bold">$</span>
              <div>
                <div className="text-2xl font-bold text-emerald-800">${data.stats.totalValue}</div>
                <div className="text-sm text-emerald-600">Value</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setFilter("all")}
          className={`${filter === "all" ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-400 hover:bg-gray-500"}`}
        >
          All ({data?.stats.totalRequests || 0})
        </Button>
        <Button
          onClick={() => setFilter("pending")}
          className={`${filter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-400 hover:bg-yellow-500"}`}
        >
          <FaClock className="mr-2" />
          Pending ({data?.stats.pendingRequests || 0})
        </Button>
        <Button
          onClick={() => setFilter("approved")}
          className={`${filter === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-green-400 hover:bg-green-500"}`}
        >
          <FaCheck className="mr-2" />
          Approved ({data?.stats.approvedRequests || 0})
        </Button>
        <Button
          onClick={() => setFilter("early_gifts")}
          className={`${filter === "early_gifts" ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-400 hover:bg-orange-500"}`}
        >
          <FaGift className="mr-2" />
          Early Gifts ({data?.stats.earlyGiftRequests || 0})
        </Button>
        <Button
          onClick={() => setFilter("friend_gifts")}
          className={`${filter === "friend_gifts" ? "bg-pink-600 hover:bg-pink-700" : "bg-pink-400 hover:bg-pink-500"}`}
        >
          <FaHeart className="mr-2" />
          Friend Gifts ({data?.stats.friendGiftRequests || 0})
        </Button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <FaClock className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Special Requests</h3>
          <p className="text-gray-400">
            {filter === "all" 
              ? "No early gift or friend gift requests pending approval."
              : `No ${filter.replace('_', ' ')} requests pending approval.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={`${request.requestId}-${request.type}`} className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Gift Image & Details */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                    {request.giftImageUrl ? (
                      <Image
                        src={request.giftImageUrl}
                        alt={request.giftTitle}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaGift className="text-gray-400 text-3xl" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white ${
                      request.type === 'early_gift' ? 'bg-orange-500' : 'bg-pink-500'
                    }`}>
                      {request.type === 'early_gift' ? 'Early Gift' : 'Friend Gift'}
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{request.giftTitle}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                          : 'bg-green-100 text-green-800 border border-green-300'
                      }`}>
                        {request.status === 'pending' ? '⏳ Awaiting Parent' : '✅ Parent Approved'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">${request.giftPrice}</span>
                      <span>•</span>
                      <span>{request.requestedPoints} magic points</span>
                      <span>•</span>
                      <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                      {request.respondedAt && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Approved {new Date(request.respondedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Child & Parent Info */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <FaUser className="mr-2 text-gray-600" />
                        Child & Parent Info
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Child:</strong> {request.childName}</div>
                        <div><strong>Parent:</strong> {request.parentName}</div>
                        <div className="flex items-center">
                          <FaEnvelope className="mr-1" />
                          {request.parentEmail}
                        </div>
                      </div>
                    </div>

                    {/* Type-specific Info */}
                    <div>
                      {request.type === 'early_gift' ? (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Reason for Early Gift</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {request.reason}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <FaHeart className="mr-2 text-gray-600" />
                            Friend Gift Details
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Friend:</strong> {request.friendName}</div>
                            <div className="flex items-start">
                              <FaMapMarkerAlt className="mr-1 mt-1 flex-shrink-0" />
                              <div>{request.friendAddress}</div>
                            </div>
                            {request.message && (
                              <div className="bg-gray-50 p-2 rounded mt-2">
                                <strong>Message:</strong> {request.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parent Response */}
                  {request.parentResponse && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <FaCheck className="mr-2" />
                        Parent's Message to Child:
                      </h4>
                      <p className="text-sm text-green-700">{request.parentResponse}</p>
                    </div>
                  )}

                  {/* Shipping Address (for early gifts) */}
                  {request.type === 'early_gift' && request.shippingAddress && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-gray-600" />
                        Shipping Address
                      </h4>
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        <div>{request.shippingAddress.recipientName}</div>
                        <div>{request.shippingAddress.street}</div>
                        {request.shippingAddress.apartment && <div>{request.shippingAddress.apartment}</div>}
                        <div>{request.shippingAddress.city}, {request.shippingAddress.state} {request.shippingAddress.zipCode}</div>
                        {request.shippingAddress.country && <div>{request.shippingAddress.country}</div>}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleRequestAction(request.requestId, request.childId, request.type, 'approve')}
                      disabled={actionLoading === `${request.requestId}-approve`}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === `${request.requestId}-approve` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FaCheck className="mr-2" />
                      )}
                      Approve & Process
                    </Button>
                    <Button
                      onClick={() => handleRequestAction(request.requestId, request.childId, request.type, 'deny')}
                      disabled={actionLoading === `${request.requestId}-deny`}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {actionLoading === `${request.requestId}-deny` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FaTimes className="mr-2" />
                      )}
                      Deny & Refund
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
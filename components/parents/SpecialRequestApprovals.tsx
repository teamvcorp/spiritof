"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { FaGift, FaHeart, FaClock, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { useToast } from "@/components/ui/Toast";

interface SpecialRequest {
  requestId: string;
  childId: string;
  childName: string;
  type: 'early_gift' | 'friend_gift';
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
}

export default function SpecialRequestApprovals() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parentResponse, setParentResponse] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/parent/special-requests');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch special requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch special requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, childId: string, requestType: string, action: 'approve' | 'deny') => {
    try {
      setActionLoading(`${requestId}-${action}`);
      
      const response = await fetch('/api/parent/special-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          requestId,
          requestType,
          action,
          parentResponse: parentResponse[requestId] || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }

      const result = await response.json();
      showToast('success', result.message || `Request ${action}d successfully! 🎅`);
      
      // Clear response text
      setParentResponse(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });

      // Refresh list
      await fetchPendingRequests();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} request`;
      setError(errorMsg);
      showToast('error', errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-santa text-3xl mr-3" />
          <p className="text-gray-600">Loading special requests...</p>
        </div>
      </Card>
    );
  }

  if (error && requests.length === 0) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center text-red-800">
          <FaTimes className="mr-2" />
          <span className="font-medium">Error loading special requests</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <Button 
          onClick={fetchPendingRequests}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-paytone-one text-gray-700 mb-2">
          No Pending Requests
        </h3>
        <p className="text-gray-600">
          All special requests have been processed!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-paytone-one text-white">
          Special Request Approvals
        </h2>
        <div className="bg-santa text-white px-4 py-2 rounded-full font-medium">
          {requests.length} Pending
        </div>
      </div>

      {requests.map((request) => (
        <Card key={request.requestId} className="overflow-hidden bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-santa to-evergreen rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {request.childName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-paytone-one text-gray-800">
                    {request.childName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="text-gray-400" />
                    {new Date(request.requestedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                request.type === 'early_gift' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-pink-100 text-pink-800'
              }`}>
                {request.type === 'early_gift' ? (
                  <><FaGift className="inline mr-1" /> Early Gift</>
                ) : (
                  <><FaHeart className="inline mr-1" /> Friend Gift</>
                )}
              </div>
            </div>

            {/* Gift Details */}
            <div className="flex gap-4 mb-4">
              {request.giftImageUrl && (
                <div className="w-24 h-24 relative flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={request.giftImageUrl}
                    alt={request.giftTitle}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-800 mb-1">
                  {request.giftTitle}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <span className="font-bold text-evergreen text-lg">
                    ${request.giftPrice.toFixed(2)}
                  </span>
                  <span>•</span>
                  <span className="bg-blueberry/10 text-blueberry px-2 py-1 rounded">
                    {request.requestedPoints} magic points
                  </span>
                </div>

                {/* Type-Specific Details */}
                {request.type === 'early_gift' && request.reason && (
                  <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                    <p className="text-sm font-medium text-orange-800 mb-1">Reason:</p>
                    <p className="text-sm text-orange-700">{request.reason}</p>
                  </div>
                )}

                {request.type === 'friend_gift' && (
                  <div className="bg-pink-50 p-3 rounded-lg border-l-4 border-pink-400">
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-pink-800">
                        <FaHeart className="inline mr-1" />
                        Friend: {request.friendName}
                      </p>
                      <p className="text-pink-700">📍 {request.friendAddress}</p>
                      {request.message && (
                        <p className="text-pink-700 italic mt-2">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Response Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a message (optional):
              </label>
              <textarea
                value={parentResponse[request.requestId] || ''}
                onChange={(e) => setParentResponse(prev => ({
                  ...prev,
                  [request.requestId]: e.target.value
                }))}
                placeholder="Add a personal message to your child..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blueberry focus:border-blueberry resize-none"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleApproval(request.requestId, request.childId, request.type, 'approve')}
                disabled={!!actionLoading}
                className="flex-1 bg-evergreen hover:bg-green-600 text-white font-medium py-3"
              >
                {actionLoading === `${request.requestId}-approve` ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Approve Request
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleApproval(request.requestId, request.childId, request.type, 'deny')}
                disabled={!!actionLoading}
                className="flex-1 bg-white hover:bg-gray-50 text-santa border-2 border-santa font-medium py-3"
              >
                {actionLoading === `${request.requestId}-deny` ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Denying...
                  </>
                ) : (
                  <>
                    <FaTimes className="mr-2" />
                    Deny Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
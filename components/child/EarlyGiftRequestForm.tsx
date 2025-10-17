"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaGift, FaStar, FaCheck, FaSpinner } from "react-icons/fa";
import { useToast } from "@/components/ui/Toast";

interface Gift {
  _id: string;
  title: string;
  imageUrl: string;
  price: number;
  brand?: string;
  retailer?: string;
}

interface EarlyGiftRequestFormProps {
  childId: string;
  gifts: Gift[];
  magicPoints: number;
  childName: string;
}

export default function EarlyGiftRequestForm({ 
  childId, 
  gifts, 
  magicPoints, 
  childName 
}: EarlyGiftRequestFormProps) {
  const { showToast } = useToast();
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calculate magic points required (roughly 1 point per dollar, minimum 10)
  const calculateRequiredPoints = (price: number) => {
    return Math.max(10, Math.ceil(price));
  };

  const handleSubmit = async () => {
    if (!selectedGift || !reason.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/children/early-gift-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          giftId: selectedGift._id,
          reason: reason.trim(),
          requestedPoints: calculateRequiredPoints(selectedGift.price)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);
        showToast('success', data.message || 'Early gift request submitted! 🎁');
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to submit request');
      }
    } catch (error) {
      showToast('error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-12 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-800 mb-4">Gift Approved!</h2>
        <p className="text-green-700 mb-2">
          Your early gift request for <strong>{selectedGift?.title}</strong> has been approved!
        </p>
        <p className="text-sm text-green-600 mb-4">
          🎅 Santa's workshop has received your order and will process it soon!
        </p>
        <p className="text-xs text-green-500">
          Keep being good and your gift will be on its way! ⭐
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Choose a Gift</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => {
              const requiredPoints = calculateRequiredPoints(gift.price);
              const canAfford = magicPoints >= requiredPoints;
              const isSelected = selectedGift?._id === gift._id;

              return (
                <div
                  key={gift._id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-santa-500 bg-santa-50 shadow-lg scale-105' 
                      : canAfford 
                        ? 'border-gray-200 hover:border-santa-300 hover:shadow-md'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canAfford && setSelectedGift(gift)}
                >
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={gift.imageUrl}
                      alt={gift.title}
                      fill
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-santa-500 text-white rounded-full p-1">
                        <FaCheck className="text-sm" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                    {gift.title}
                  </h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-santa-600">${gift.price}</span>
                    <div className={`flex items-center ${
                      canAfford ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <FaStar className="mr-1 text-xs" />
                      <span className="font-medium">{requiredPoints}</span>
                    </div>
                  </div>
                  {!canAfford && (
                    <div className="text-xs text-red-500 mt-1 text-center">
                      Need {requiredPoints - magicPoints} more points
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {selectedGift && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Step 2: Explain Why You Deserve It</h2>
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Selected Gift:</h3>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={selectedGift.imageUrl}
                    alt={selectedGift.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-800">{selectedGift.title}</div>
                  <div className="text-sm text-gray-600">${selectedGift.price}</div>
                  <div className="text-xs text-blue-600 flex items-center">
                    <FaStar className="mr-1" />
                    {calculateRequiredPoints(selectedGift.price)} magic points required
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you deserve this gift early? ✨
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell your parents about your good behavior, achievements, or special accomplishments that make you deserve this early gift..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {reason.length}/500 characters
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Tips for a good request:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Mention specific good things you've done recently</li>
                <li>• Explain why this gift would make you happy</li>
                <li>• Promise to continue being good</li>
                <li>• Be honest and heartfelt</li>
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || loading}
              className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-200 ${
                !reason.trim() || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-santa-500 to-santa-600 hover:from-santa-600 hover:to-santa-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <FaGift className="mr-2" />
                  Send Early Gift Request
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
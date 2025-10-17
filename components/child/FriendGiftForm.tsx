"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaHeart, FaStar, FaCheck, FaSpinner, FaGift } from "react-icons/fa";
import { useToast } from "@/components/ui/Toast";

interface Gift {
  _id: string;
  title: string;
  imageUrl: string;
  price: number;
  brand?: string;
  retailer?: string;
}

interface FriendGiftFormProps {
  childId: string;
  gifts: Gift[];
  magicPoints: number;
  childName: string;
  maxGiftValue: number;
}

export default function FriendGiftForm({ 
  childId, 
  gifts, 
  magicPoints, 
  childName,
  maxGiftValue 
}: FriendGiftFormProps) {
  const { showToast } = useToast();
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [friendName, setFriendName] = useState("");
  const [friendAddress, setFriendAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calculate magic points required (higher cost for friend gifts)
  const calculateRequiredPoints = (price: number) => {
    return Math.max(20, Math.ceil(price * 1.5)); // 1.5x for friend gifts
  };

  const handleSubmit = async () => {
    if (!selectedGift || !friendName.trim() || !friendAddress.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/children/friend-gift-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          giftId: selectedGift._id,
          friendName: friendName.trim(),
          friendAddress: friendAddress.trim(),
          message: message.trim(),
          requestedPoints: calculateRequiredPoints(selectedGift.price)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);
        showToast('success', data.message || 'Friend gift request submitted! 💝');
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
      <Card className="text-center py-12 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200">
        <div className="text-6xl mb-4">💖</div>
        <h2 className="text-2xl font-bold text-pink-800 mb-4">Friend Gift Request Sent!</h2>
        <p className="text-pink-700 mb-2">
          Your request to send <strong>{selectedGift?.title}</strong> to <strong>{friendName}</strong> has been sent to your parents!
        </p>
        <p className="text-sm text-pink-600">
          What a thoughtful friend you are! Your parents will review your request. 🎁
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Step 1: Choose a Gift for Your Friend</h2>
          
          {(() => {
            const affordableGifts = gifts.filter(gift => 
              gift.price <= maxGiftValue && magicPoints >= calculateRequiredPoints(gift.price)
            );
            const filteredGifts = gifts.filter(gift => gift.price <= maxGiftValue);
            
            if (filteredGifts.length === 0) {
              return (
                <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-xl font-bold text-orange-800 mb-3">No Friend Gifts Available</h3>
                  <p className="text-orange-700 mb-4">
                    The maximum friend gift value is <strong>${maxGiftValue}</strong>, but there are no gifts in that price range.
                  </p>
                  <p className="text-sm text-orange-600">
                    Ask your parents to adjust the friend gift limit or check back later for new gifts!
                  </p>
                </div>
              );
            }
            
            if (affordableGifts.length === 0) {
              const cheapestGift = filteredGifts.reduce((min, gift) => 
                calculateRequiredPoints(gift.price) < calculateRequiredPoints(min.price) ? gift : min
              );
              const pointsNeeded = calculateRequiredPoints(cheapestGift.price) - magicPoints;
              
              return (
                <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-xl font-bold text-blue-800 mb-3">Earn More Magic to Surprise Your Friends!</h3>
                  <p className="text-blue-700 mb-4">
                    You need <strong>{pointsNeeded} more magic points</strong> to send gifts to your friends.
                  </p>
                  <div className="text-sm text-blue-600 space-y-2 mb-6">
                    <p>💫 Do good deeds and help around the house</p>
                    <p>🎯 Ask your parents to vote for your good behavior</p>
                    <p>🤝 Share your donation link with neighbors and family</p>
                    <p>📚 Excel in school and show kindness to others</p>
                  </div>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 inline-block">
                    <p className="text-blue-800 font-medium">
                      Cheapest friend gift: <strong>{cheapestGift.title}</strong>
                    </p>
                    <p className="text-blue-700 text-sm">
                      ${cheapestGift.price} • {calculateRequiredPoints(cheapestGift.price)} magic points
                    </p>
                  </div>
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGifts.map((gift) => {
              const requiredPoints = calculateRequiredPoints(gift.price);
              const canAfford = magicPoints >= requiredPoints;
              const isSelected = selectedGift?._id === gift._id;

              return (
                <div
                  key={gift._id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-berryPink-500 bg-berryPink-50 shadow-lg scale-105' 
                      : canAfford 
                        ? 'border-gray-200 hover:border-berryPink-300 hover:shadow-md'
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
                      <div className="absolute top-2 right-2 bg-berryPink-500 text-white rounded-full p-1">
                        <FaCheck className="text-sm" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                    {gift.title}
                  </h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-berryPink-600">${gift.price}</span>
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
            );
          })()}
        </div>
      </Card>

      {selectedGift && (
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Step 2: Friend Details</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Gift Selected:</h3>
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
                  <div className="text-xs text-pink-600 flex items-center">
                    <FaStar className="mr-1" />
                    {calculateRequiredPoints(selectedGift.price)} magic points required
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend's Name 👫
                </label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="Enter your friend's full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend's Address 🏠
                </label>
                <textarea
                  value={friendAddress}
                  onChange={(e) => setFriendAddress(e.target.value)}
                  placeholder="Enter your friend's complete mailing address..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  rows={3}
                  maxLength={300}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {friendAddress.length}/300 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Message 💌
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a sweet message to include with your gift..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {message.length}/200 characters
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <span className="mr-2">✨</span>
                Friend Gift Rules:
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Friend gifts cost extra magic points (showing extra kindness!)</li>
                <li>• Maximum gift value for friends: ${maxGiftValue}</li>
                <li>• Make sure you have your friend's correct address</li>
                <li>• Your parents will review before sending</li>
                <li>• This is a wonderful way to spread Christmas joy!</li>
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!friendName.trim() || !friendAddress.trim() || !message.trim() || loading}
              className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-200 ${
                !friendName.trim() || !friendAddress.trim() || !message.trim() || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-berryPink-500 to-berryPink-600 hover:from-berryPink-600 hover:to-berryPink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <FaHeart className="mr-2" />
                  Send Friend Gift Request
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
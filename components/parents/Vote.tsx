"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { FaHeart, FaStar, FaGift } from "react-icons/fa";

type Child = {
  _id: string;
  displayName: string;
  score365: number;
  avatarUrl?: string;
};

type VoteComponentProps = {
  child: Child;
  parentWalletBalance: number;
};

export default function Vote({ child, parentWalletBalance }: VoteComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const voteOptions = [
    { points: 1, cost: 1.00, icon: <FaHeart />, label: "Good Deed", color: "bg-berryPink" },
    { points: 5, cost: 5.00, icon: <FaStar />, label: "Great Day", color: "bg-blueberry" },
    { points: 10, cost: 10.00, icon: <FaGift />, label: "Amazing Week", color: "bg-santa" },
  ];

  const handleVote = async (magicPointsToAdd: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/parent/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child._id,
          magicPointsToAdd,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to vote");
      }

      setSuccess(data.message);
      // Refresh the page to show updated scores and balance
      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (cost: number) => parentWalletBalance >= cost * 100; // cost is in dollars, balance in cents

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-white">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-evergreen">
          Vote for {child.displayName}
        </h3>
        <p className="text-sm text-gray-600">
          Magic Score: {child.score365}/365 days
        </p>
        <p className="text-xs text-gray-500">
          Wallet Balance: ${(parentWalletBalance / 100).toFixed(2)}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {voteOptions.map((option) => (
          <Button
            key={option.points}
            onClick={() => handleVote(option.points)}
            disabled={loading || !canAfford(option.cost)}
            className={`${option.color} text-white flex flex-col items-center gap-2 py-3 ${
              !canAfford(option.cost) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="text-xl">{option.icon}</div>
            <div className="text-center">
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs">+{option.points} magic</div>
              <div className="text-xs">${option.cost.toFixed(2)}</div>
            </div>
          </Button>
        ))}
      </div>

      <div className="text-xs text-center text-gray-500">
        You can vote once per day for each child. Voting costs magic budget funds.
      </div>
    </div>
  );
}
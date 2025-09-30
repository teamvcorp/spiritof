"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { FaHeart, FaGift } from "react-icons/fa";

type DonationFormProps = {
  childId: string;
  childName: string;
};

export default function DonationForm({ childId, childName }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonation = async (amount: number) => {
    setLoading(true);
    setError(null);

    try {
      const donorName = prompt(`Your name (for ${childName}):`);
      if (!donorName) {
        setLoading(false);
        return;
      }

      const donorEmail = prompt("Your email (optional):") || "";
      const message = prompt("Message for the family (optional):") || "";

      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          amount: amount * 100, // Convert to cents
          donorName,
          donorEmail: donorEmail || undefined,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create donation");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { amount: 1, icon: <FaHeart />, label: "$1", color: "bg-berryPink hover:bg-pink-600" },
          { amount: 5, icon: <FaGift />, label: "$5", color: "bg-blueberry hover:bg-blue-600" },
          { amount: 10, icon: <FaGift />, label: "$10", color: "bg-evergreen hover:bg-green-600" },
          { amount: 25, icon: <FaGift />, label: "$25", color: "bg-santa hover:bg-red-600" },
        ].map((option) => (
          <Button
            key={option.amount}
            onClick={() => handleDonation(option.amount)}
            disabled={loading}
            className={`${option.color} text-white flex flex-col items-center gap-2 py-4`}
          >
            <div className="text-xl">{option.icon}</div>
            <div className="text-center">
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs">+{option.amount} magic</div>
            </div>
          </Button>
        ))}
      </div>

      <div className="text-xs text-center text-gray-500">
        Secure payment powered by Stripe. Your donation helps {childName} earn Christmas magic!
      </div>
    </div>
  );
}
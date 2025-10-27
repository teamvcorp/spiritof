"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { FaCreditCard, FaDollarSign } from "react-icons/fa";
import WalletTopupModal from "./WalletTopupModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type WalletTopupProps = {
  currentBalance: number;
};

export default function WalletTopup({ currentBalance }: WalletTopupProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
    paymentIntentId: string;
  } | null>(null);

  const handleTopup = async (amount: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          description: `Christmas Magic Wallet Top-up - $${amount}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Show payment modal with client secret
      if (data.clientSecret) {
        setPaymentData({
          clientSecret: data.clientSecret,
          amount: amount,
          paymentIntentId: data.paymentIntentId,
        });
        setShowPaymentModal(true);
        setLoading(false);
      } else {
        throw new Error("No client secret received");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    toast.success(`💰 Wallet topped up successfully!`);
    router.refresh();
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    setLoading(false);
  };

  const topupOptions = [
    { amount: 10, label: "$10", popular: false },
    { amount: 25, label: "$25", popular: true },
    { amount: 50, label: "$50", popular: false },
    { amount: 100, label: "$100", popular: false },
  ];

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-white">
      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <WalletTopupModal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          clientSecret={paymentData.clientSecret}
          amount={paymentData.amount}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="text-center">
        <h3 className="text-lg font-semibold text-evergreen flex items-center justify-center gap-2">
          <FaCreditCard />
          Add Funds to Wallet
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Current Balance: <span className="font-semibold">${(currentBalance / 100).toFixed(2)}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {topupOptions.map((option) => (
          <Button
            key={option.amount}
            onClick={() => handleTopup(option.amount)}
            disabled={loading}
            className={`${
              option.popular 
                ? 'bg-santa hover:bg-red-600 ring-2 ring-santa ring-offset-2' 
                : 'bg-evergreen hover:bg-green-600'
            } text-white flex flex-col items-center gap-2 py-4 relative`}
          >
            {option.popular && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold">
                Popular
              </div>
            )}
            <FaDollarSign className="text-xl" />
            <div className="text-center">
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs opacity-90">
                +{option.amount} votes
              </div>
            </div>
          </Button>
        ))}
      </div>

      <div className="text-xs text-center text-gray-500">
        <p>Secure payment powered by Stripe</p>
        <p>$1 = 1 vote for your children&apos;s magic score</p>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 text-sm mb-1">How it works:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Add funds to your Christmas Magic wallet</li>
          <li>• Use funds to vote daily for each child (+1 to +10 magic points)</li>
          <li>• Magic points help children reach their Christmas goals</li>
          <li>• All transactions are secure and tracked in your wallet</li>
        </ul>
      </div>
    </div>
  );
}
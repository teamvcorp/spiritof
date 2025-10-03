"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { FaHeart, FaGift, FaTimes } from "react-icons/fa";

type DonationFormProps = {
  childId: string;
  childName: string;
};

type DonationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  childName: string;
  onSubmit: (data: { donorName: string; donorEmail: string; message: string }) => void;
  loading: boolean;
};

function DonationModal({ isOpen, onClose, amount, childName, onSubmit, loading }: DonationModalProps) {
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert("Please enter your name");
      return;
    }
    onSubmit({ donorName: donorName.trim(), donorEmail: donorEmail.trim(), message: message.trim() });
  };

  const handleClose = () => {
    if (!loading) {
      setDonorName("");
      setDonorEmail("");
      setMessage("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-santa to-evergreen text-white p-6 rounded-t-2xl relative">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <FaTimes />
          </button>
          <div className="text-center">
            <FaGift className="mx-auto text-3xl mb-2" />
            <h2 className="text-xl font-bold">Support {childName}</h2>
            <p className="text-white/90 text-sm">You're donating ${amount} in Christmas magic!</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Donor Name */}
          <div>
            <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              id="donorName"
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent text-base"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">This will be shown to {childName}'s family</p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="donorEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Your Email (Optional)
            </label>
            <input
              id="donorEmail"
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent text-base"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">For donation receipt (optional)</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message to Family (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a holiday message..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent text-base resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Share your Christmas wishes!</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-evergreen hover:bg-green-600 text-white py-3"
            >
              {loading ? "Processing..." : `Donate $${amount}`}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DonationForm({ childId, childName }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const handleDonationClick = (amount: number) => {
    setSelectedAmount(amount);
    setShowModal(true);
    setError(null);
  };

  const handleDonationSubmit = async (data: { donorName: string; donorEmail: string; message: string }) => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          amount: selectedAmount * 100, // Convert to cents
          donorName: data.donorName,
          donorEmail: data.donorEmail || undefined,
          message: data.message || undefined,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create donation");
      }

      // Close modal and redirect to Stripe Checkout
      setShowModal(false);
      window.location.href = responseData.checkoutUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
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
              onClick={() => handleDonationClick(option.amount)}
              disabled={loading}
              className={`${option.color} text-white flex flex-col items-center gap-2 py-4 transform hover:scale-105 transition-all`}
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

      <DonationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        amount={selectedAmount}
        childName={childName}
        onSubmit={handleDonationSubmit}
        loading={loading}
      />
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface WalletTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentForm({ 
  onClose, 
  amount,
  onSuccess 
}: { 
  onClose: () => void; 
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/parent/dashboard?wallet_topup=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment successful!
        onSuccess();
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4">
        <div className="text-3xl mb-2">💰</div>
        <h3 className="text-xl font-paytone-one text-evergreen">
          Top Up Wallet
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Amount: <span className="font-semibold text-lg text-evergreen">${amount.toFixed(2)}</span>
        </p>
      </div>

      {/* Payment Element */}
      <div className="bg-gray-50 rounded-lg p-4">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 animate-shake">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <p className="text-red-800 text-sm flex-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="flex-1 px-4 py-3 bg-evergreen hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Add $${amount.toFixed(2)}`
          )}
        </button>
      </div>

      {/* Security Badge */}
      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </form>
  );
}

export default function WalletTopupModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  onSuccess,
}: WalletTopupModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#16a34a", // evergreen
        colorBackground: "#ffffff",
        colorText: "#1f2937",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container with Slide Down Animation */}
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
        style={{
          animation: "slideDown 0.3s ease-out",
        }}
      >
        <div className="p-6">
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm 
              onClose={onClose} 
              amount={amount}
              onSuccess={onSuccess}
            />
          </Elements>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

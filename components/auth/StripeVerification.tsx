"use client";

import { useState } from "react";

interface StripeVerificationProps {
  onVerified: () => void;
}

export function StripeVerification({ onVerified }: StripeVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a Stripe setup intent for card verification (no charge)
      const response = await fetch('/api/stripe/verify-adult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Redirect to Stripe for card verification
      if (data.url) {
        window.location.href = data.url;
      } else {
        onVerified();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-gradient-to-br from-santa/5 to-evergreen/5">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-paytone-one text-santa">Adult Verification Required</h3>
        <p className="text-sm text-muted-foreground">
          To ensure the safety of our Christmas magic platform, we require adult verification through a valid payment method.
        </p>
        <p className="text-xs text-muted-foreground">
          No charges will be made - this is only for age verification purposes.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleVerifyCard}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-santa text-white rounded-lg font-medium hover:bg-santa/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify with Payment Method"
          )}
        </button>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <svg className="w-4 h-4 text-evergreen" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secured by Stripe - Your payment information is protected</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import AddChildForm from "./AddChildForm";

interface AddChildFormWrapperProps {
  createChildAction: (formData: FormData) => Promise<{ 
    success?: boolean; 
    requiresPayment?: boolean; 
    error?: string; 
    message?: string; 
  } | void>;
}

export default function AddChildFormWrapper({ createChildAction }: AddChildFormWrapperProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const result = await createChildAction(formData);
      
      // Check if this child requires payment (additional child)
      if (result?.requiresPayment) {
        // Make the payment-required API call
        try {
          const response = await fetch('/api/parent/add-child-with-welcome-packet', {
            method: 'POST',
            body: formData,
          });
          
          const paymentResult = await response.json();
          
          if (!response.ok) {
            const errorMsg = paymentResult.error || paymentResult.details || 'Unknown error occurred';
            console.error("Failed to create child with welcome packet:", errorMsg);
            console.error("Full response:", paymentResult);
            setErrorMessage(errorMsg);
            return;
          }
          
          // Redirect to Stripe checkout for the welcome packet payment
          if (paymentResult.welcomePacket?.checkoutUrl) {
            window.location.href = paymentResult.welcomePacket.checkoutUrl;
            return;
          } else {
            console.error("No checkout URL received:", paymentResult);
            setErrorMessage('Failed to create payment session. Please try again.');
            return;
          }
        } catch (error) {
          console.error('Error setting up welcome packet payment:', error);
          setErrorMessage('Failed to set up welcome packet payment. Please try again.');
          return;
        }
      }
      
      if (result?.error) {
        console.error("Failed to create child:", result.error);
        setErrorMessage(result.error);
      }
      
      // If successful, the page will revalidate automatically
      if (result?.success) {
        // Success! Page will refresh
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-shake">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">
              ⚠️
            </div>
            <div className="flex-1">
              <h4 className="text-red-900 font-semibold mb-1">Unable to Add Child</h4>
              <p className="text-red-800 text-sm leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
        <AddChildForm onSubmit={handleSubmit} />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
            <div className="text-center">
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-santa font-paytone-one">Processing...</div>
              <div className="text-sm text-gray-600">Setting up your child's Christmas experience</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
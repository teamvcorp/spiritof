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
            const errorMessage = paymentResult.error || paymentResult.details || 'Unknown error occurred';
            console.error("Failed to create child with welcome packet:", errorMessage);
            console.error("Full response:", paymentResult);
            alert(`Failed to set up welcome packet for this child: ${errorMessage}`);
            return;
          }
          
          // Redirect to Stripe checkout for the welcome packet payment
          if (paymentResult.welcomePacket?.checkoutUrl) {
            window.location.href = paymentResult.welcomePacket.checkoutUrl;
            return;
          } else {
            console.error("No checkout URL received:", paymentResult);
            alert('Failed to create payment session. Please try again.');
            return;
          }
        } catch (error) {
          console.error('Error setting up welcome packet payment:', error);
          alert('Failed to set up welcome packet payment. Please try again.');
          return;
        }
      }
      
      if (result?.error) {
        console.error("Failed to create child:", result.error);
        alert(result.error);
      }
      
      // If successful, the page will revalidate automatically
      if (result?.success) {
        // Success! Page will refresh
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
      <AddChildForm onSubmit={handleSubmit} />
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <div className="text-center">
            <div className="text-4xl mb-2">🎁</div>
            <div className="text-santa font-paytone-one">Processing...</div>
            <div className="text-sm text-gray-600">Setting up your child's Christmas experience</div>
          </div>
        </div>
      )}
    </div>
  );
}
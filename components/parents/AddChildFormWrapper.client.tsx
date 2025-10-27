"use client";

import { useState } from "react";
import AddChildForm from "./AddChildForm";
import WelcomePacketPaymentModal from "./WelcomePacketPaymentModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AddChildFormWrapperProps {
  createChildAction: (formData: FormData) => Promise<{ 
    success?: boolean; 
    requiresPayment?: boolean; 
    error?: string; 
    message?: string; 
  } | void>;
}

export default function AddChildFormWrapper({ createChildAction }: AddChildFormWrapperProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    childName: string;
    totalAmount: number;
    paymentIntentId: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      const result = await createChildAction(formData);
      
      // Check if this child requires payment (should always be true now)
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
            setIsProcessing(false);
            return;
          }
          
          // Show payment modal with client secret
          if (paymentResult.payment?.clientSecret) {
            setPaymentData({
              clientSecret: paymentResult.payment.clientSecret,
              childName: paymentResult.child.name,
              totalAmount: paymentResult.payment.totalAmount,
              paymentIntentId: paymentResult.payment.paymentIntentId,
            });
            setShowPaymentModal(true);
            setIsProcessing(false);
          } else {
            console.error("No client secret received:", paymentResult);
            setErrorMessage('Failed to create payment session. Please try again.');
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Error setting up welcome packet payment:', error);
          setErrorMessage('Failed to set up welcome packet payment. Please try again.');
          setIsProcessing(false);
        }
        return;
      }
      
      if (result?.error) {
        console.error("Failed to create child:", result.error);
        setErrorMessage(result.error);
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentData) return;

    try {
      // Optionally collect shipping address here or use the pre-filled one
      const response = await fetch('/api/parent/complete-welcome-packet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentData.paymentIntentId,
        }),
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setPaymentData(null);
        toast.success(`🎉 ${paymentData.childName} has been added!`);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to complete welcome packet order');
      }
    } catch (error) {
      console.error('Error completing welcome packet:', error);
      toast.error('Failed to complete welcome packet order');
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    setIsProcessing(false);
  };

  return (
    <div className="relative">
      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <WelcomePacketPaymentModal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          clientSecret={paymentData.clientSecret}
          childName={paymentData.childName}
          totalAmount={paymentData.totalAmount}
          onSuccess={handlePaymentSuccess}
        />
      )}

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
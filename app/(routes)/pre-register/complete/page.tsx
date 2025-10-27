"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast, Toaster } from "react-hot-toast";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ clientSecret, email, name }: { clientSecret: string; email: string; name: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
          receipt_email: email,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("🎉 Payment complete! Welcome to Spirit of Santa!");
        // Clear the session storage flag
        sessionStorage.removeItem('preRegisterWithGoogle');
        
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      toast.error("An error occurred during payment");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-santa/10 border border-santa/20 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">Welcome Packet Fee</span>
          <span className="font-bold text-santa text-lg">$5.00</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Complete your pre-registration to secure your spot!
        </p>
      </div>

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-santa hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>🎅 Complete Registration - $5.00</>
        )}
      </button>
    </form>
  );
}

export default function PreRegisterCompletePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is a pre-registration Google sign-in
    const isPreRegister = sessionStorage.getItem('preRegisterWithGoogle');
    
    if (status === "loading") {
      return;
    }

    if (!session) {
      // Not authenticated, redirect back to splash
      router.push("/");
      return;
    }

    if (!isPreRegister) {
      // Not a pre-registration flow, redirect to home
      router.push("/");
      return;
    }

    // Create payment intent for this user
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/pre-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user?.email || "",
            name: session.user?.name || "User",
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          toast.error(data.error || "Failed to initialize payment");
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (error) {
        toast.error("Network error. Please try again.");
        setTimeout(() => router.push("/"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">Setting up your registration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33] flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-32 h-32">
              <Image
                src="/images/logo.svg"
                alt="Spirit of Santa"
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-paytone-one text-white">
                Welcome, {session?.user?.name}!
              </h1>
              <p className="text-lg text-white/80">
                One more step to complete your registration
              </p>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">
                Complete Your Payment
              </h2>
              <p className="text-gray-600">
                Secure your spot for our January 1, 2026 launch!
              </p>
            </div>

            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  email={session?.user?.email || ""}
                  name={session?.user?.name || "User"}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-santa border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import SnowEffect from "@/components/effects/SnowEffect";
import { useSnow } from "@/components/effects/SnowControls";
import { FcGoogle } from "react-icons/fc";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PreRegistrationFormProps {
  clientSecret: string;
  email: string;
  name: string;
  onSuccess: (tempPassword: string) => void;
  isGoogleAuth?: boolean;
}

function PreRegistrationForm({ clientSecret, email, name, onSuccess, isGoogleAuth = false }: PreRegistrationFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

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
        
        if (isGoogleAuth) {
          // For Google users, redirect to Google OAuth after payment
          toast.success("🎉 Payment successful! Redirecting to Google sign-in...");
          sessionStorage.setItem('preRegisterPaymentComplete', 'true');
          setTimeout(() => {
            signIn("google", { callbackUrl: "/" });
          }, 1500);
        } else {
          // For credentials users, create account now
          toast.loading("Creating your account...");
          
          try {
            const confirmResponse = await fetch("/api/pre-register/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
            });

            const confirmData = await confirmResponse.json();

            if (confirmResponse.ok) {
              toast.dismiss();
              toast.success("🎉 Registration complete! Check your email for login credentials.");
              onSuccess(confirmData.tempPassword || "");
            } else {
              toast.dismiss();
              toast.error(confirmData.error || "Failed to create account. Please contact support.");
              setIsProcessing(false);
            }
          } catch (confirmError) {
            toast.dismiss();
            toast.error("Failed to create account. Please contact support with your payment confirmation.");
            setIsProcessing(false);
          }
        }
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
          Includes personalized welcome letter, site access, and holiday goodies!
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

      <p className="text-xs text-center text-gray-500">
        Secure payment powered by Stripe. You'll receive a confirmation email with your login details.
      </p>
    </form>
  );
}

interface SplashScreenProps {
  isInDev: boolean;
}

export default function SplashScreen({ isInDev }: SplashScreenProps) {
  const pathname = usePathname();
  const [showRegistration, setShowRegistration] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"credentials" | "google" | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState<{email: string; name: string} | null>(null);
  
  // Use global snow state from context
  const { snowEnabled, settings } = useSnow();

  // Don't show splash screen on completion page or if not in dev mode
  if (!isInDev || pathname === "/pre-register/complete") {
    return null;
  }

  const handleGoogleAuth = async () => {
    // For Google OAuth on splash screen during pre-registration,
    // we'll redirect to Google first, then handle payment after they return
    setIsLoading(true);
    try {
      // Mark this as a pre-registration Google sign-in
      sessionStorage.setItem('preRegisterWithGoogle', 'true');
      await signIn("google", { callbackUrl: "/pre-register/complete" });
    } catch (error) {
      toast.error("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGooglePaymentComplete = async () => {
    // This function is no longer needed - removed
  };

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name) {
      toast.error("Please enter your name and email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setClientSecret(data.clientSecret);
        setShowRegistration(true);
        toast.success("Great! Now complete your payment to secure your spot.");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (password: string) => {
    setTempPassword(password);
    setShowPasswordModal(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast.success("Password copied to clipboard!");
  };

  return (
    <>
      <Toaster position="top-center" />
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800">
                Registration Complete!
              </h2>
              <p className="text-gray-600">
                Your account has been created successfully.
              </p>
            </div>

            <div className="bg-santa/10 border-2 border-santa/30 rounded-lg p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email:</label>
                <div className="font-mono text-sm text-gray-800 bg-white p-2 rounded border">
                  {email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Temporary Password:</label>
                <div className="flex gap-2">
                  <div className="font-mono text-sm text-gray-800 bg-white p-2 rounded border flex-1">
                    {tempPassword}
                  </div>
                  <button
                    onClick={handleCopyPassword}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded border text-sm"
                    title="Copy password"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Save these credentials now! You'll need them to log in when we launch on January 1, 2026.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-santa hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Got it! Return to Home
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33] flex items-center justify-center overflow-y-auto">
        {/* Snow effect inside splash screen - controlled by global snow state */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <SnowEffect 
            enabled={snowEnabled} 
            snowflakeCount={settings.snowflakeCount} 
            maxGroundHeight={settings.maxGroundHeight}
            fallSpeedMultiplier={settings.fallSpeedMultiplier}
          />
        </div>
        
        <div className="w-full max-w-lg mx-auto p-6 space-y-8 relative z-20">
          {/* Animated Logo */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-48 h-48">
              <Image
                src="/images/logo.svg"
                alt="Spirit of Santa"
                width={192}
                height={192}
                className="w-full h-full object-contain animate-pulse"
              />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-4xl font-paytone-one text-white">
                Spirit of Santa
              </h1>
              <p className="text-xl text-white/80">
                🎄 Launching January 1, 2026! 🎅
              </p>
            </div>
          </div>

          {/* Pre-Registration Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6">
            {!showRegistration ? (
              <>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Pre-Register Now!
                  </h2>
                  <p className="text-gray-600">
                    Be among the first to experience the Magic of Christmas Behavior management. 
                    Start off right with Christmas Magic and your Welcome kit !
                  </p>
                </div>

                {/* Auth method selection */}
                {!authMethod ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <FcGoogle className="text-2xl" />
                      {isLoading ? "Redirecting to Google..." : "Continue with Google"}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setAuthMethod("credentials")}
                      className="w-full bg-evergreen hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      📧 Continue with Email
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setAuthMethod(null)}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      ← Back to sign-in options
                    </button>

                    <form onSubmit={handlePreRegister} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Santa Claus"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="santa@northpole.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-evergreen hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          "Continue to Payment →"
                        )}
                      </button>
                    </form>
                  </>
                )}

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold text-gray-800 text-center">
                    What's Included:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-santa">🎁</span>
                      <span>Personalized welcome letter from Santa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-santa">✨</span>
                      <span>Exclusive early access to the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-santa">📧</span>
                      <span>Email confirmation with login credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-santa">🎄</span>
                      <span>Holiday goodies and surprises</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Complete Your Registration
                  </h2>
                  <p className="text-gray-600">
                    Registering as: <span className="font-semibold">{email}</span>
                  </p>
                </div>

                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PreRegistrationForm
                      clientSecret={clientSecret}
                      email={email}
                      name={name}
                      onSuccess={handleSuccess}
                      isGoogleAuth={authMethod === "google"}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center space-y-2">
            <p className="text-white/60 text-sm">
              🔧 We're preparing something magical...
            </p>
            <p className="text-white/40 text-xs">
              Expected launch: Soon! ❄️
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { FaGoogle, FaEnvelope } from "react-icons/fa";

export default function MobileSignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [googleError, setGoogleError] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGoogleError(false);
    
    try {
      await signIn("google", { 
        callbackUrl: "/mobile/vote",
        redirect: true 
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setGoogleError(true);
      setIsLoading(false);
      // Automatically show email form as alternative
      setTimeout(() => setShowEmailForm(true), 2000);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/mobile/vote",
        redirect: false,
      });

      if (result?.error) {
        alert("Failed to send sign-in email. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Email sign-in error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-santa to-evergreen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/logo.svg"
            alt="Spirit of Santa"
            width={100}
            height={100}
            className="mx-auto mb-4"
          />
          <h1 className="text-white text-3xl font-paytone-one mb-2">
            Spirit of Santa
          </h1>
          <p className="text-white/90 text-sm">
            Sign in to manage your Christmas magic
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          {!emailSent ? (
            <>
              {!showEmailForm ? (
                <>
                  {/* Mobile Recommendation Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>📱 Mobile Users:</strong> We recommend using Email sign-in for the best experience on mobile devices.
                    </p>
                  </div>

                  {/* Google Error Notice */}
                  {googleError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 animate-shake">
                      <p className="text-sm text-red-800">
                        <strong>⚠️ Google Sign-In Not Available</strong>
                        <br />
                        Your browser doesn&apos;t support Google sign-in. Please use Email instead.
                      </p>
                    </div>
                  )}

                  {/* Email Sign-In Button (Primary) */}
                  <Button
                    onClick={() => setShowEmailForm(true)}
                    disabled={isLoading}
                    className="w-full bg-santa text-white hover:bg-red-700 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-semibold shadow-lg"
                  >
                    <FaEnvelope className="text-xl" />
                    <span>Continue with Email</span>
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Google Sign-In Button (Secondary) */}
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 py-3 rounded-xl"
                  >
                    <FaGoogle className="text-xl" />
                    <span className="font-semibold">Continue with Google</span>
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Note: Google sign-in may not work in some mobile browsers. Email is more reliable.
                  </p>
                </>
              ) : (
                <>
                  {/* Email Form */}
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-santa focus:ring-2 focus:ring-santa/20 outline-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full bg-santa text-white hover:bg-red-700 py-3 rounded-xl font-semibold"
                    >
                      {isLoading ? "Sending..." : "Send Magic Link"}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-xl font-semibold"
                    >
                      Back
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              {/* Email Sent Confirmation */}
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="text-2xl font-paytone-one text-evergreen mb-2">
                  Check Your Email!
                </h2>
                <p className="text-gray-600 mb-6">
                  We've sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Click the link in the email to sign in. You can close this window.
                </p>
              </div>
            </>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="text-center py-2">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-santa"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

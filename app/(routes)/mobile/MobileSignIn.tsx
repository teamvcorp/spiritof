"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { FaGoogle, FaEnvelope } from "react-icons/fa";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

export default function MobileSignIn() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-santa to-evergreen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <EmailAuthForm 
              onToggleMode={() => setIsSignUp(!isSignUp)} 
              isSignUp={isSignUp}
            />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-sm text-gray-600 hover:text-santa hover:underline"
              >
                 Back to login options
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-santa to-evergreen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/mobile/vote" })}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 py-3 rounded-xl"
          >
            <FaGoogle className="text-xl text-red-500" />
            <span className="font-semibold">Continue with Google</span>
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <Button
            onClick={() => setShowEmailForm(true)}
            className="w-full bg-santa text-white hover:bg-red-700 flex items-center justify-center gap-3 py-3 rounded-xl"
          >
            <FaEnvelope className="text-xl" />
            <span className="font-semibold">Continue with Email</span>
          </Button>

          <p className="text-xs text-gray-500 text-center pt-2">
            Note: Google sign-in may not work in some mobile browsers.
          </p>
        </div>

        <p className="text-center text-white/70 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

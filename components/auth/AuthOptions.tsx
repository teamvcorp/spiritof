"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import { Cards, Card } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { FaGoogle, FaEnvelope } from "react-icons/fa";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import Image from "next/image";


export function AuthOptions() {
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  if (showEmailAuth) {
    return (
      <div className="space-y-4">
        <EmailAuthForm 
          onToggleMode={() => setIsSignUp(!isSignUp)} 
          isSignUp={isSignUp}
        />
        <div className="text-center">
          <button
            onClick={() => setShowEmailAuth(false)}
            className="text-sm text-gray-600 hover:text-santa underline"
          >
            ← Back to login options
          </button>
        </div>
      </div>
    );
  }

  return (
    <Container size="full">

    <Card className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-paytone-one text-center mb-6 text-santa lg:text-3xl">
        Get Started with Spirit of Santa
      </h2>
      <div className='flex justify-center items-center gap-8 lg:flex-row lg:justify-between'>
      
      <div className="flex flex-col items-center justify-center w-full max-w-sm space-y-3">
        <Button
          onClick={() => signIn("google")}
          className=" w-full bg-white text-xs hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-3 lg:text-lg"
        >
          <FaGoogle className="text-red-500" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-contain border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <Button
          onClick={() => setShowEmailAuth(true)}
          className="w-full text-xs lg:text-lg bg-santa hover:bg-santa/90 text-white flex items-center justify-center gap-3"
        >
          <FaEnvelope />
          Continue with Email
        </Button>
      </div>
      
            <Image
              src="/images/santa.png"
              alt="Spirit of Santa"
              width={100}
              height={100}
             sizes="(max-width: 100px) "
            className="w-[100px] md:w-[150px] lg:w-[200px] h-auto"
            />
</div>
      <p className="mt-6 text-xs text-gray-500 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </Card>

    </Container>
   
  );
}
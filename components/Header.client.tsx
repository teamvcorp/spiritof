// src/components/HeaderAuth.client.tsx
"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaArrowAltCircleRight } from "react-icons/fa";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [actionLoading, setActionLoading] = useState(false);

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (actionLoading) return;
    setActionLoading(true);
    const callback = window.location.href;
    await signIn("google", { callbackUrl: callback });
    setActionLoading(false);
  };

  const handleSignOut = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (actionLoading) return;
    setActionLoading(true);
    await signOut();
    setActionLoading(false);
  };

  const fallbackInitial = session?.user?.name ? session.user.name[0].toUpperCase() : "U";
  const userName = session?.user?.name ?? "user";

  // Smart call-to-action logic (same as homepage)
  const getCallToAction = () => {
    if (!session) {
      // Not logged in - show login button with Christmas styling
      return (
        <Button
          onClick={handleSignIn}
          disabled={actionLoading}
          className="bg-mint rounded-lg flex items-center justify-center px-6 font-semibold text-white w-full md:w-auto max-w-none md:max-w-60 min-h-[44px]"
          style={{ height: 'auto', minHeight: '44px' }}
          aria-label="Login to get started"
        >
          {actionLoading ? "Signing in..." : "Login"}
          <FaArrowAltCircleRight className="ml-1" />
        </Button>
      );
    } else if (!session.isParentOnboarded) {
      // Logged in but needs onboarding
      return (
        <Link href="/onboarding" className="w-full md:w-auto">
          <Button className="bg-santa text-white rounded-lg flex items-center justify-center px-6 font-semibold w-full max-w-none md:max-w-60 min-h-[44px]" style={{ height: 'auto', minHeight: '44px' }}>
            Complete Setup
            <FaArrowAltCircleRight className="ml-1" />
          </Button>
        </Link>
      );
    } else {
      // Fully set up - show user avatar and dashboard link
      return (
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          {/* Avatar as an icon-button (click avatar to sign out) */}
          <Button
            onClick={handleSignOut}
            aria-label={`Sign out ${userName}`}
            className="overflow-hidden p-1 rounded-full mx-auto md:mx-0"
            style={{ height: '32px', width: '32px' }}
          >
         
          </Button>

          {/* Dashboard quick access */}
          <Link href="/parent/dashboard" className="w-full md:w-auto">
            <Button className="bg-evergreen text-white rounded-lg flex items-center justify-center px-6 font-semibold w-full max-w-none md:max-w-60 min-h-[44px]" style={{ height: 'auto', minHeight: '44px' }}>
              Dashboard
            </Button>
          </Link>

          {/* Small sign out button */}
          <Button 
            className="bg-gray-500 text-white rounded-lg flex items-center justify-center px-6 font-semibold w-full md:w-auto max-w-none md:max-w-60 min-h-[44px]" 
            style={{ height: 'auto', minHeight: '44px' }}
            onClick={handleSignOut} 
            aria-label="Sign out"
          >
            Sign out
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
      {/* Loading state: show spinner */}
      {loading ? (
        <Button loading aria-label="Auth loading" className="bg-santa text-white min-h-[44px] md:h-auto" />
      ) : (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          {getCallToAction()}
        </div>
      )}
    </div>
  );
}

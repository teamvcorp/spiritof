// src/components/HeaderAuth.client.tsx
"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import Button from "@/components/ui/Button";
import Image from "next/image";

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

  return (
    <div className="flex items-center gap-3">
      {/* Loading state: icon-sized spinner */}
      {loading || actionLoading ? (
        <Button  loading aria-label="Auth loading" />
      ) : session ? (
        <>
          {/* Avatar as an icon-button (click avatar to sign out) */}
          <Button
            onClick={handleSignOut}
            aria-label={`Sign out ${userName}`}
            className="overflow-hidden" // ensure img fills circle
          >
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user?.name ?? "User avatar"}
                width={32}
                height={32}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-700">
                {fallbackInitial}
              </div>
            )}
          </Button>

          {/* Small textual sign out button */}
          <Button className='bg-evergreen text-white' onClick={handleSignOut} aria-label="Sign out">
            Sign out
          </Button>
        </>
      ) : (
        /* Signed out: Google icon-only button */
        <Button
          onClick={handleSignIn}
          aria-label="Sign in with Google"
          title="Sign in with Google"
        >
          <FcGoogle className="w-10 h-10" aria-hidden />
        </Button>
      )}
    </div>
  );
}

// src/components/Header.server.tsx
import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { isMobileDevice } from "@/lib/mobile-utils";

// Load the client auth controls only on the client to avoid hydration issues
const HeaderAuth = dynamic(() => import("./Header.client"));
const MobileMenu = dynamic(() => import("@/components/MobileMenu"));

export default async function Header() {
  // Detect mobile device
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = isMobileDevice(userAgent);

  return (
    <header className="p-4 bg-white shadow-sm">
      {isMobile ? (
        // Mobile Layout with Hamburger
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Spirit of Santa"
              width={50}
              height={50}
              className="w-12 h-auto"
            />
            <Image
              src="/images/logoTxt.svg"
              alt="Spirit of Santa"
              width={200}
              height={40}
              className="w-40 h-auto"
            />
          </div>
          
          {/* Mobile Menu Component with Hamburger */}
          <MobileMenu />
        </div>
      ) : (
        // Desktop Layout (Original)
        <div className="grid gap-3">
          {/* Row 1: icon + company name */}
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo.svg"
              alt="Spirit of Santa"
              width={70}
              height={70}
              className="w-16 sm:w-12 md:w-16 h-auto"
            />
            <Image
              src="/images/logoTxt.svg"
              alt="Spirit of Santa"
              width={450}
              height={60}
              className="w-64 md:w-80 lg:w-100 h-auto"
            />
          </div>
     
          {/* Row 2 */}
          <div className="flex items-center justify-center">
            {/* Left: 5 evenly spaced rounded buttons */}
            <div className="flex gap-6 justify-between">
           
              <Link
                href="/"
                className="link-btn bg-santa"
                type="button"
              >
                Home
              </Link>
              <Link
                href="/children"
                className="bg-berryPink link-btn"
                type="Link"
              >
                Kids Dashboard 
              </Link>
              <Link
                href="/parent/dashboard"
                className="bg-frostyBlue link-btn"
                type="Link"
              >
                Parent Dashboard
              </Link>
              <Link
                href="/children/list"
                className=" bg-blueberry link-btn"
                type="Link"
              >
                The List
              </Link>
           
              {/* Right: user avatar + auth controls */}
              <div className="ml-4 flex items-center gap-3">
                {/* client-only interactive sign in/out */}
                <HeaderAuth />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

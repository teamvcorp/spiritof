// src/components/Header.server.tsx
import React from "react";
import dynamic from "next/dynamic";
import Button from "./ui/Button";
import Image from "next/image";
import Link from "next/link";
// Load the client auth controls only on the client to avoid hydration issues
const HeaderAuth = dynamic(() => import("./Header.client"));

export default async function Header() {

  return (
    <header className="p-4 bg-white shadow-sm">
      <div className="grid gap-3">
        {/* Row 1: icon + company name */}
        <div className="flex items-center gap-4">
        <Image
          src="/images/logo.svg"
          alt="Spirit of Santa"
          width={70}
          height={70}
         
        />
          <Image
          src="/images/logoTxt.svg"
          alt="Spirit of Santa"
          width={450}
          height={60}
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
         
          </div>

          {/* Right: user avatar + auth controls */}
          <div className="ml-4 flex items-center gap-3">
            {/* client-only interactive sign in/out */}
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}

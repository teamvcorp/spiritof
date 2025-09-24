// src/components/Header.server.tsx
import React from "react";
import dynamic from "next/dynamic";
import Button from "./ui/Button";
import Image from "next/image";
// Load the client auth controls only on the client to avoid hydration issues
const HeaderAuth = dynamic(() => import("./Header.client"));

export default async function Header() {


  return (
    <header className="p-4 bg-white shadow-sm">
      <div className="grid gap-3">
        {/* Row 1: icon + company name */}
        <div className="flex items-center gap-3">
        <Image
          src="/images/logo.svg"
          alt="Spirit of Santa"
          width={40}
          height={40}
        />
          <Image
          src="/images/logoTxt.svg"
          alt="Spirit of Santa"
          width={500}
          height={50}
        />
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between">
          {/* Left: 5 evenly spaced rounded buttons */}
          <div className="grid grid-cols-5 gap-3 flex-1">
         
            <Button
                
                className="bg-santa text-white transition"
                type="button"
              >
                Home
              </Button>
            <Button
                
                className="bg-berryPink text-white transition"
                type="button"
              >
                Kids Dashboard 
              </Button>
            <Button
                
                className="bg-frostyBlue text-white transition"
                type="button"
              >
                Parent Dashboard
              </Button>
            <Button
               
                className=" bg-blueberry text-white transition"
                type="button"
              >
                The List
              </Button>
            <Button
                
                className="bg-mint text-white transition"
                type="button"
              >
                Magic Points
              </Button>
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

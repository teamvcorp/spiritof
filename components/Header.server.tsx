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
    <header className="fixed top-0 left-0 right-0 z-50 p-4 overflow-hidden" style={{
      background: 'linear-gradient(to bottom, #005574 0%, #032255 100%)',
    }}>
      {/* Northern Lights Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-blue-500/30 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-l from-purple-500/20 via-pink-500/20 to-emerald-500/20 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      </div>

      {/* Falling Snow Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-snow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10}%`,
              animationDuration: `${5 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Warm Flame Glow Accents */}
      <div className="absolute top-0 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '3s' }}></div>
      <div className="absolute bottom-0 right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>

      {/* Inline styles for snow animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes snow {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0.6;
            }
            100% {
              transform: translateY(100vh) translateX(20px);
              opacity: 0;
            }
          }
          .animate-snow {
            animation: snow linear infinite;
          }
        `
      }} />

      {isMobile ? (
        // Mobile Layout with Hamburger
        <div className="relative flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-orange-500/30 rounded-full blur-sm"></div>
              <Image
                src="/images/logo.svg"
                alt="Spirit of Santa"
                width={50}
                height={50}
                className="relative w-12 h-auto drop-shadow-lg"
              />
            </div>
            <Image
              src="/images/logoTxt.svg"
              alt="Spirit of Santa"
              width={200}
              height={40}
              className="w-40 h-auto drop-shadow-lg brightness-110"
            />
          </div>

          {/* Mobile Menu Component with Hamburger */}
          <MobileMenu />
        </div>
      ) : (
        // Desktop Layout - Winter Northern Lights Theme
        <div className="relative flex items-end justify-between gap-12 z-10 w-full">
          {/* Left: Logo + Text aligned to bottom */}
          <div className="flex items-center gap-4 flex-shrink-0 p-4">
            {/* Logo with warm flame glow */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-md animate-pulse" style={{ animationDuration: '3s' }}></div>
              <Image
                src="/images/logo.svg"
                alt="Spirit of Santa"
                width={70}
                height={70}
                className="relative w-16 sm:w-12 md:w-30 h-auto drop-shadow-2xl"
              />
            </div>
            {/* Logo text with frost effect */}
            <div className="relative pb-1">
              <Image
                src="/images/logoTxt.svg"
                alt="Spirit of Santa"
                width={200}
                height={80}
                className="w-[60%] max-w-[200px] h-auto drop-shadow-2xl brightness-110"
              />
            </div>
          </div>

          {/* Center: Navigation with aurora/flame theme */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex gap-4">
              {/* Home - Warm flame accent */}
              <Link
                href="/"
                className="relative px-6 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden group flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
                  height: '30px',
                }}
              >
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              {/* Kids Dashboard - Aurora pink/purple */}
              <Link
                href="/children"
                className="relative px-6 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden group flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                  boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)',
                  height: '30px',
                }}
              >
                <span className="relative z-10">Kids Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              {/* Parent Dashboard - Ice blue with warm glow */}
              <Link
                href="/parent/dashboard"
                className="relative px-6 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden group flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                  height: '30px',
                }}
              >
                <span className="relative z-10">Parent Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              {/* The List - Northern lights green/cyan */}
              <Link
                href="/children/list"
                className="relative px-6 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden group flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  height: '30px',
                }}
              >
                <span className="relative z-10">The List</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>

          {/* Right: user avatar + auth controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* client-only interactive sign in/out */}
            <HeaderAuth />
          </div>
        </div>
      )}
    </header>
  );
}

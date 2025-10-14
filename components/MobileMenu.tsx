"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import HeaderAuth from "./Header.client";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="relative p-2 text-white hover:text-santa focus:outline-none z-[100] bg-white/10 backdrop-blur-sm rounded-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <FaTimes className="text-3xl" />
        ) : (
          <FaBars className="text-3xl" />
        )}
      </button>

      {/* Mobile Menu Overlay and Sidebar - Rendered via Portal */}
      {mounted && isOpen && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-[#001a33] bg-opacity-80 z-[9999]"
            onClick={closeMenu}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-[10000] transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="p-6 min-h-full flex flex-col">
              {/* Close Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={closeMenu}
                  className="p-2 text-santa hover:text-red-700"
                  aria-label="Close menu"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Auth Section */}
              <div className="mb-6 pb-6 border-b border-gray-200 flex flex-col items-stretch">
                <HeaderAuth />
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="block py-3 px-4 rounded-lg bg-santa text-white hover:bg-red-700 text-center transition-colors"
                >
                  🏠 Home
                </Link>

                <Link
                  href="/children"
                  onClick={closeMenu}
                  className="block py-3 px-4 rounded-lg bg-berryPink text-white hover:bg-pink-600 text-center transition-colors"
                >
                  👧 Kids Dashboard
                </Link>

                <Link
                  href="/parent/dashboard"
                  onClick={closeMenu}
                  className="block py-3 px-4 rounded-lg bg-frostyBlue text-white hover:bg-blue-600 text-center transition-colors"
                >
                  👨 Parent Dashboard
                </Link>

                <Link
                  href="/children/list"
                  onClick={closeMenu}
                  className="block py-3 px-4 rounded-lg bg-blueberry text-white hover:bg-blue-700 text-center transition-colors"
                >
                  📝 The List
                </Link>

                {/* Mobile-specific links */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <Link
                    href="/mobile/vote"
                    onClick={closeMenu}
                    className="block py-3 px-4 rounded-lg bg-evergreen text-white hover:bg-green-700 text-center transition-colors"
                  >
                    ✨ Vote for Magic
                  </Link>

                  <Link
                    href="/mobile/settings"
                    onClick={closeMenu}
                    className="block py-3 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-800 text-center transition-colors"
                  >
                    ⚙️ Mobile Settings
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

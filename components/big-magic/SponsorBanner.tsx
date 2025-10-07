"use client";

import { useEffect, useState } from "react";

// Sample sponsors - you'll add real logos later
const sponsors = [
  { name: "Example Corp", logo: "/images/sponsors/example-corp.png" },
  { name: "Magic Inc", logo: "/images/sponsors/magic-inc.png" },
  { name: "Holiday Enterprises", logo: "/images/sponsors/holiday-ent.png" },
  { name: "Christmas Co", logo: "/images/sponsors/christmas-co.png" },
];

export function SponsorBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Rotate sponsors every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 text-center">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Proud Corporate Sponsors
      </h3>
      
      <div className="relative h-24 flex items-center justify-center">
        {sponsors.map((sponsor, index) => (
          <div
            key={sponsor.name}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Placeholder until you add real logos */}
            <div className="text-3xl font-bold text-evergreen bg-gradient-to-r from-santa to-berryPink bg-clip-text text-transparent">
              {sponsor.name}
            </div>
            {/* When you add real logos, replace the above div with:
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="max-h-20 max-w-xs object-contain"
            />
            */}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {sponsors.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-santa w-8" : "bg-gray-300"
            }`}
            aria-label={`View sponsor ${index + 1}`}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Thank you to our amazing corporate partners who help create Christmas magic!
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface NaughtyNiceMeterProps {
  percentage: number;
  className?: string;
}

export default function NaughtyNiceMeter({ percentage, className = "" }: NaughtyNiceMeterProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the needle on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Convert percentage to angle for needle rotation (0-180 degrees)
  // 0% = -90 degrees (left), 100% = 90 degrees (right)
  const needleAngle = -90 + (animatedPercentage / 100) * 180;

  return (
    <div className={`relative ${className}`}>
      {/* Base meter image */}
      <div className="relative w-full max-w-sm mx-auto">
        <Image
          src="/images/meter.png"
          alt="Naughty Nice Meter"
          width={300}
          height={200}
          className="w-full h-auto"
        />
        
        {/* Needle overlay - positioned to match the meter's center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative"
            style={{
              width: '300px',
              height: '200px',
              transform: 'translateY(10px)' // Adjust to align with meter center
            }}
          >
            {/* Clock hand needle */}
            <div
              className="absolute"
              style={{
                left: '50%',
                bottom: '25%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Clock hand shape - white and tapered to point */}
              <div
                className="relative"
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent', // Double width (4px -> 8px)
                  borderRight: '8px solid transparent', // Double width (4px -> 8px)
                  borderBottom: '105px solid white', // 20% longer (88px -> 105px)
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 6px rgba(0,0,0,0.2))',
                  marginLeft: '-8px' // Adjust for doubled width
                }}
              >
                {/* Sharp point at tip */}
                <div
                  className="absolute bg-white rounded-full"
                  style={{
                    width: '3px',
                    height: '3px',
                    left: '50%',
                    top: '-3px',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>
            
            {/* Center hub - like a clock */}
            <div
              className="absolute bg-gray-800 border-2 border-white rounded-full shadow-lg"
              style={{
                width: '16px',
                height: '16px',
                left: '50%',
                bottom: '25%',
                transform: 'translateX(-50%) translateY(50%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
                background: 'linear-gradient(145deg, #4b5563, #374151)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Percentage display below the meter */}
      <div className="text-center mt-3">
        <div className="text-2xl font-bold text-gray-700">
          {Math.round(animatedPercentage)}%
        </div>
        <div className="text-sm font-medium text-gray-600">
          {animatedPercentage >= 67 ? "Nice!" : 
           animatedPercentage >= 34 ? "Could Be Better" : 
           "Naughty"}
        </div>
      </div>
    </div>
  );
}

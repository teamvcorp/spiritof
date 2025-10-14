"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface NaughtyNiceMeterProps {
  percentage: number;
  className?: string;
  maxGifts?: number;
  currentGiftCount?: number;
}

export default function NaughtyNiceMeter({ 
  percentage, 
  className = "",
  maxGifts = 5,
  currentGiftCount = 0
}: NaughtyNiceMeterProps) {
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

  // Calculate earned gifts based on percentage
  // At least 1 gift minimum, scale up to maxGifts at 100%
  const earnedGifts = Math.max(1, Math.floor((animatedPercentage / 100) * maxGifts));
  
  // Calculate how many more gifts until next milestone (every 5%)
  const percentagePerGift = 100 / maxGifts;
  const nextMilestonePercentage = Math.ceil(animatedPercentage / 5) * 5;
  const giftsAtNextMilestone = Math.max(1, Math.floor((nextMilestonePercentage / 100) * maxGifts));
  const giftsUntilNext = Math.max(0, giftsAtNextMilestone - earnedGifts);
  
  // Get encouraging message based on percentage
  const getMessage = () => {
    if (animatedPercentage >= 95) {
      return "🌟 Amazing! You're a Christmas superstar!";
    } else if (animatedPercentage >= 85) {
      return "✨ Fantastic! Santa is so proud of you!";
    } else if (animatedPercentage >= 75) {
      return "🎄 Great job! Keep up the excellent behavior!";
    } else if (animatedPercentage >= 65) {
      return "🎁 You're doing wonderful! Keep it up!";
    } else if (animatedPercentage >= 55) {
      return "⭐ Nice work! You're making Santa smile!";
    } else if (animatedPercentage >= 45) {
      return "🌠 Good progress! Keep being kind!";
    } else if (animatedPercentage >= 35) {
      return "💫 You're improving! Santa believes in you!";
    } else if (animatedPercentage >= 25) {
      return "🎅 Keep trying! Every good deed counts!";
    } else if (animatedPercentage >= 15) {
      return "❄️ You can do it! Start with small acts of kindness!";
    } else {
      return "🎄 New beginnings! Every day is a chance to be nice!";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Base meter image */}
      <div className="relative w-full max-w-sm mx-auto">
        <Image
          src="/images/meterNoNeedle.png"
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
      <div className="text-center mt-4 space-y-2">
        <div className="text-3xl font-bold text-white">
          {Math.round(animatedPercentage)}%
        </div>
        
        {/* Encouraging message */}
        <div className="text-base font-medium text-white/90">
          {getMessage()}
        </div>
        
        {/* Earned presents display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-block">
          <div className="text-lg font-bold text-white">
            🎁 {earnedGifts} of {maxGifts} Presents Earned
          </div>
          {earnedGifts < maxGifts && giftsUntilNext > 0 && (
            <div className="text-sm text-white/80 mt-1">
              Keep being good to earn {giftsUntilNext} more! 🌟
            </div>
          )}
          {earnedGifts >= maxGifts && (
            <div className="text-sm text-white/80 mt-1">
              You've earned all your presents! 🎉
            </div>
          )}
        </div>
        
        {/* Current list status if provided */}
        {currentGiftCount > 0 && (
          <div className="text-sm text-white/70">
            {currentGiftCount > earnedGifts ? (
              <span className="text-yellow-300">
                ⚠️ You have {currentGiftCount - earnedGifts} too many gifts on your list
              </span>
            ) : currentGiftCount === earnedGifts ? (
              <span className="text-green-300">
                ✓ Your list matches your earned presents!
              </span>
            ) : (
              <span className="text-blue-300">
                You can add {earnedGifts - currentGiftCount} more gifts!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

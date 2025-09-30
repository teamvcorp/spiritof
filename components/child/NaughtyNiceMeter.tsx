"use client";

import { useEffect, useState } from "react";

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
    }, 500); // Delay for dramatic effect

    return () => clearTimeout(timer);
  }, [percentage]);

  // Convert percentage to angle for needle rotation
  // Meter goes from -90 degrees (0%) to 90 degrees (100%)
  const needleAngle = -90 + (animatedPercentage / 100) * 180;
  
  // Get meter color based on percentage
  const getMeterColor = (pct: number) => {
    if (pct >= 80) return "#10b981"; // Green (Nice)
    if (pct >= 50) return "#f59e0b"; // Yellow (Getting there)
    return "#ef4444"; // Red (Naughty)
  };

  const meterColor = getMeterColor(animatedPercentage);

  // Get needle color - always red for naughty side transition
  const needleColor = animatedPercentage >= 70 ? "#10b981" : "#ef4444";

  return (
    <div className={`relative ${className}`}>
      <svg
        width="300"
        height="200"
        viewBox="0 0 300 200"
        className="w-full h-auto max-w-xs sm:max-w-sm"
      >
        {/* Meter Background */}
        <defs>
          <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          {/* Glow effect for the needle */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="150"
          cy="150"
          r="120"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />

        {/* Meter Arc Background */}
        <path
          d="M 30 150 A 120 120 0 0 1 270 150"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Colored Meter Arc */}
        <path
          d="M 30 150 A 120 120 0 0 1 270 150"
          fill="none"
          stroke="url(#meterGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(animatedPercentage / 100) * 377} 377`}
          style={{
            transition: "stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Tick Marks */}
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const tickAngle = -90 + (tick / 100) * 180;
          const tickX1 = 150 + 100 * Math.cos((tickAngle * Math.PI) / 180);
          const tickY1 = 150 + 100 * Math.sin((tickAngle * Math.PI) / 180);
          const tickX2 = 150 + 110 * Math.cos((tickAngle * Math.PI) / 180);
          const tickY2 = 150 + 110 * Math.sin((tickAngle * Math.PI) / 180);

          return (
            <line
              key={tick}
              x1={tickX1}
              y1={tickY1}
              x2={tickX2}
              y2={tickY2}
              stroke="#6b7280"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        <text x="50" y="170" textAnchor="middle" className="fill-red-500 text-sm font-bold">
          Naughty
        </text>
        <text x="250" y="170" textAnchor="middle" className="fill-green-500 text-sm font-bold">
          Nice
        </text>

        {/* Center Circle */}
        <circle
          cx="150"
          cy="150"
          r="15"
          fill="#374151"
          stroke="#111827"
          strokeWidth="2"
        />

        {/* Needle */}
        <line
          x1="150"
          y1="150"
          x2={150 + 80 * Math.cos((needleAngle * Math.PI) / 180)}
          y2={150 + 80 * Math.sin((needleAngle * Math.PI) / 180)}
          stroke={needleColor}
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#glow)"
          style={{
            transformOrigin: "150px 150px",
            transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Needle Tip Circle */}
        <circle
          cx={150 + 80 * Math.cos((needleAngle * Math.PI) / 180)}
          cy={150 + 80 * Math.sin((needleAngle * Math.PI) / 180)}
          r="3"
          fill={needleColor}
          style={{
            transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Christmas decorations */}
        <g opacity="0.7">
          {/* Snowflakes */}
          <text x="80" y="50" className="fill-blue-200 text-lg">❄️</text>
          <text x="220" y="60" className="fill-blue-200 text-lg">❄️</text>
          <text x="40" y="100" className="fill-blue-200 text-sm">❄️</text>
          <text x="260" y="110" className="fill-blue-200 text-sm">❄️</text>
          
          {/* Christmas tree at nice side */}
          <text x="240" y="40" className="text-lg">🎄</text>
          
          {/* Coal at naughty side */}
          <text x="40" y="40" className="text-lg">🪨</text>
        </g>
      </svg>

      {/* Percentage Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white bg-opacity-95 rounded-full px-4 py-2 shadow-lg mt-8">
          <span 
            className="font-bold text-xl"
            style={{ color: meterColor }}
          >
            {Math.round(animatedPercentage)}% Nice
          </span>
        </div>
      </div>

      {/* Santa's Verdict */}
      <div className="text-center mt-4">
        <div className="text-2xl mb-1">
          {animatedPercentage >= 90 ? "🎅" : 
           animatedPercentage >= 70 ? "😊" : 
           animatedPercentage >= 50 ? "😐" : 
           animatedPercentage >= 30 ? "😕" : "😢"}
        </div>
        <div className="text-sm font-medium text-gray-700">
          {animatedPercentage >= 90 ? "Ho ho ho! Exceptional!" : 
           animatedPercentage >= 70 ? "Very good child!" : 
           animatedPercentage >= 50 ? "Keep it up!" : 
           animatedPercentage >= 30 ? "Try harder!" : "Be better!"}
        </div>
      </div>
    </div>
  );
}
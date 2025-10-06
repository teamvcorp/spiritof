"use client";

import React, { useState } from 'react';
import { useSnow } from './SnowControls';

export default function SnowControlsHeader({ className = "" }: { className?: string }) {
  const { snowEnabled, intensity, toggleSnow, setIntensity } = useSnow();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleSnow = () => {
    toggleSnow();
    if (!snowEnabled) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  };

  const handleIntensityChange = (newIntensity: 'light' | 'heavy' | 'blizzard') => {
    setIntensity(newIntensity);
  };

  // Don't show the header at all if snow is off
  if (!snowEnabled) {
    return (
      <div className={`bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 shadow-sm ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <button
              onClick={handleToggleSnow}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              🚫
              <span>Snow Off</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main toggle button - when snow is enabled */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSnow}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600"
              >
                ❄️
                <span>Snow Effects</span>
              </button>
              
              <span className="text-sm text-blue-700 font-medium">
                Current: {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                {intensity === 'blizzard' && ' 🌪️'}
              </span>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 rounded text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Adjust Intensity</span>
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable controls */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 ${
        isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-blue-800">Snow Intensity:</span>
            
            <div className="flex gap-3">
              {(['light', 'heavy', 'blizzard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleIntensityChange(level)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    intensity === level
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {level === 'light' && '🌨️ Light'}
                  {level === 'heavy' && '❄️ Heavy'}
                  {level === 'blizzard' && '🌪️ Blizzard'}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="text-xs text-blue-600">
              {intensity === 'light' && 'Gentle snowfall'}
              {intensity === 'heavy' && 'Steady winter snow'}
              {intensity === 'blizzard' && 'Heavy snow builds up high & interactive!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
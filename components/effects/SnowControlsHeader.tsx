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
      <div className={`fixed top-[72px] left-0 right-0 z-40 bg-gradient-to-r from-[#005574] to-[#032255] ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between" style={{ height: '30px' }}>
            <button
              onClick={handleToggleSnow}
              className="flex items-center justify-center gap-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10 text-white/60 hover:bg-white/20"
              style={{ height: '30px' }}
            >
              <span>Snow Off</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-[72px] left-0 right-0 z-40 ${className}`}>
      {/* Main toggle button - when snow is enabled */}
      <div className="bg-gradient-to-r from-[#005574] to-[#032255]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between" style={{ height: '30px' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSnow}
                className="flex items-center justify-center gap-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 bg-blue-500/80 text-white hover:bg-blue-600"
                style={{ height: '30px' }}
              >
                <span>Snow Effects</span>
              </button>
              
              <span className="text-xs text-white/80 font-medium">
                {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                {intensity === 'blizzard' && ' 🌪️'}
              </span>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center gap-1 px-2 rounded-lg text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all"
              style={{ height: '30px' }}
            >
              <span>Adjust</span>
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable controls */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-r from-[#005574]/90 to-[#032255]/90 backdrop-blur-sm ${
        isExpanded ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-white/90">Intensity:</span>
            
            <div className="flex gap-2">
              {(['light', 'heavy', 'blizzard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleIntensityChange(level)}
                  className={`px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    intensity === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  style={{ height: '30px' }}
                >
                  {level === 'light' && 'Light'}
                  {level === 'heavy' && 'Heavy'}
                  {level === 'blizzard' && 'Blizzard'}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="text-xs text-white/60">
              {intensity === 'light' && 'Gentle snowfall'}
              {intensity === 'heavy' && 'Steady winter snow'}
              {intensity === 'blizzard' && 'Interactive snow buildup'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
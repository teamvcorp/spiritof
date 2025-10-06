"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SnowIntensity = 'light' | 'heavy' | 'blizzard';

interface SnowSettings {
  snowflakeCount: number;
  maxGroundHeight: number;
  snowDuration: number;
  fallSpeedMultiplier: number;
}

interface SnowContextType {
  snowEnabled: boolean;
  intensity: SnowIntensity;
  settings: SnowSettings;
  toggleSnow: () => void;
  setSnowEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: SnowIntensity) => void;
}

const SnowContext = createContext<SnowContextType | undefined>(undefined);

const intensitySettings: Record<SnowIntensity, SnowSettings> = {
  light: { snowflakeCount: 75, maxGroundHeight: 30, snowDuration: 2000, fallSpeedMultiplier: 1 },
  heavy: { snowflakeCount: 150, maxGroundHeight: 60, snowDuration: 4000, fallSpeedMultiplier: 1.5 },
  blizzard: { snowflakeCount: 40000, maxGroundHeight: 400, snowDuration: 8000, fallSpeedMultiplier: 4 },
};

export function SnowProvider({ children }: { children: ReactNode }) {
  const [snowEnabled, setSnowEnabled] = useState(true); // Default enabled
  const [intensity, setIntensityState] = useState<SnowIntensity>('heavy');

  const toggleSnow = () => setSnowEnabled(!snowEnabled);
  
  const setIntensity = (newIntensity: SnowIntensity) => {
    setIntensityState(newIntensity);
  };

  const settings = intensitySettings[intensity];

  return (
    <SnowContext.Provider value={{ 
      snowEnabled, 
      intensity, 
      settings, 
      toggleSnow, 
      setSnowEnabled, 
      setIntensity 
    }}>
      {children}
    </SnowContext.Provider>
  );
}

export function useSnow() {
  const context = useContext(SnowContext);
  if (context === undefined) {
    throw new Error('useSnow must be used within a SnowProvider');
  }
  return context;
}

// Simple toggle button component (keeping for backward compatibility)
export function SnowToggleButton({ className = "" }: { className?: string }) {
  const { snowEnabled, toggleSnow } = useSnow();

  return (
    <button
      onClick={toggleSnow}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        snowEnabled 
          ? 'bg-blue-500 text-white hover:bg-blue-600' 
          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
      } ${className}`}
      title={snowEnabled ? 'Disable snow effects' : 'Enable snow effects'}
    >
      {snowEnabled ? '❄️ Snow On' : '🚫 Snow Off'}
    </button>
  );
}
"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SnowEffect from './SnowEffect';
import { useSnow } from './SnowControls';

interface PageTransitionSnowProps {
  children: React.ReactNode;
  enabled?: boolean;
  transitionDuration?: number;
}

export default function PageTransitionSnow({ 
  children, 
  enabled = true,
  transitionDuration = 500
}: PageTransitionSnowProps) {
  const pathname = usePathname();
  const { snowEnabled, settings } = useSnow();
  const [showSnow, setShowSnow] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);


  useEffect(() => {
    if (!enabled || !snowEnabled) {
      setShowSnow(false);
      setIsTransitioning(false);
      return;
    }

    setIsTransitioning(true);
    setShowSnow(true);

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    // Blizzard mode: snow persists until turned off
    let snowTimer: NodeJS.Timeout | undefined;
    if (settings && settings.snowDuration && settings.snowflakeCount && settings.maxGroundHeight) {
      if (settings.snowflakeCount >= 10000 && settings.maxGroundHeight >= 300) {
        // Blizzard mode: do not auto-stop
        // Snow stays until snowEnabled is false
      } else {
        // Other modes: auto-stop after duration
        snowTimer = setTimeout(() => {
          setShowSnow(false);
        }, settings.snowDuration);
      }
    }

    return () => {
      clearTimeout(transitionTimer);
      if (snowTimer) clearTimeout(snowTimer);
    };
  }, [pathname, enabled, snowEnabled, transitionDuration, settings.snowDuration, settings.snowflakeCount, settings.maxGroundHeight]);

  return (
    <>
      {/* Page content */}
      {children}

      {/* Snow effect during transitions */}
      {showSnow && snowEnabled && (
        <SnowEffect 
          enabled={true}
          snowflakeCount={settings.snowflakeCount}
          maxGroundHeight={settings.maxGroundHeight}
          fallSpeedMultiplier={settings.fallSpeedMultiplier}
        />
      )}
    </>
  );
}
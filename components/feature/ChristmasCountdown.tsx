"use client";

import { useState, useEffect } from "react";
import { useSnow } from "@/components/effects/SnowControls";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Position {
  x: number;
  y: number;
}

export default function ChristmasCountdown() {
  const { snowEnabled, intensity, toggleSnow, setIntensity } = useSnow();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showSnowControls, setShowSnowControls] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Christmas date for current year
      let christmas = new Date(currentYear, 11, 25); // December 25
      
      // If Christmas has passed this year, use next year
      if (now > christmas) {
        christmas = new Date(currentYear + 1, 11, 25);
      }
      
      const difference = christmas.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return null;
  }

  const isChristmasDay = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isChristmasDay) {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
        }}
        className={`hidden md:block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-br from-santa to-evergreen text-white rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 p-4 select-none"
          style={{ width: '200px' }}
        >
          <div className="text-center">
            <div className="animate-bounce text-3xl mb-2">🎄</div>
            <div className="text-sm font-bold">Merry Christmas!</div>
            <div className="text-xs opacity-90">The magic is here ✨</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      className={`hidden md:block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div
        onMouseDown={handleMouseDown}
        className="relative text-white rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 select-none hover:shadow-santa/30 transition-all overflow-hidden"
        style={{ 
          width: '200px',
          background: 'linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        {/* Twinkling stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ top: '15%', left: '20%', animationDuration: '2s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" style={{ top: '25%', left: '80%', animationDuration: '3s' }}></div>
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-pulse" style={{ top: '40%', left: '15%', animationDuration: '2.5s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 animate-pulse" style={{ top: '60%', left: '70%', animationDuration: '1.8s' }}></div>
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-pulse" style={{ top: '75%', left: '30%', animationDuration: '2.2s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse" style={{ top: '80%', left: '85%', animationDuration: '2.8s' }}></div>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-santa/80 to-evergreen/80 backdrop-blur-sm px-4 py-2 rounded-t-2xl border-b border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">🎄 Christmas</span>
            <span className="text-xs opacity-90">Countdown</span>
          </div>
        </div>

        {/* Clock Display */}
        <div className="relative p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="bg-gradient-to-br from-santa/30 to-santa/10 rounded-lg p-3 mb-1 border border-santa/40 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white drop-shadow-lg">{timeLeft.days}</div>
              </div>
              <div className="text-[10px] text-gray-300 uppercase font-medium">Days</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-evergreen/30 to-evergreen/10 rounded-lg p-3 mb-1 border border-evergreen/40 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white drop-shadow-lg">{timeLeft.hours}</div>
              </div>
              <div className="text-[10px] text-gray-300 uppercase font-medium">Hours</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blueberry/30 to-blueberry/10 rounded-lg p-3 mb-1 border border-blueberry/40 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white drop-shadow-lg">{timeLeft.minutes}</div>
              </div>
              <div className="text-[10px] text-gray-300 uppercase font-medium">Min</div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center text-xs text-gray-300 border-t border-white/20 pt-2 font-medium">
            {timeLeft.days > 30 
              ? "⭐ Collect Magic!" 
              : timeLeft.days > 7 
              ? "🎁 Almost here!" 
              : "⏰ Final countdown!"
            }
          </div>
        </div>

        {/* Snow Controls Toggle */}
        <div className="relative px-4 pb-3 border-t border-white/10">
          <button
            onClick={() => setShowSnowControls(!showSnowControls)}
            className="w-full text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1 py-1"
          >
            <span>{snowEnabled ? '❄️' : '🚫'}</span>
            <span>Snow {showSnowControls ? '▲' : '▼'}</span>
          </button>
          
          {/* Expandable Snow Controls */}
          {showSnowControls && (
            <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={toggleSnow}
                  className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${
                    snowEnabled 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {snowEnabled ? 'On' : 'Off'}
                </button>
              </div>
              
              {snowEnabled && (
                <div className="flex gap-1">
                  {(['light', 'heavy', 'blizzard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensity(level)}
                      className={`flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-all ${
                        intensity === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ChristmasCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

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

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return (
      <div className="text-center bg-gradient-to-r from-santa via-evergreen to-blueberry text-white py-8 px-6 rounded-2xl">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl mr-3">🎄</span>
          <h2 className="text-2xl md:text-3xl font-paytone-one">Countdown to Christmas</h2>
          <span className="text-4xl ml-3">🎅</span>
        </div>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const isChristmasDay = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isChristmasDay) {
    return (
      <div className="text-center bg-gradient-to-r from-santa via-evergreen to-blueberry text-white py-8 px-6 rounded-2xl">
        <div className="animate-bounce mb-4">
          <span className="text-6xl">🎄🎅🎁</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-paytone-one mb-2">
          Merry Christmas! 🎄
        </h2>
        <p className="text-xl">
          The magic of Christmas is here! ✨
        </p>
      </div>
    );
  }

  return (
    <div className="text-center bg-gradient-to-r from-santa via-evergreen to-blueberry text-white py-8 px-6 rounded-2xl">
      <div className="flex items-center justify-center mb-4">
        <span className="text-4xl mr-3">🎄</span>
        <h2 className="text-2xl md:text-3xl font-paytone-one">Countdown to Christmas</h2>
        <span className="text-4xl ml-3">🎅</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-3xl md:text-4xl font-bold">{timeLeft.days}</div>
          <div className="text-sm md:text-base opacity-90">Days</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-3xl md:text-4xl font-bold">{timeLeft.hours}</div>
          <div className="text-sm md:text-base opacity-90">Hours</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-3xl md:text-4xl font-bold">{timeLeft.minutes}</div>
          <div className="text-sm md:text-base opacity-90">Minutes</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-3xl md:text-4xl font-bold">{timeLeft.seconds}</div>
          <div className="text-sm md:text-base opacity-90">Seconds</div>
        </div>
      </div>
      
      <p className="text-lg md:text-xl opacity-90">
        {timeLeft.days > 30 
          ? "Start collecting Christmas Magic! ⭐" 
          : timeLeft.days > 7 
          ? "Christmas is almost here! 🎁" 
          : "Final countdown to Christmas! 🚀"
        }
      </p>
    </div>
  );
}
"use client";

import React, { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  onGround: boolean;
  settled: boolean;
}

interface SnowEffectProps {
  enabled?: boolean;
  snowflakeCount?: number;
  maxGroundHeight?: number;
  fallSpeedMultiplier?: number;
}

export default function SnowEffect({ 
  enabled = true, 
  snowflakeCount = 100,
  maxGroundHeight = 50,
  fallSpeedMultiplier = 1
}: SnowEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize snowflakes
    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < snowflakeCount; i++) {
        snowflakesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5 * fallSpeedMultiplier,
          vy: (Math.random() * 1 + 0.5) * fallSpeedMultiplier,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          onGround: false,
          settled: false,
        });
      }
    };

    initSnowflakes();

    // Mouse tracking for interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((snowflake) => {
        if (!snowflake.onGround) {
          // Falling snowflakes
          snowflake.x += snowflake.vx;
          snowflake.y += snowflake.vy;

          // Add some drift
          snowflake.vx += (Math.random() - 0.5) * 0.01;
          snowflake.vx *= 0.99; // Damping

          // Wrap around horizontally
          if (snowflake.x < 0) snowflake.x = canvas.width;
          if (snowflake.x > canvas.width) snowflake.x = 0;

          // Check if hit ground (footer area - about 80px from bottom for fixed footer)
          if (snowflake.y > canvas.height - (maxGroundHeight + 20)) {
            snowflake.onGround = true;
            snowflake.y = canvas.height - Math.random() * maxGroundHeight - 20;
            snowflake.vx = 0;
            snowflake.vy = 0;
          }
        } else {
          // Ground snowflakes - check for mouse interaction
          const mouseDistance = Math.sqrt(
            Math.pow(mouseRef.current.x - snowflake.x, 2) + 
            Math.pow(mouseRef.current.y - snowflake.y, 2)
          );

          if (mouseDistance < 30 && !snowflake.settled) {
            // Mouse is near - move the snowflake away
            const angle = Math.atan2(
              snowflake.y - mouseRef.current.y,
              snowflake.x - mouseRef.current.x
            );
            snowflake.vx = Math.cos(angle) * 2;
            snowflake.vy = Math.sin(angle) * 2;
            snowflake.onGround = false;
          }

          // Apply ground physics if moving
          if (Math.abs(snowflake.vx) > 0.01 || Math.abs(snowflake.vy) > 0.01) {
            snowflake.x += snowflake.vx;
            snowflake.y += snowflake.vy;
            snowflake.vx *= 0.95; // Friction
            snowflake.vy *= 0.95;

            // Keep on ground level (above footer)
            if (snowflake.y > canvas.height - 30) {
              snowflake.y = canvas.height - Math.random() * 30 - 20;
              snowflake.vy = 0;
            }

            // Stop if moving too slowly
            if (Math.abs(snowflake.vx) < 0.01 && Math.abs(snowflake.vy) < 0.01) {
              snowflake.vx = 0;
              snowflake.vy = 0;
              snowflake.settled = true;
            }
          }
        }

        // Reset if goes too far off screen
        if (snowflake.y < -10) {
          snowflake.y = -10;
          snowflake.x = Math.random() * canvas.width;
        }

        // Draw snowflake
        ctx.save();
        ctx.globalAlpha = snowflake.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, snowflakeCount, maxGroundHeight]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ 
        mixBlendMode: 'screen',
        opacity: 0.8
      }}
    />
  );
}
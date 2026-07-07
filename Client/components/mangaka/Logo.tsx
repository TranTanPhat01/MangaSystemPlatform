import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'solid' | 'light' | 'dark';
}

export default function Logo({ size = 36, className, variant = 'solid' }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("shrink-0 select-none", className)}
    >
      <defs>
        {/* Color gradient matching the mockup logo pill exactly */}
        <linearGradient id="logo-pill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A1C3C" /> {/* Warm berry burgundy */}
          <stop offset="100%" stopColor="#4E0E22" /> {/* Dark chocolate burgundy */}
        </linearGradient>
        
        {/* Subtle drop shadow for the calligraphic stroke */}
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* 1. Background vertical rounded pill shape with gradient */}
      <rect 
        x="15" 
        y="18" 
        width="28" 
        height="64" 
        rx="10" 
        fill="url(#logo-pill-gradient)" 
      />

      {/* 2. Overlaid white calligraphic "M" brush stroke */}
      <path 
        d="M 23,66 
           C 21,48 27,29 42,20
           C 40,32 38,45 36,58
           C 44,46 58,26 74,18
           C 76,28 68,52 60,70
           C 55,80 46,80 40,70
           C 34,60 25,62 23,66 Z" 
        fill="#FFFFFF"
        filter="url(#logo-shadow)"
      />
    </svg>
  );
}

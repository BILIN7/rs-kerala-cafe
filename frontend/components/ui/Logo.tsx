'use client'

import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark'
  showTagline?: boolean
  className?: string
}

export default function Logo({
  size = 'md',
  variant = 'light',
  showTagline = true,
  className = '',
}: LogoProps) {
  // Dimension configurations
  const dimensions = {
    sm: { icon: 32, title: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { icon: 40, title: 'text-lg', sub: 'text-[11px]', gap: 'gap-2.5' },
    lg: { icon: 50, title: 'text-2xl', sub: 'text-xs', gap: 'gap-3' },
    xl: { icon: 64, title: 'text-3xl', sub: 'text-sm', gap: 'gap-3.5' },
  }[size]

  const isDark = variant === 'dark'

  return (
    <div className={`flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* 🌴✨ Attractive Vector Emblem */}
      <div
        className="relative shrink-0 rounded-2xl p-0.5 shadow-md transition-transform duration-300 hover:scale-105"
        style={{
          width: dimensions.icon,
          height: dimensions.icon,
          background: 'linear-gradient(135deg, #e85d04 0%, #f59e0b 50%, #047857 100%)',
        }}
      >
        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center relative overflow-hidden border border-amber-400/30">
          {/* Subtle gold ray background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent" />

          {/* SVG Artwork: Coconut Palm + Kerala Lamp Flame + RS Monogram */}
          <svg
            viewBox="0 0 100 100"
            className="w-[85%] h-[85%] relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rsGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="rsEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="rsFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>
            </defs>

            {/* Stylized Kerala Coconut Palm Frond Curve (Left) */}
            <path
              d="M 18 78 C 16 52 30 30 46 20 C 38 27 34 38 36 50 C 37 57 32 68 18 78 Z"
              fill="url(#rsEmerald)"
              opacity="0.85"
            />
            <path
              d="M 28 36 C 21 34 16 38 14 42"
              stroke="#6EE7B7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 33 46 C 24 46 19 52 17 58"
              stroke="#6EE7B7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Kerala Lamp / Tea Aroma Flame Accent (Top Center) */}
            <path
              d="M 50 10 C 53 17 57 20 55 26 C 53 30 47 30 45 26 C 43 20 47 17 50 10 Z"
              fill="url(#rsFlame)"
            />

            {/* Royal Interlocking Monogram: R & S */}
            {/* Letter R */}
            <path
              d="M 36 74 V 38 H 51 C 58 38 62 42 62 48 C 62 53 58 57 51 57 H 44 M 44 57 L 57 74"
              stroke="url(#rsGold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Letter S (weaving into R) */}
            <path
              d="M 69 44 C 67 40 62 38 56 38 M 47 56 C 54 55 68 57 68 64 C 68 71 59 74 51 74 C 44 74 39 71 38 68"
              stroke="#FFF"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Small decorative sparkle star */}
            <circle cx="76" cy="28" r="3.5" fill="#FDE68A" />
            <path d="M 76 22 V 34 M 70 28 H 82" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 🏷️ Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-extrabold tracking-tight text-amber-500 drop-shadow-sm">
            RS
          </span>
          <span
            className={`font-display font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            } ${dimensions.title}`}
          >
            Kerala Café
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-semibold tracking-wider uppercase mt-1 ${dimensions.sub} ${
              isDark ? 'text-emerald-400' : 'text-primary-600'
            }`}
          >
            Malabar & South Indian Kitchen
          </span>
        )}
      </div>
    </div>
  )
}

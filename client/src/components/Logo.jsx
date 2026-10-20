import React from 'react';

/**
 * TechReachly Vector Mark with Dynamic Animation & Atmospheric Effects
 * Designed with StitchMCP (Precision Intelligence Design System)
 * Combines an upward reaching supersonic trajectory arrow with radial AI pulse rings,
 * dynamic shimmer, and a glowing apex star spark.
 */
export function LogoMark({ className = 'w-6 h-6', animated = true, ...props }) {
  const idPrefix = React.useId().replace(/:/g, '');
  const reachGradId = `reachGrad-${idPrefix}`;
  const ringGradId = `ringGrad-${idPrefix}`;
  const glowFilterId = `glowFilter-${idPrefix}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      {...props}
    >
      <defs>
        <linearGradient id={reachGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="45%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        <linearGradient id={ringGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.95" />
        </linearGradient>

        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Radial AI Radar & Pulse Wave Rings */}
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        className="text-slate-300 dark:text-zinc-800 transition-colors"
      />
      <path
        d="M 22 76 A 38 38 0 0 1 78 22"
        stroke={`url(#${ringGradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        className={animated ? 'animate-reach-radar' : ''}
      />
      <path
        d="M 34 78 A 26 26 0 0 1 76 36"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.85"
        className={animated ? 'animate-reach-radar' : ''}
        style={{ animationDelay: '0.8s' }}
      />

      {/* Upward Reach Supersonic Dynamic Arrow Geometry */}
      <g
        transform="translate(6, 2)"
        className={`transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 ${
          animated ? 'animate-reach-arrow' : ''
        }`}
      >
        {/* Main faceted gradient body */}
        <path
          d="M 18 70 L 70 18 L 52 78 L 40 52 Z"
          fill={`url(#${reachGradId})`}
          filter={`url(#${glowFilterId})`}
        />
        {/* Shaded faceted depth plane */}
        <path
          d="M 70 18 L 40 52 L 54 50 Z"
          fill="#312E81"
          opacity="0.85"
        />
        {/* Underside wing plane */}
        <path
          d="M 18 70 L 40 52 L 32 62 Z"
          fill="#1E1B4B"
          opacity="0.9"
        />

        {/* AI Apex Star Spark with Twinkle Effect */}
        <g className={animated ? 'animate-reach-spark' : ''}>
          <path
            d="M 70 11 Q 70 18, 77 18 Q 70 18, 70 25 Q 70 18, 63 18 Q 70 18, 70 11 Z"
            fill="#22D3EE"
          />
          <circle cx="70" cy="18" r="1.8" fill="#FFFFFF" />
        </g>

        {/* Trajectory micro-nodes with pulse animation */}
        <circle
          cx="18"
          cy="70"
          r="3"
          fill="#06B6D4"
          className={animated ? 'animate-reach-dot' : ''}
        />
        <circle
          cx="28"
          cy="78"
          r="2"
          fill="#7C3AED"
          className={animated ? 'animate-reach-dot' : ''}
          style={{ animationDelay: '1s' }}
        />
      </g>
    </svg>
  );
}

/**
 * Squircle macOS/iOS Style Brand Icon Tile with Dynamic Backlight Aura
 */
export function LogoSquircle({ size = 'md', animated = true, className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-lg p-1.5',
    md: 'w-10 h-10 rounded-xl p-2',
    lg: 'w-12 h-12 rounded-2xl p-2.5',
    xl: 'w-16 h-16 rounded-[22px] p-3.5',
  };

  const containerClasses = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 group/squircle ${className}`}>
      {/* Ambient Multi-Stop Glowing Aura */}
      {animated && (
        <div
          className={`absolute -inset-1 rounded-[inherit] bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 opacity-40 blur-md group-hover:opacity-85 group-hover:scale-110 transition-all duration-500 pointer-events-none animate-reach-ambient`}
        />
      )}

      {/* Main Squircle Container */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-zinc-950 to-[#060E20] border border-slate-700/50 dark:border-zinc-800 shadow-md shadow-indigo-500/15 group-hover:shadow-indigo-500/30 group-hover:border-indigo-400/50 group-hover:scale-[1.03] transition-all duration-300 ${containerClasses}`}
      >
        {/* Subtle Glass Surface Reflection Top Gradient */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

        <LogoMark
          animated={animated}
          className="w-full h-full relative z-10 drop-shadow-[0_2px_10px_rgba(79,70,229,0.45)]"
        />
      </div>
    </div>
  );
}

/**
 * Full Brand Lockup with Animated Typography & Badges
 */
export default function Logo({
  variant = 'full', // 'full' | 'mark' | 'squircle'
  size = 'md',
  animated = true,
  showBadge = true,
  badgeText = 'v1.0',
  className = '',
}) {
  if (variant === 'mark') {
    return <LogoMark animated={animated} className={`w-8 h-8 ${className}`} />;
  }

  if (variant === 'squircle') {
    return <LogoSquircle size={size} animated={animated} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <LogoSquircle size={size} animated={animated} />
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center">
          <span>Tech</span>
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent group-hover:animate-reach-gradient transition-all">
            Reach
          </span>
          <span className="text-slate-500 dark:text-zinc-400 font-semibold group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors">
            ly
          </span>
        </span>

        {showBadge && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500/30 bg-indigo-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded-full shadow-xs group-hover:border-indigo-300 dark:group-hover:border-cyan-400/50 transition-colors">
            {animated && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
            )}
            <span>{badgeText}</span>
          </span>
        )}
      </div>
    </div>
  );
}

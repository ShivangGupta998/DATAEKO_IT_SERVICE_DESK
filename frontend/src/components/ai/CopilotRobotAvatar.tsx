import React from 'react';

interface CopilotRobotAvatarProps {
  className?: string;
  size?: number;
}

export const CopilotRobotAvatar: React.FC<CopilotRobotAvatarProps> = ({
  className = '',
  size = 76,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Ambient Sky & Indigo Outer Glow */}
      <div className="absolute inset-0 rounded-full bg-sky-500/25 blur-xl animate-pulse" />
      <div className="absolute -inset-2 rounded-full bg-indigo-600/20 blur-2xl animate-pulse" />

      {/* 2. Swirling Sky/Indigo Particle Trail (Rotating Ring) */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_6s_linear_infinite]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <defs>
          <linearGradient id="swirlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbit Trail Ellipses */}
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="22"
          transform="rotate(-25 50 50)"
          stroke="url(#swirlGrad)"
          strokeWidth="2.5"
          strokeDasharray="16 8 32 12"
          filter="url(#glowFilter)"
        />

        {/* Orbiting Sparks */}
        <circle cx="86" cy="38" r="2.5" fill="#38bdf8" filter="url(#glowFilter)" />
        <circle cx="20" cy="68" r="2" fill="#22d3ee" filter="url(#glowFilter)" />
        <circle cx="70" cy="72" r="1.8" fill="#60a5fa" filter="url(#glowFilter)" />
        <circle cx="34" cy="28" r="1.5" fill="#a5f3fc" />
      </svg>

      {/* Counter-rotating subtle spark ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_9s_linear_infinite_reverse]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="34"
          transform="rotate(35 50 50)"
          stroke="rgba(6, 182, 212, 0.35)"
          strokeWidth="1.2"
          strokeDasharray="6 14"
        />
        <circle cx="78" cy="62" r="2" fill="#38bdf8" />
        <circle cx="22" cy="38" r="1.6" fill="#67e8f9" />
      </svg>

      {/* 3. Friendly 3D Robot Character (Hover Floating) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center animate-[bounce_4s_ease-in-out_infinite]">
        <svg
          viewBox="0 0 100 100"
          className="w-[82%] h-[82%] drop-shadow-[0_10px_20px_rgba(2,6,23,0.8)]"
          fill="none"
        >
          <defs>
            {/* Robot Head Metallic Chrome Gradient */}
            <linearGradient id="robotHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#e2e8f0" />
              <stop offset="65%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Robot Visor / Screen Gradient */}
            <linearGradient id="robotVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#081426" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Robot Body Metallic Gradient */}
            <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Eye Glow Filter */}
            <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ears / Side Antennas */}
          {/* Left Ear */}
          <rect x="18" y="32" width="7" height="12" rx="3.5" fill="#64748b" />
          <rect x="20" y="34" width="3" height="8" rx="1.5" fill="#38bdf8" />

          {/* Right Ear */}
          <rect x="75" y="32" width="7" height="12" rx="3.5" fill="#64748b" />
          <rect x="77" y="34" width="3" height="8" rx="1.5" fill="#38bdf8" />

          {/* Top Antenna */}
          <rect x="47.5" y="10" width="5" height="12" rx="2.5" fill="#94a3b8" />
          <circle cx="50" cy="9" r="4.5" fill="#38bdf8" filter="url(#eyeGlow)" />
          <circle cx="50" cy="9" r="2" fill="#ffffff" />

          {/* Floating Robot Arms */}
          {/* Left Arm */}
          <path
            d="M 24 58 C 18 64, 18 72, 26 76 C 30 78, 34 74, 30 68 Z"
            fill="url(#robotBodyGrad)"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          {/* Right Arm */}
          <path
            d="M 76 58 C 82 64, 82 72, 74 76 C 70 78, 66 74, 70 68 Z"
            fill="url(#robotBodyGrad)"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />

          {/* Robot Body */}
          <rect
            x="32"
            y="54"
            width="36"
            height="26"
            rx="12"
            fill="url(#robotBodyGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Body Chest Light / Core */}
          <circle cx="50" cy="66" r="6" fill="#0369a1" />
          <circle cx="50" cy="66" r="4" fill="#38bdf8" filter="url(#eyeGlow)" />
          <circle cx="50" cy="66" r="1.8" fill="#ffffff" />

          {/* Robot Head Outer Casing */}
          <rect
            x="24"
            y="18"
            width="52"
            height="38"
            rx="16"
            fill="url(#robotHeadGrad)"
            stroke="#ffffff"
            strokeWidth="1.4"
          />

          {/* Beveled Head Light Reflection */}
          <path
            d="M 32 21 Q 50 19 68 21"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Visor Screen Face */}
          <rect
            x="29"
            y="24"
            width="42"
            height="26"
            rx="11"
            fill="url(#robotVisorGrad)"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Smiling Friendly LED Eyes (Curved Crescent Arcs) */}
          {/* Left Eye */}
          <path
            d="M 36 37 Q 41 31 46 37"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
            filter="url(#eyeGlow)"
          />
          {/* Right Eye */}
          <path
            d="M 54 37 Q 59 31 64 37"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
            filter="url(#eyeGlow)"
          />

          {/* Cute Rosy Cheek Glows */}
          <circle cx="35" cy="43" r="2.2" fill="#06b6d4" opacity="0.6" />
          <circle cx="65" cy="43" r="2.2" fill="#06b6d4" opacity="0.6" />

          {/* Friendly Smile Indicator */}
          <path
            d="M 47 43 Q 50 45 53 43"
            stroke="#7dd3fc"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default CopilotRobotAvatar;

// Jyot Chakra — new brand icon. useId() makes gradient/filter IDs collision-free
// when multiple instances render in the same document.
import { useId } from 'react';

export default function Logo({ size = 48, className = '' }) {
  const u = useId().replace(/:/g, '');

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Jyotish Stack AI">
      <defs>
        <radialGradient id={`bg${u}`} cx="40%" cy="35%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#1E2348"/>
          <stop offset="55%"  stopColor="#0E1228"/>
          <stop offset="100%" stopColor="#060810"/>
        </radialGradient>
        <linearGradient id={`gd${u}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F8E878"/>
          <stop offset="42%"  stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#8B6A14"/>
        </linearGradient>
        <linearGradient id={`gd2${u}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#F2DC58"/>
          <stop offset="100%" stopColor="#C49A28"/>
        </linearGradient>
        <radialGradient id={`gw${u}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,175,55,0.35)"/>
          <stop offset="60%"  stopColor="rgba(212,175,55,0.08)"/>
          <stop offset="100%" stopColor="rgba(212,175,55,0)"/>
        </radialGradient>
        <radialGradient id={`fl${u}`} cx="50%" cy="22%" r="60%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#FFFDE8"/>
          <stop offset="28%"  stopColor="#F8DE40"/>
          <stop offset="68%"  stopColor="#D4A020"/>
          <stop offset="100%" stopColor="#9A6410"/>
        </radialGradient>
        <filter id={`fg${u}`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background disc */}
      <circle cx="50" cy="50" r="49" fill="#020308" opacity=".5"/>
      <circle cx="50" cy="50" r="48" fill={`url(#bg${u})`}/>

      {/* Outer border ring */}
      <circle cx="50" cy="50" r="47" fill="none" stroke={`url(#gd${u})`} strokeWidth="1.2" opacity=".65"/>

      {/* 12 zodiac dots at r=43 — cardinal (r=2) and non-cardinal (r=1.5) */}
      <circle cx="50"   cy="7"    r="2"   fill={`url(#gd${u})`}/>
      <circle cx="71.5" cy="12.8" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="87.2" cy="28.5" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="93"   cy="50"   r="2"   fill={`url(#gd${u})`}/>
      <circle cx="87.2" cy="71.5" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="71.5" cy="87.2" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="50"   cy="93"   r="2"   fill={`url(#gd${u})`}/>
      <circle cx="28.5" cy="87.2" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="12.8" cy="71.5" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="7"    cy="50"   r="2"   fill={`url(#gd${u})`}/>
      <circle cx="12.8" cy="28.5" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>
      <circle cx="28.5" cy="12.8" r="1.5" fill={`url(#gd${u})`} opacity=".82"/>

      {/* Main ring r=41 */}
      <circle cx="50" cy="50" r="41" fill="none" stroke={`url(#gd${u})`} strokeWidth="1.5"/>

      {/* Shatkona r=31
          T1 up:   (50,19)(76.8,65.5)(23.2,65.5)
          T2 down: (50,81)(76.8,34.5)(23.2,34.5)  */}
      <polygon points="50,19 76.8,65.5 23.2,65.5"
        fill="rgba(212,175,55,0.10)" stroke={`url(#gd${u})`}  strokeWidth="1.2" opacity=".95"/>
      <polygon points="50,81 76.8,34.5 23.2,34.5"
        fill="rgba(212,175,55,0.10)" stroke={`url(#gd2${u})`} strokeWidth="1.2" opacity=".95"/>

      {/* Inner-hexagon accent dots at r=18 (31/√3≈17.9)
          0°(68,50) 60°(59,65.6) 120°(41,65.6) 180°(32,50) 240°(41,34.4) 300°(59,34.4) */}
      <g fill={`url(#gd${u})`} opacity=".8">
        <circle cx="68"   cy="50"   r="1.2"/>
        <circle cx="59"   cy="65.6" r="1.2"/>
        <circle cx="41"   cy="65.6" r="1.2"/>
        <circle cx="32"   cy="50"   r="1.2"/>
        <circle cx="41"   cy="34.4" r="1.2"/>
        <circle cx="59"   cy="34.4" r="1.2"/>
      </g>

      {/* Central glow */}
      <circle cx="50" cy="50" r="21" fill={`url(#gw${u})`}/>

      {/* Jyot Flame — tip y=33.2, base y=61.5 (scaled from 512→100 viewBox) */}
      <path d="M 50 61.5 C 44.1 57.4 42.0 51.6 45.9 45.7 C 48.1 42.4 50 39.8 50 33.2 C 50 39.8 51.9 42.4 54.1 45.7 C 58.0 51.6 55.9 57.4 50 61.5 Z"
        fill={`url(#fl${u})`} filter={`url(#fg${u})`}/>
      <path d="M 50 59.4 C 46.7 56.3 45.3 51.9 47.7 47.7 C 49.0 45.1 50 42.9 50 37.8 C 50 42.9 51.0 45.1 52.3 47.7 C 54.7 51.9 53.3 56.3 50 59.4 Z"
        fill="rgba(255,254,232,0.90)"/>
      <circle cx="50" cy="37.9" r="1" fill="white" opacity=".80"/>
    </svg>
  );
}

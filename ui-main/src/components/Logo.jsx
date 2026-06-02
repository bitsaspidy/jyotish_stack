// Royal JS logo — yantra-inspired. Uses unique IDs so multiple instances don't clash.
import { useId } from 'react';

export default function Logo({ size = 48, className = '' }) {
  const uid = useId().replace(/:/g, '');   // stable, collision-free

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Jyotish Stack AI">

      {/* Dashed orbital ring */}
      <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="1.4"
        strokeDasharray="4 3" opacity="0.55" />

      {/* Star-of-David / two overlapping triangles */}
      <polygon points="50,14 86,71 14,71" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.35" />
      <polygon points="50,86 14,29 86,29" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.35" />

      {/* Inner filled circle */}
      <circle cx="50" cy="50" r="30" fill={`url(#bg${uid})`} />

      {/* Gold inner ring */}
      <circle cx="50" cy="50" r="30" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4" />

      {/* Monogram */}
      <text x="50" y="57" textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700"
        fontSize="21" fill={`url(#txt${uid})`} letterSpacing="1.5">
        JS
      </text>

      {/* Crown dot */}
      <circle cx="50" cy="4" r="2.5" fill="#D4AF37" opacity="0.8" />

      <defs>
        <radialGradient id={`bg${uid}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#2D2570" />
          <stop offset="100%" stopColor="#06070F" />
        </radialGradient>
        <linearGradient id={`txt${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F0D060" />
          <stop offset="100%" stopColor="#A88B20" />
        </linearGradient>
      </defs>
    </svg>
  );
}

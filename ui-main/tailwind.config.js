/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/views/**/*.{js,jsx,ts,tsx}',           // renamed from pages/
    './src/admin-views/**/*.{js,jsx,ts,tsx}',
    './src/admin-components/**/*.{js,jsx,ts,tsx}',
    './src/context/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '100rem',
      },
      colors: {
        cosmos: { DEFAULT: '#0B0D1A', 900: '#06070F', 800: '#0B0D1A', 700: '#111428', 600: '#181C35' },
        gold: { DEFAULT: '#D4AF37', light: '#F0D060', dark: '#A88B20', muted: '#8B7030' },
        crimson: { DEFAULT: '#8B0000', light: '#C0392B', glow: '#FF4444' },
        ivory: { DEFAULT: '#F5F0E8', muted: '#C8BFA8' },
        saffron: { DEFAULT: '#FF9933', light: '#FFB347' },
        indigo: { DEFAULT: '#3D3580', light: '#6C63D8', dark: '#251F5A' },
      },
      fontFamily: {
        sans:        ['var(--font-inter)',       'system-ui', 'sans-serif'],
        serif:       ['var(--font-playfair)',     'Georgia',   'serif'],
        devanagari:  ['var(--font-devanagari)',   'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'glow':      'glow 3s ease-in-out infinite alternate',
        'float':     'float 6s ease-in-out infinite',
        'shimmer':   'shimmer 2.5s linear infinite',
        'pulse-gold':'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        glow:      { from: { textShadow: '0 0 10px #D4AF37' }, to: { textShadow: '0 0 30px #F0D060, 0 0 60px #D4AF37' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer:   { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 8px rgba(212,175,55,0.3)' }, '50%': { boxShadow: '0 0 24px rgba(212,175,55,0.7)' } },
      },
      backgroundImage: {
        'starfield':     'radial-gradient(ellipse at top, #181C35 0%, #0B0D1A 60%, #06070F 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #A88B20 100%)',
      },
      boxShadow: {
        'gold':     '0 0 20px rgba(212,175,55,0.4)',
        'gold-lg':  '0 0 40px rgba(212,175,55,0.5)',
        'cosmos':   '0 8px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

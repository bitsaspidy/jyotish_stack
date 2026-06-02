/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}', './src/views/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        deep:    { DEFAULT: '#120A06', 800: '#1A0D08', 700: '#231008', 600: '#2C1510' },
        saffron: { DEFAULT: '#FF9933', dark: '#E07B1A', light: '#FFB347', glow: '#FFCC66' },
        gold:    { DEFAULT: '#D4AF37', light: '#F0D060', dark: '#A88B20' },
        maroon:  { DEFAULT: '#8B1A1A', light: '#C0392B', deep: '#5C0A0A' },
        ivory:   { DEFAULT: '#FFF8F0', muted: '#D4C4B0' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        devanagari: ['var(--font-devanagari)', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 30s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
};

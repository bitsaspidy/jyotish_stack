/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}', './src/pages/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cosmos: { DEFAULT: '#0B0D1A', 900: '#06070F', 800: '#0B0D1A', 700: '#111428', 600: '#181C35' },
        gold: { DEFAULT: '#D4AF37', light: '#F0D060', dark: '#A88B20' },
        crimson: { DEFAULT: '#8B0000', light: '#C0392B' },
        ivory: { DEFAULT: '#F5F0E8', muted: '#C8BFA8' },
        indigo: { DEFAULT: '#3D3580', light: '#6C63D8', dark: '#251F5A' },
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

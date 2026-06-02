/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ui-ai-in: Hybrid saffron + AI cyan on deep dark
        night: { DEFAULT: '#060810', 800: '#0A0D1C', 700: '#0E1228' },
        saffron: { DEFAULT: '#FF9933', dark: '#E07B1A', light: '#FFB347' },
        cyan:   { DEFAULT: '#00D4FF', dark: '#0099CC', light: '#66E5FF' },
        gold:   { DEFAULT: '#D4AF37', light: '#F0D060' },
        ivory:  { DEFAULT: '#FFF5E8', muted: '#C0B0A0' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

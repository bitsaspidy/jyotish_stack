/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ui-ai-com: AI/Tech — dark navy + electric cyan + purple
        night:  { DEFAULT: '#040810', 800: '#060A1A', 700: '#0A0F2A', 600: '#0E1535' },
        cyan:   { DEFAULT: '#00D4FF', dark: '#0099CC', light: '#66E5FF', glow: '#00FFFF' },
        violet: { DEFAULT: '#7B2FBE', light: '#A855F7', dark: '#5B1A9E', glow: '#CC77FF' },
        matrix: { DEFAULT: '#00FF88', dark: '#00CC66', dim: '#003322' },
        ivory:  { DEFAULT: '#E8F4FF', muted: '#A0B8D0' },
        gold:   { DEFAULT: '#D4AF37', light: '#F0D060' },
        saffron:{ DEFAULT: '#FF9933' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        devanagari: ['var(--font-devanagari)', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-cyan': 'pulseCyan 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseCyan: { '0%,100%': { boxShadow: '0 0 10px #00D4FF' }, '50%': { boxShadow: '0 0 30px #00D4FF, 0 0 60px #0099CC' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
    },
  },
  plugins: [],
};

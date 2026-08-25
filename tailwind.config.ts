import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-vazir)', 'Tahoma', 'sans-serif'] },
      colors: {
        brand: {
          50: '#ecfdf8',
          100: '#d1faed',
          300: '#6ee7c8',
          500: '#14b88a',
          600: '#0d9672',
          700: '#0b785e',
          900: '#12483d',
        },
      },
      boxShadow: { soft: '0 8px 28px rgba(15,23,42,.06)' },
    },
  },
  plugins: [],
} satisfies Config;

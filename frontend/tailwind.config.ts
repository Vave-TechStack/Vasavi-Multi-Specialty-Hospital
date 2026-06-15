// tailwind.config.ts
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: '#0F766E',
        secondary: '#14B8A6',
        accent: '#0EA5E9',
        light: '#F8FAFC',
        dark: '#0F172A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 118, 110, 0.12)',
      },
    },
  },
  plugins: [forms],
};

export default config;

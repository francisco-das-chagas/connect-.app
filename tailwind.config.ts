import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#b6c8ff',
          300: '#8aa6f5',
          400: '#5c7de8',
          500: '#0a1930',
          600: '#071428',
          700: '#030816',
          800: '#020610',
          900: '#01040a',
        },
        accent: {
          50: '#fef9ec',
          100: '#fdf0c8',
          200: '#fbe38e',
          300: '#f7d054',
          400: '#F2C94C',
          500: '#F2C94C',
          600: '#d4a84b',
          700: '#a47e2c',
          800: '#86651f',
          900: '#6b4f18',
        },
        gold: {
          DEFAULT: '#F2C94C',
          light: '#f7d96e',
          dark: '#d4a84b',
          muted: 'rgba(242, 201, 76, 0.3)',
        },
        navy: {
          DEFAULT: '#030816',
          light: '#0a1930',
          dark: '#01040a',
          500: '#0a1930',
          600: '#071428',
          700: '#030816',
          800: '#020610',
          900: '#01040a',
        },
        silver: {
          DEFAULT: '#9ca3af',
          light: '#d1d5db',
          dark: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tight-heading': '-0.02em',
        'wide-label': '0.1em',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './actions/**/*.{js,ts,jsx,tsx,mdx}', './emails/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}', './utils/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        brand: {
          50: '#eefbf7',
          100: '#d5f5eb',
          200: '#a9ead7',
          300: '#73d9bc',
          400: '#38bb98',
          500: '#1b9878',
          600: '#137964',
          700: '#115f52',
          800: '#114b43',
          900: '#0f3e38',
        },
      },
    },
  },
  plugins: [],
};

export default config;

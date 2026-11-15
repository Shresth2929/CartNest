/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dcce',
          300: '#9bc3ad',
          400: '#6ea389',
          500: '#4d876d',
          600: '#3c6e57',
          700: '#325847', // Primary accent
          800: '#2b473b',
          900: '#253b32',
          950: '#13211b',
        },
        charcoal: {
          50: '#f6f6f7',
          100: '#e2e3e5',
          200: '#c5c7cb',
          300: '#a1a4ab',
          400: '#7f828c',
          500: '#646771',
          600: '#4e5058',
          700: '#3f4147',
          800: '#2b2c30', // Primary dark text
          900: '#1c1d20',
          950: '#111214',
        },
        cream: {
          50: '#faf8f5', // Warm off-white
          100: '#f5f1eb',
          200: '#ece5dc',
          300: '#dfd4c5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

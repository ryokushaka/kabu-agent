/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      colors: {
        // Toss-like Color Palette
        toss: {
          blue: '#3182F6', // Primary Blue
          red: '#F04452',  // Rise / Error
          grey: {
            50: '#F9FAFB',
            100: '#F2F4F6', // Background
            200: '#E5E8EB',
            300: '#D1D6DB',
            400: '#B0B8C1',
            500: '#8B95A1', // Caption
            600: '#6B7684',
            700: '#4E5968', // Sub text
            800: '#333D4B', // Main text
            900: '#191F28', // Title
          }
        }
      }
    },
  },
  plugins: [],
}

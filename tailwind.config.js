/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          800: '#0A4D3C', // Deep Emerald (Requested)
          900: '#003311',
        },
        gold: {
          100: '#F9F1D0',
          300: '#E5C15D',
          400: '#FFD700',
          500: '#D4AF37', // Highlight Gold (Requested)
          600: '#AA8822',
        }
      },
      fontFamily: {
        serif: ['"Didot"', '"Bodoni MT"', '"Playfair Display"', 'serif'], // Luxury font stack
      }
    },
  },
  plugins: [],
}

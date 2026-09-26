/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Merriweather', 'serif'],
      },
      colors: {
        academic: {
          blue: '#1E3A8A', // Navy Blue
          lightBlue: '#3B82F6',
          dark: '#0F172A',
          light: '#F8FAFC', // Soft Cream
          border: '#E2E8F0',
          borderDark: '#334155',
          gold: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}

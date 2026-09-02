/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        access: {
          green: '#10B981',
          emerald: '#059669',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#2563EB',
          indigo: '#4F46E5',
          dark: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}


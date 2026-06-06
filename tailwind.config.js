/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        celestial: {
          navy: '#0f0f2e',
          indigo: '#1a1a4e',
          gold: '#f5c842',
          'gold-light': '#fde68a',
          blue: '#4a90d9',
          star: '#e8e8f8',
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        celestial: {
          navy: '#0a0a1e',
          indigo: '#12123a',
          'indigo-light': '#1e1e5a',
          gold: '#d4af37',
          'gold-bright': '#f5c842',
          'gold-glow': '#fde68a',
          blue: '#4a90d9',
          'blue-dark': '#2563a8',
          star: '#e8e8f8',
          'star-dim': '#9090b8',
          white: '#f0f0ff',
        },
      },
      fontFamily: {
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'pin-glow': '0 0 12px 4px rgba(212, 175, 55, 0.6)',
        'pin-hover': '0 0 20px 8px rgba(245, 200, 66, 0.8)',
        'panel': '0 0 40px rgba(10, 10, 30, 0.8)',
      },
      animation: {
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 12px 4px rgba(212, 175, 55, 0.6)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(245, 200, 66, 0.85)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

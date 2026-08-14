/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pravaah dark ops-center palette
        surface: {
          DEFAULT: '#080c14',
          elevated: '#0d1421',
          card: '#111827',
          border: '#1e2a3a',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          dim: '#0891b2',
          bright: '#22d3ee',
          subtle: 'rgba(6,182,212,0.12)',
        },
        regime: {
          flowing: '#22c55e',
          'flowing-dim': '#16a34a',
          'flowing-bg': 'rgba(34,197,94,0.10)',
          stopgo: '#f59e0b',
          'stopgo-dim': '#d97706',
          'stopgo-bg': 'rgba(245,158,11,0.10)',
          turbulent: '#ef4444',
          'turbulent-dim': '#dc2626',
          'turbulent-bg': 'rgba(239,68,68,0.10)',
        },
        risk: {
          low: '#22c55e',
          elevated: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid-pattern': '24px 24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

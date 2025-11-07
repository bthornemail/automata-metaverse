export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        automaton: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dimensions: {
          '0d': '#6366f1', // indigo
          '1d': '#8b5cf6', // violet
          '2d': '#ec4899', // pink
          '3d': '#f59e0b', // amber
          '4d': '#10b981', // emerald
          '5d': '#06b6d4', // cyan
          '6d': '#3b82f6', // blue
          '7d': '#a855f7', // purple
        },
      },
      stroke: {
        'dimensions-0d': '#6366f1',
        'dimensions-1d': '#8b5cf6',
        'dimensions-2d': '#ec4899',
        'dimensions-3d': '#f59e0b',
        'dimensions-4d': '#10b981',
        'dimensions-5d': '#06b6d4',
        'dimensions-6d': '#3b82f6',
        'dimensions-7d': '#a855f7',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
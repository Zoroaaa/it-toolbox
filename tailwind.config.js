/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Design system: dark industrial theme
        bg: {
          base:    '#0a0a0f',
          surface: '#111118',
          raised:  '#1a1a24',
          overlay: '#22222e',
        },
        border: {
          subtle: '#ffffff08',
          base:   '#ffffff12',
          strong: '#ffffff20',
        },
        accent: {
          DEFAULT: '#6ee7b7',  // mint green
          dim:     '#6ee7b730',
          hover:   '#a7f3d0',
        },
        text: {
          primary:   '#f0f0f8',
          secondary: '#9090a8',
          muted:     '#505060',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      }
    },
  },
  plugins: [],
}

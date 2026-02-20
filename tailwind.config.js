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
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          raised: 'var(--bg-raised)',
          overlay: 'var(--bg-overlay)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          base: 'var(--border-base)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
          hover: 'var(--accent-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'theme-switch': 'themeSwitch 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        themeSwitch: { 
          '0%': { opacity: '0.8' }, 
          '100%': { opacity: '1' } 
        },
      },
      transitionProperty: {
        'theme': 'background-color, border-color, color, fill, stroke',
      }
    },
  },
  plugins: [],
}

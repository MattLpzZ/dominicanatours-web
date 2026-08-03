import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: 'var(--color-accent)', 2: 'var(--color-accent-2)' },
        'dt-text': {
          DEFAULT: 'var(--color-text)',
          2: 'var(--color-text-2)',
          3: 'var(--color-text-3)',
        },
        'dt-bg': { DEFAULT: 'var(--color-bg)', 2: 'var(--color-bg-2)' },
        'dt-surface': 'var(--color-surface)',
        'dt-border': 'var(--color-border)',
        'dt-dark': '#111111',
        gold: '#E8B94F',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
      },
      borderRadius: { dt: '16px', 'dt-sm': '10px' },
      boxShadow: {
        dt: '0 2px 20px rgba(0,0,0,0.07)',
        'dt-md': '0 8px 40px rgba(0,0,0,0.13)',
        'dt-lg': '0 20px 60px rgba(0,0,0,0.22)',
      },
    },
  },
}
export default config

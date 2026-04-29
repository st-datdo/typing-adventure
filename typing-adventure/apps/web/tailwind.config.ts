import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          dim: 'var(--color-text-dim)',
        },
        correct: 'var(--color-correct)',
        wrong: 'var(--color-wrong)',
        active: 'var(--color-active)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          glow: 'var(--color-accent-glow)',
        },
        key: {
          bg: 'var(--key-bg)',
          hover: 'var(--key-bg-hover)',
          border: 'var(--key-border)',
          shadow: 'var(--key-shadow)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
      },
      transitionTimingFunction: {
        bounce: 'var(--ease-bounce)',
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}

export default config

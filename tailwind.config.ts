import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Palette
        primary: {
          DEFAULT: 'var(--md-primary)',
          foreground: 'var(--md-on-primary)',
          container: 'var(--md-primary-container)',
          'on-container': 'var(--md-on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--md-secondary)',
          foreground: 'var(--md-on-secondary)',
          container: 'var(--md-secondary-container)',
          'on-container': 'var(--md-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--md-tertiary)',
          foreground: 'var(--md-on-tertiary)',
          container: 'var(--md-tertiary-container)',
          'on-container': 'var(--md-on-tertiary-container)',
        },
        surface: {
          DEFAULT: 'var(--md-surface)',
          dim: 'var(--md-surface-dim)',
          bright: 'var(--md-surface-bright)',
          container: 'var(--md-surface-container)',
          'container-low': 'var(--md-surface-container-low)',
          'container-high': 'var(--md-surface-container-high)',
          'container-highest': 'var(--md-surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--md-on-surface)',
          variant: 'var(--md-on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--md-outline)',
          variant: 'var(--md-outline-variant)',
        },
        error: {
          DEFAULT: 'var(--md-error)',
          foreground: 'var(--md-on-error)',
          container: 'var(--md-error-container)',
          'on-container': 'var(--md-on-error-container)',
        },
      },
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '28px',
        'm3-full': '9999px',
      },
      boxShadow: {
        'm3-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.08), 0px 1px 2px 0px rgba(0, 0, 0, 0.12)',
        'm3-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.08), 0px 1px 2px 0px rgba(0, 0, 0, 0.12)',
        'm3-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.08), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;

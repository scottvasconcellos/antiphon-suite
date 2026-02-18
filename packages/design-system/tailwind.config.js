/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './stories/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background tiers
        'bg-page': 'var(--color-bg-page)',
        'bg-app-shell': 'var(--color-bg-app-shell)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-surface-elevated': 'var(--color-bg-surface-elevated)',
        'bg-inset': 'var(--color-bg-inset)',
        'bg-scrim': 'var(--color-bg-scrim)',
        
        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-inverse': 'var(--color-text-inverse)',
        'text-danger': 'var(--color-text-danger)',
        'text-accent': 'var(--color-text-accent)',
        'text-link': 'var(--color-text-link)',
        
        // Border colors
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)',
        'border-focus': 'var(--color-border-focus)',
        'border-error': 'var(--color-border-error)',
        
        // Overlay colors
        'overlay-hover': 'var(--color-overlay-hover)',
        'overlay-active': 'var(--color-overlay-active)',
        'overlay-selected': 'var(--color-overlay-selected)',
        'overlay-armed': 'var(--color-overlay-armed)',
        
        // Accent colors
        'accent-primary': 'var(--color-accent-primary)',
        'accent-primary-hover': 'var(--color-accent-primary-hover)',
        'accent-primary-active': 'var(--color-accent-primary-active)',
        'accent-success': 'var(--color-accent-success)',
        'accent-warning': 'var(--color-accent-warning)',
        'accent-danger': 'var(--color-accent-danger)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'Monaco', 'monospace'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': 'var(--font-size-display-lg)',
        'display-md': 'var(--font-size-display-md)',
        'display-sm': 'var(--font-size-display-sm)',
        'heading-lg': 'var(--font-size-heading-lg)',
        'heading-md': 'var(--font-size-heading-md)',
        'heading-sm': 'var(--font-size-heading-sm)',
        'body-lg': 'var(--font-size-body-lg)',
        'body-md': 'var(--font-size-body-md)',
        micro: 'var(--font-size-micro)',
        code: 'var(--font-size-code)',
      },
      spacing: {
        'md': 'var(--spacing-md)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
        overlay: 'var(--shadow-overlay)',
        inset: 'var(--shadow-inset)',
        bevel: 'var(--shadow-bevel)',
      },
      letterSpacing: {
        tight: 'var(--tracking-tight)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
        widest: 'var(--tracking-widest)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
      },
      transitionTimingFunction: {
        'ease-in': 'var(--ease-in)',
        'ease-out': 'var(--ease-out)',
        'ease-in-out': 'var(--ease-in-out)',
      },
    },
  },
  plugins: [],
};

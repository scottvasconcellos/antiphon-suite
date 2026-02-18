/**
 * Typography Design Tokens
 * Extracted from Figma export - Premium Dark-Mode Design System
 */

export const typography = {
  // Font Families
  font: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    display: 'var(--font-display)',
    ui: 'var(--font-ui)',
  },

  // Font Sizes
  fontSize: {
    // Display sizes (for marketing/hero)
    displayLg: 'var(--font-size-display-lg)', // 3.5rem
    displayMd: 'var(--font-size-display-md)', // 2.5rem
    displaySm: 'var(--font-size-display-sm)', // 2rem

    // Heading sizes
    headingLg: 'var(--font-size-heading-lg)', // 1.5rem
    headingMd: 'var(--font-size-heading-md)', // 1.25rem
    headingSm: 'var(--font-size-heading-sm)', // 1rem

    // Body sizes
    bodyLg: 'var(--font-size-body-lg)', // 1rem
    bodyMd: 'var(--font-size-body-md)', // 0.875rem

    // Specialized sizes
    micro: 'var(--font-size-micro)', // 0.6875rem
    code: 'var(--font-size-code)', // 0.8125rem

    // Legacy Tailwind sizes (for compatibility)
    xs: 'var(--text-xs)', // 0.75rem
    sm: 'var(--text-sm)', // 0.875rem
    base: 'var(--text-base)', // 1rem
    lg: 'var(--text-lg)', // 1.125rem
    xl: 'var(--text-xl)', // 1.25rem
    '2xl': 'var(--text-2xl)', // 1.5rem
    '3xl': 'var(--text-3xl)', // 1.875rem
    '5xl': 'var(--text-5xl)', // 3rem
  },

  // Font Weights
  fontWeight: {
    medium: 'var(--font-weight-medium)', // 500
    semibold: 'var(--font-weight-semibold)', // 600
  },

  // Line Heights
  lineHeight: {
    tight: 'var(--line-height-tight)', // 1.2
    normal: 'var(--line-height-normal)', // 1.5
  },

  // Letter Spacing (Tracking)
  tracking: {
    tight: 'var(--tracking-tight)', // -0.02em
    wide: 'var(--tracking-wide)', // 0.02em
    wider: 'var(--tracking-wider)', // 0.05em
    widest: 'var(--tracking-widest)', // 0.1em
  },
} as const;

/**
 * Raw typography values (for reference)
 */
export const typographyValues = {
  font: {
    sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    mono: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace',
    display: 'ui-sans-serif, system-ui, sans-serif',
    ui: 'ui-sans-serif, system-ui, sans-serif',
  },
  fontSize: {
    displayLg: '3.5rem',
    displayMd: '2.5rem',
    displaySm: '2rem',
    headingLg: '1.5rem',
    headingMd: '1.25rem',
    headingSm: '1rem',
    bodyLg: '1rem',
    bodyMd: '0.875rem',
    micro: '0.6875rem',
    code: '0.8125rem',
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '5xl': '3rem',
  },
  fontWeight: {
    medium: '500',
    semibold: '600',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
  },
  tracking: {
    tight: '-0.02em',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export type TypographyToken = typeof typography;
export type TypographyValue = typeof typographyValues;

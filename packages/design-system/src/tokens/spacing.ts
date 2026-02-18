/**
 * Spacing Design Tokens
 * Extracted from Figma export - Premium Dark-Mode Design System
 * Base unit: 0.25rem (4px)
 */

export const spacing = {
  // Base spacing unit
  base: 'var(--spacing)', // 0.25rem (4px)

  // Named spacing tokens
  md: 'var(--spacing-md)', // 0.75rem (12px)
  xl: 'var(--spacing-xl)', // 1.5rem (24px)
  '2xl': 'var(--spacing-2xl)', // 2rem (32px)
  '3xl': 'var(--spacing-3xl)', // 3rem (48px)

  // Container max widths
  container4xl: 'var(--container-4xl)', // 56rem
  container7xl: 'var(--container-7xl)', // 80rem
} as const;

/**
 * Raw spacing values (for reference)
 */
export const spacingValues = {
  base: '0.25rem', // 4px
  md: '0.75rem', // 12px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  container4xl: '56rem',
  container7xl: '80rem',
} as const;

/**
 * Spacing scale (multiples of base unit)
 * Use these for consistent spacing throughout the design system
 */
export const spacingScale = {
  0: '0',
  1: 'calc(var(--spacing) * 1)', // 4px
  2: 'calc(var(--spacing) * 2)', // 8px
  3: 'calc(var(--spacing) * 3)', // 12px
  4: 'calc(var(--spacing) * 4)', // 16px
  6: 'calc(var(--spacing) * 6)', // 24px
  8: 'calc(var(--spacing) * 8)', // 32px
  12: 'calc(var(--spacing) * 12)', // 48px
  16: 'calc(var(--spacing) * 16)', // 64px
} as const;

export type SpacingToken = typeof spacing;
export type SpacingValue = typeof spacingValues;
export type SpacingScale = typeof spacingScale;

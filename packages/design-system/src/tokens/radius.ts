/**
 * Border Radius Design Tokens
 * Extracted from Figma export - Premium Dark-Mode Design System
 */

export const radius = {
  sm: 'var(--radius-sm)', // 2px
  md: 'var(--radius-md)', // 4px
  lg: 'var(--radius-lg)', // 6px
  full: 'var(--radius-full)', // 9999px
} as const;

/**
 * Raw radius values (for reference)
 */
export const radiusValues = {
  sm: '2px',
  md: '4px',
  lg: '6px',
  full: '9999px',
} as const;

export type RadiusToken = typeof radius;
export type RadiusValue = typeof radiusValues;

/**
 * Shadow Design Tokens
 * Extracted from Figma export - Premium Dark-Mode Design System
 */

export const shadows = {
  raised: 'var(--shadow-raised)',
  overlay: 'var(--shadow-overlay)',
  inset: 'var(--shadow-inset)',
  bevel: 'var(--shadow-bevel)',
} as const;

/**
 * Raw shadow values (for reference)
 */
export const shadowValues = {
  raised: '0 1px 2px #00000080, 0 0 0 1px #ffffff08',
  overlay: '0 10px 25px #0009, 0 0 0 1px #ffffff0d',
  inset: 'inset 0 1px 3px #0009, inset 0 0 0 1px #0000004d',
  bevel: '0 1px 0 #ffffff0d, inset 0 1px 1px #0006',
} as const;

export type ShadowToken = typeof shadows;
export type ShadowValue = typeof shadowValues;

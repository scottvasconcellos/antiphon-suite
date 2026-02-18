/**
 * Color Design Tokens
 * Extracted from Figma export - Premium Dark-Mode Design System
 */

export const colors = {
  // Background Tiers
  bg: {
    page: 'var(--color-bg-page)',
    appShell: 'var(--color-bg-app-shell)',
    surface: 'var(--color-bg-surface)',
    surfaceElevated: 'var(--color-bg-surface-elevated)',
    inset: 'var(--color-bg-inset)',
    scrim: 'var(--color-bg-scrim)',
  },

  // Text Colors
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
    disabled: 'var(--color-text-disabled)',
    inverse: 'var(--color-text-inverse)',
    danger: 'var(--color-text-danger)',
    accent: 'var(--color-text-accent)',
    link: 'var(--color-text-link)',
  },

  // Border Colors
  border: {
    subtle: 'var(--color-border-subtle)',
    strong: 'var(--color-border-strong)',
    focus: 'var(--color-border-focus)',
    error: 'var(--color-border-error)',
  },

  // Overlay Colors
  overlay: {
    hover: 'var(--color-overlay-hover)',
    active: 'var(--color-overlay-active)',
    selected: 'var(--color-overlay-selected)',
    armed: 'var(--color-overlay-armed)',
  },

  // Accent Colors
  accent: {
    primary: 'var(--color-accent-primary)',
    primaryHover: 'var(--color-accent-primary-hover)',
    primaryActive: 'var(--color-accent-primary-active)',
    success: 'var(--color-accent-success)',
    warning: 'var(--color-accent-warning)',
    danger: 'var(--color-accent-danger)',
  },

  // Base Colors
  white: 'var(--color-white)',
} as const;

/**
 * Raw color values (for reference, use CSS variables in components)
 */
export const colorValues = {
  bg: {
    page: '#0a0a0b',
    appShell: '#111113',
    surface: '#18181b',
    surfaceElevated: '#1f1f23',
    inset: '#0d0d0f',
    scrim: '#000000d9',
  },
  text: {
    primary: '#e8e8ea',
    secondary: '#a1a1a8',
    muted: '#6b6b72',
    disabled: '#43434a',
    inverse: '#0a0a0b',
    danger: '#f87171',
    accent: '#60a5fa',
    link: '#60a5fa',
  },
  border: {
    subtle: '#28282d',
    strong: '#38383f',
    focus: '#60a5fa',
    error: '#f87171',
  },
  overlay: {
    hover: '#ffffff0d',
    active: '#ffffff14',
    selected: '#60a5fa1f',
    armed: '#fbbf241f',
  },
  accent: {
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryActive: '#2563eb',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  white: '#fff',
} as const;

export type ColorToken = typeof colors;
export type ColorValue = typeof colorValues;

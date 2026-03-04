import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'default';
  className?: string;
}

export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className = '' 
}: BadgeProps) => {
  const variants = {
    default: 'bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)]',
    success: 'bg-[var(--color-accent-success)]/10 text-[var(--color-accent-success)] border-[var(--color-accent-success)]/20',
    warning: 'bg-[var(--color-accent-warning)]/10 text-[var(--color-accent-warning)] border-[var(--color-accent-warning)]/20',
    danger: 'bg-[var(--color-accent-danger)]/10 text-[var(--color-accent-danger)] border-[var(--color-accent-danger)]/20',
    info: 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/20',
  };

  const sizes = {
    small: 'px-1.5 py-0.5 text-[10px]',
    default: 'px-2 py-1 text-xs',
  };

  return (
    <span className={`
      inline-flex items-center gap-1
      rounded-[var(--radius-sm)]
      border
      font-medium
      uppercase
      tracking-wider
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  );
};

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'raised' | 'inset';
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  className?: string;
}

export const Card = ({ 
  children, 
  variant = 'flat', 
  padding = 'default',
  className = '' 
}: CardProps) => {
  const variants = {
    flat: 'bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]',
    raised: 'bg-[var(--color-bg-surface-elevated)] shadow-[var(--shadow-raised)]',
    inset: 'bg-[var(--color-bg-inset)] shadow-[var(--shadow-inset)] border border-[var(--color-border-subtle)]',
  };

  const paddings = {
    none: '',
    compact: 'p-3',
    default: 'p-4',
    spacious: 'p-6',
  };

  return (
    <div
      className={`
        rounded-[var(--radius-lg)]
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader = ({ title, subtitle, actions, className = '' }: CardHeaderProps) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

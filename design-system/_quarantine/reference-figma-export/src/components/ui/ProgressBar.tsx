import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'default';
  icon?: React.ReactNode;
  className?: string;
}

export const ProgressBar = ({
  value,
  label,
  showPercent = true,
  variant = 'default',
  size = 'default',
  icon,
  className = '',
}: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const barColors = {
    default: 'bg-[var(--color-accent-primary)]',
    success: 'bg-[var(--color-accent-success)]',
    warning: 'bg-[var(--color-accent-warning)]',
    danger: 'bg-[var(--color-accent-danger)]',
  };

  const barHeights = {
    small: 'h-1.5',
    default: 'h-2.5',
  };

  return (
    <div className={`${className}`}>
      {(label || showPercent || icon) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
            {label && (
              <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
            )}
          </div>
          {showPercent && (
            <span className="telemetry text-xs">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${barHeights[size]} bg-[var(--color-bg-inset)] rounded-[var(--radius-full)] overflow-hidden shadow-[var(--shadow-inset)]`}>
        <div
          className={`${barHeights[size]} ${barColors[variant]} rounded-[var(--radius-full)] transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

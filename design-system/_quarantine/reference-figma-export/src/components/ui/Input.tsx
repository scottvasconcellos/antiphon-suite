import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="hardware-label">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 
              bg-[var(--color-bg-inset)] 
              text-[var(--color-text-primary)]
              border border-[var(--color-border-subtle)]
              rounded-[var(--radius-md)]
              shadow-[var(--shadow-inset)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none focus:border-[var(--color-border-focus)]
              focus:shadow-[var(--shadow-inset),0_0_0_1px_var(--color-border-focus)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
              ${prefix ? 'pl-9' : ''}
              ${suffix ? 'pr-9' : ''}
              ${error ? 'border-[var(--color-border-error)]' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-[var(--color-text-muted)] pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-[var(--color-text-danger)]">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-xs text-[var(--color-text-muted)]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

import React, { useState, useRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'illuminated';
  size?: 'compact' | 'default' | 'spacious';
  toggle?: boolean;
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'secondary', 
  size = 'default', 
  className = '', 
  children, 
  disabled,
  toggle = false,
  onClick,
  ...props 
}: ButtonProps) => {
  const [pressed, setPressed] = useState(false);
  const [clicking, setClicking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (toggle) {
      setPressed(!pressed);
    } else {
      setClicking(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setClicking(false), 150);
    }
    onClick?.(e);
  };

  const isPressed = toggle ? pressed : clicking;

  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    border select-none
    transition-[background-color,border-color,color,box-shadow,transform] duration-100 ease-out
  `;

  // Neomorphic: beveled out = raised, beveled in = pressed
  const bevelOut = `shadow-[0_1px_0_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]`;
  const bevelIn = `shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,0,0,0.15)]`;

  const variants: Record<string, string> = {
    primary: `
      bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]
      border-[var(--color-accent-primary)]
      hover:bg-[var(--color-accent-primary-hover)]
      active:bg-[var(--color-accent-primary-active)]
      focus-visible:outline-[var(--color-accent-primary)]
      ${isPressed ? bevelIn : bevelOut}
    `,
    secondary: `
      bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-primary)]
      border-[var(--color-border-strong)]
      hover:brightness-110 hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]
      active:brightness-95
      focus-visible:outline-[var(--color-border-focus)]
      ${isPressed ? bevelIn : bevelOut}
    `,
    ghost: `
      bg-transparent text-[var(--color-text-secondary)]
      border-transparent
      hover:bg-[var(--color-overlay-hover)] hover:text-[var(--color-text-primary)]
      active:bg-[var(--color-overlay-active)]
      focus-visible:outline-[var(--color-border-focus)]
      ${isPressed ? 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]' : ''}
    `,
    danger: `
      bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)]
      border-[var(--color-border-strong)]
      hover:bg-[var(--color-accent-danger)]/15 hover:text-[var(--color-accent-danger)] hover:border-[var(--color-accent-danger)]
      active:bg-[var(--color-accent-danger)]/25
      focus-visible:outline-[var(--color-accent-danger)]
      ${isPressed ? bevelIn : bevelOut}
    `,
    // Rack-panel illuminated red button — like vintage hardware power/arm switches
    illuminated: `
      text-white border-[#8b1a1a]
      focus-visible:outline-[var(--color-accent-danger)]
      ${isPressed
        ? 'bg-[#dc2626] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_16px_rgba(220,38,38,0.6),0_0_4px_rgba(220,38,38,0.8)] border-[#ef4444]'
        : 'bg-[#7f1d1d] shadow-[0_1px_0_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(127,29,29,0.3)] hover:bg-[#991b1b] hover:shadow-[0_0_12px_rgba(220,38,38,0.4)]'
      }
    `,
  };

  const sizes: Record<string, string> = {
    compact: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
    default: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
    spacious: 'px-6 py-3 text-base rounded-[var(--radius-lg)]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

import React, { useState } from 'react';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'default' | 'compact';
}

export const Toggle = ({ 
  checked: controlledChecked, 
  defaultChecked = false, 
  onChange, 
  label,
  disabled = false,
  size = 'default'
}: ToggleProps) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  const dimensions = size === 'compact' 
    ? { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' }
    : { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' };

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <div
        onClick={handleToggle}
        className={`
          relative ${dimensions.track} rounded-full
          transition-all duration-200
          ${checked 
            ? 'bg-[var(--color-accent-primary)]' 
            : 'bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border-strong)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-[var(--shadow-inset)]
        `}
      >
        <div
          className={`
            absolute top-0.5 left-0.5 ${dimensions.thumb}
            bg-white rounded-full
            transition-transform duration-200
            shadow-sm
            ${checked ? dimensions.translate : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span className={`text-sm ${disabled ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]'}`}>
          {label}
        </span>
      )}
    </label>
  );
};

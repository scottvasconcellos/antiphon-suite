import React, { useState } from 'react';
import { IconChevronDown } from '../icons/IconLibrary';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const Select = ({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  label,
  placeholder = 'Select...',
  disabled = false,
}: SelectProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="hardware-label">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-9
            appearance-none
            bg-[var(--color-bg-inset)] 
            text-[var(--color-text-primary)]
            border border-[var(--color-border-subtle)]
            rounded-[var(--radius-md)]
            shadow-[var(--shadow-inset)]
            focus:outline-none focus:border-[var(--color-border-focus)]
            focus:shadow-[var(--shadow-inset),0_0_0_1px_var(--color-border-focus)]
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            transition-all
          `}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <IconChevronDown size={16} />
        </div>
      </div>
    </div>
  );
};

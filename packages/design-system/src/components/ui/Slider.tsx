import React, { useState } from 'react';

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
  unit?: string;
  disabled?: boolean;
}

export const Slider = ({
  value: controlledValue,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValue = false,
  unit = '',
  disabled = false,
}: SliderProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = parseFloat(e.target.value);
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="hardware-label">{label}</span>}
          {showValue && (
            <span className="telemetry text-xs">
              {value.toFixed(step < 1 ? 2 : 0)}{unit}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <style>{`
          .slider-input {
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-inset);
          }
          
          .slider-input::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: var(--radius-sm);
            background: var(--color-text-primary);
            cursor: pointer;
            border: 1px solid var(--color-border-strong);
            box-shadow: var(--shadow-bevel);
            transition: all var(--transition-fast);
          }
          
          .slider-input::-webkit-slider-thumb:hover {
            background: white;
            box-shadow: 0 0 0 2px var(--color-accent-primary);
          }
          
          .slider-input::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: var(--radius-sm);
            background: var(--color-text-primary);
            cursor: pointer;
            border: 1px solid var(--color-border-strong);
            box-shadow: var(--shadow-bevel);
            transition: all var(--transition-fast);
          }
          
          .slider-input::-moz-range-thumb:hover {
            background: white;
            box-shadow: 0 0 0 2px var(--color-accent-primary);
          }
          
          .slider-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="slider-input w-full h-1 appearance-none bg-transparent cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              var(--color-accent-primary) 0%, 
              var(--color-accent-primary) ${percentage}%, 
              var(--color-bg-surface-elevated) ${percentage}%, 
              var(--color-bg-surface-elevated) 100%)`
          }}
        />
      </div>
    </div>
  );
};
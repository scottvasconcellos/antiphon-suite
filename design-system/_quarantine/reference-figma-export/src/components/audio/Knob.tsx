import React, { useState, useRef, useEffect } from 'react';

export interface KnobProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  label?: string;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const Knob = ({
  value: controlledValue,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  unit = '',
  size = 'medium',
  disabled = false,
}: KnobProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const sizes = {
    small: { diameter: 40, strokeWidth: 4, fontSize: 'text-xs' },
    medium: { diameter: 60, strokeWidth: 5, fontSize: 'text-sm' },
    large: { diameter: 80, strokeWidth: 6, fontSize: 'text-base' },
  };

  const config = sizes[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const fraction = (value - min) / (max - min);
  const angle = -135 + fraction * 270;

  // Arc lengths for track and value
  const trackArc = (270 / 360) * circumference;
  const valueArc = fraction * trackArc;

  // Indicator line geometry: extends from outer edge to near center cap
  const indicatorOuterR = config.diameter / 2; // full radius to edge
  const indicatorInnerR = config.diameter * 0.22; // stop before center cap
  const indicatorLength = indicatorOuterR - indicatorInnerR;
  const indicatorWidth = Math.max(2.5, config.strokeWidth - 0.5);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  const handleDoubleClick = () => {
    if (disabled) return;
    if (!isControlled) setInternalValue(defaultValue);
    onChange?.(defaultValue);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const valueRange = max - min;
      const sensitivity = valueRange / 200;
      const newValue = Math.min(max, Math.max(min, startValueRef.current + deltaY * sensitivity));
      const steppedValue = Math.round(newValue / step) * step;

      if (!isControlled) setInternalValue(steppedValue);
      onChange?.(steppedValue);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, max, min, step, isControlled, onChange]);

  const cx = config.diameter / 2;
  const cy = config.diameter / 2;

  // Compute indicator line endpoint coords using angle
  // Angle is in degrees, -135 = 7:30, +135 = 4:30
  const angleRad = (angle - 90) * (Math.PI / 180); // -90 because CSS 0deg is up
  const outerX = cx + Math.cos(angleRad) * (indicatorOuterR - 1);
  const outerY = cy + Math.sin(angleRad) * (indicatorOuterR - 1);
  const innerX = cx + Math.cos(angleRad) * indicatorInnerR;
  const innerY = cy + Math.sin(angleRad) * indicatorInnerR;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="hardware-label">{label}</span>}

      <div
        className={`relative cursor-ns-resize select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ width: config.diameter, height: config.diameter }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <svg width={config.diameter} height={config.diameter}>
          {/* Knob body background */}
          <circle cx={cx} cy={cy} r={radius} fill="var(--color-bg-inset)" stroke="none" />

          {/* Track arc (full 270° range) - rotated to start at 7:30 */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${trackArc} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="square"
            style={{ transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Value arc - rotated to start at 7:30 */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${valueArc} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="square"
            style={{
              transform: 'rotate(135deg)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: isDragging ? 'none' : 'stroke-dasharray 0.1s ease',
            }}
          />

          {/* Indicator line - drawn ON TOP of the arc, extends to outer edge */}
          <line
            x1={innerX} y1={innerY}
            x2={outerX} y2={outerY}
            stroke="var(--color-text-primary)"
            strokeWidth={indicatorWidth}
            strokeLinecap="square"
          />

          {/* Center cap */}
          <circle
            cx={cx} cy={cy}
            r={config.diameter * 0.14}
            fill="var(--color-bg-surface-elevated)"
            stroke="var(--color-border-strong)"
            strokeWidth={1}
          />
        </svg>
      </div>

      <span className={`telemetry ${config.fontSize}`}>
        {value.toFixed(step < 1 ? 1 : 0)}{unit}
      </span>
    </div>
  );
};

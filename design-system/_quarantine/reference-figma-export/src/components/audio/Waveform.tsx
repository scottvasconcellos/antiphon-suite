import React, { useEffect, useRef, useState } from 'react';
import { IconExpand, IconCollapse } from '../icons/IconLibrary';

// Helper function to resolve CSS variables to actual colors
const resolveColor = (color: string): string => {
  if (color.startsWith('var(')) {
    const match = color.match(/var\(([^)]+)\)/);
    if (match) {
      const varName = match[1];
      if (typeof window !== 'undefined') {
        const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return computed || '#60a5fa';
      }
    }
    return '#60a5fa';
  }
  return color;
};

export interface WaveformProps {
  data?: number[];
  color?: string;
  height?: number;
  className?: string;
}

export const Waveform = ({ 
  data,
  color = '#60a5fa',
  height = 80,
  className = '' 
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);

  const waveformData = data || Array.from({ length: 200 }, (_, i) => {
    const x = i / 10;
    return Math.sin(x) * 0.5 + Math.sin(x * 2.5) * 0.3 + Math.sin(x * 4) * 0.2;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const centerY = rect.height / 2;
    const step = rect.width / waveformData.length;

    ctx.strokeStyle = resolveColor(color);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    waveformData.forEach((value, i) => {
      const x = i * step;
      const y = centerY + (value * centerY * 0.9);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(rect.width, centerY);
    ctx.stroke();
  }, [waveformData, color, expanded]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
        <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
          <span className="hardware-label">WAVEFORM</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
          </button>
        </div>
        <div className={`p-2 bg-[var(--color-bg-inset)] ${expanded ? 'flex-1' : ''}`}>
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: expanded ? '100%' : `${height}px`, display: 'block' }}
          />
        </div>
      </div>
    </>
  );
};

export const SpectrumAnalyzer = ({ className = '' }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    const bars = 64;
    const barWidth = rect.width / bars;

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 0; i < bars; i++) {
        const frequency = i / bars;
        const midBoost = 1 - Math.abs(frequency - 0.5) * 2;
        const h = (Math.random() * 0.3 + midBoost * 0.7) * rect.height;
        
        const x = i * barWidth;
        const gradient = ctx.createLinearGradient(0, rect.height, 0, rect.height - h);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, rect.height - h, barWidth - 1, h);
      }
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [expanded]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
        <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
          <span className="hardware-label">SPECTRUM ANALYZER</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
          </button>
        </div>
        <div className={`p-2 bg-[var(--color-bg-inset)] ${expanded ? 'flex-1' : ''}`}>
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: expanded ? '100%' : '80px', display: 'block' }}
          />
        </div>
      </div>
    </>
  );
};

import React, { useState } from 'react';
import { IconExpand, IconCollapse } from '../icons/IconLibrary';

export interface GrooveGridProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const GrooveGrid = ({ rows = 8, cols = 16, className = '' }: GrooveGridProps) => {
  const [activeSteps, setActiveSteps] = useState<Set<string>>(new Set());
  const [armedRows, setArmedRows] = useState<Set<number>>(new Set([0, 2, 4, 6]));
  const [playingStep, setPlayingStep] = useState<number>(0);
  const [expanded, setExpanded] = useState(false);

  const instruments = [
    'KICK',
    'SNARE',
    'CLAP',
    'CLOSED HAT',
    'OPEN HAT',
    'RIDE',
    'TOM 1',
    'TOM 2',
  ];

  const toggleStep = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setActiveSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleArm = (row: number) => {
    setArmedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(row)) {
        newSet.delete(row);
      } else {
        newSet.add(row);
      }
      return newSet;
    });
  };

  // Simulate playback
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlayingStep(prev => (prev + 1) % cols);
    }, 200);
    return () => clearInterval(interval);
  }, [cols]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
      {/* Header */}
      <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
        <span className="hardware-label">GROOVE SEQUENCER</span>
        <div className="flex items-center gap-3">
          <span className="telemetry text-xs">16 STEPS</span>
          <span className="telemetry text-xs">1/16</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={`p-4 ${expanded ? 'flex-1 overflow-auto' : ''}`}>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-2">
              {/* Instrument label & arm button */}
              <button
                onClick={() => toggleArm(rowIdx)}
                className={`
                  w-24 px-2 py-1.5 text-left text-xs font-mono
                  border rounded-[var(--radius-sm)]
                  transition-all shadow-[var(--shadow-bevel)]
                  ${armedRows.has(rowIdx)
                    ? 'bg-[var(--color-overlay-armed)] border-[var(--color-accent-warning)] text-[var(--color-accent-warning)]'
                    : 'bg-[var(--color-bg-inset)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:bg-[var(--color-overlay-hover)]'
                  }
                `}
              >
                {instruments[rowIdx]}
              </button>

              {/* Steps */}
              <div className="flex gap-1">
                {Array.from({ length: cols }).map((_, colIdx) => {
                  const key = `${rowIdx}-${colIdx}`;
                  const isActive = activeSteps.has(key);
                  const isPlaying = colIdx === playingStep;
                  const isBeatStart = colIdx % 4 === 0;

                  return (
                    <button
                      key={colIdx}
                      onClick={() => toggleStep(rowIdx, colIdx)}
                      className={`
                        w-7 h-7 rounded-[var(--radius-sm)]
                        border transition-all
                        ${isActive
                          ? isPlaying
                            ? 'bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                            : 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary-hover)] shadow-[var(--shadow-bevel)]'
                          : isPlaying
                            ? 'bg-[var(--color-overlay-selected)] border-[var(--color-accent-primary)]'
                            : isBeatStart
                              ? 'bg-[var(--color-bg-surface-elevated)] border-[var(--color-border-strong)] hover:bg-[var(--color-overlay-hover)]'
                              : 'bg-[var(--color-bg-inset)] border-[var(--color-border-subtle)] hover:bg-[var(--color-overlay-hover)]'
                        }
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};
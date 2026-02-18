import React, { useState } from 'react';
import { IconExpand, IconCollapse } from '../../icons/IconLibrary';

interface FretDot {
  string: number;
  fret: number;
}

export interface FretboardProps {
  type?: 'guitar' | 'bass';
  frets?: number;
  className?: string;
  onNoteSelect?: (string: number, fret: number, noteName: string) => void;
}

const GUITAR_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; // high to low
const BASS_TUNING = ['G', 'D', 'A', 'E']; // high to low
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const GUITAR_MIDI = [64, 59, 55, 50, 45, 40];
const BASS_MIDI = [55, 50, 45, 40];

// Fret marker positions (fret wire numbers where dots appear)
const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOTS = [12, 24];

const getNoteName = (openMidi: number, fret: number): string => {
  const midi = openMidi + fret;
  return NOTE_NAMES[midi % 12];
};

export const Fretboard = ({
  type = 'guitar',
  frets = 15,
  className = '',
  onNoteSelect,
}: FretboardProps) => {
  const [activeDots, setActiveDots] = useState<FretDot[]>([]);
  const [expanded, setExpanded] = useState(false);

  const tuning = type === 'guitar' ? GUITAR_TUNING : BASS_TUNING;
  const midiNotes = type === 'guitar' ? GUITAR_MIDI : BASS_MIDI;
  const stringCount = tuning.length;

  const toggleDot = (stringIdx: number, fret: number) => {
    const existing = activeDots.find(d => d.string === stringIdx && d.fret === fret);
    if (existing) {
      setActiveDots(activeDots.filter(d => !(d.string === stringIdx && d.fret === fret)));
    } else {
      setActiveDots([...activeDots, { string: stringIdx, fret }]);
    }
    const noteName = getNoteName(midiNotes[stringIdx], fret);
    onNoteSelect?.(stringIdx, fret, noteName);
  };

  const clearAll = () => setActiveDots([]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  const stringHeight = type === 'guitar' ? 28 : 34;
  const fretWidth = 60;
  const nutWidth = 6; // thick nut bar
  const openWidth = 30; // space for open string dots (fret 0)
  const labelWidth = 40; // tuning label column

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-4">
            <span className="hardware-label">{type === 'guitar' ? 'GUITAR FRETBOARD' : 'BASS FRETBOARD'}</span>
            <span className="telemetry text-xs">{frets} FRETS</span>
          </div>
          <div className="flex items-center gap-2">
            {activeDots.length > 0 && (
              <div className="flex items-center gap-1 mr-2">
                {activeDots.map((dot, i) => (
                  <span key={i} className="text-xs font-mono text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                    {getNoteName(midiNotes[dot.string], dot.fret)}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={clearAll}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-overlay-hover)] transition-all"
            >
              Clear All
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
            </button>
          </div>
        </div>

        {/* Fretboard */}
        <div className={`overflow-x-auto p-4 ${expanded ? 'flex-1' : ''}`}>
          <div className="relative" style={{ minWidth: labelWidth + openWidth + nutWidth + frets * fretWidth }}>
            {/* Fret numbers row */}
            <div className="flex mb-1">
              <div style={{ width: labelWidth }} />
              <div style={{ width: openWidth }} className="text-center text-[9px] font-mono text-[var(--color-text-muted)]">0</div>
              <div style={{ width: nutWidth }} />
              {Array.from({ length: frets }).map((_, i) => (
                <div
                  key={i}
                  className="text-center text-[9px] font-mono text-[var(--color-text-muted)]"
                  style={{ width: fretWidth }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Fretboard body */}
            <div className="relative bg-[var(--color-bg-inset)] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] overflow-hidden">
              {/* Fret marker dots (on the fretboard background) */}
              <div className="absolute pointer-events-none" style={{ left: labelWidth + openWidth + nutWidth, top: 0, bottom: 0 }}>
                {Array.from({ length: frets }).map((_, i) => {
                  const fretNum = i + 1;
                  const isSingle = SINGLE_DOTS.includes(fretNum);
                  const isDouble = DOUBLE_DOTS.includes(fretNum);
                  if (!isSingle && !isDouble) return null;
                  const totalHeight = stringCount * stringHeight;
                  // Center the dot in the fret space
                  const centerX = i * fretWidth + fretWidth / 2;
                  return (
                    <React.Fragment key={i}>
                      {isSingle && (
                        <div
                          className="absolute w-2 h-2 rounded-full bg-[var(--color-border-strong)]"
                          style={{
                            left: centerX - 4,
                            top: totalHeight / 2 - 4,
                          }}
                        />
                      )}
                      {isDouble && (
                        <>
                          <div
                            className="absolute w-2 h-2 rounded-full bg-[var(--color-border-strong)]"
                            style={{
                              left: centerX - 4,
                              top: totalHeight * 0.25 - 4,
                            }}
                          />
                          <div
                            className="absolute w-2 h-2 rounded-full bg-[var(--color-border-strong)]"
                            style={{
                              left: centerX - 4,
                              top: totalHeight * 0.75 - 4,
                            }}
                          />
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {tuning.map((openNote, stringIdx) => (
                <div key={stringIdx} className="relative flex" style={{ height: stringHeight }}>
                  {/* Single string line: one continuous line at exact row center, aligned to grid */}
                  <div
                    className="absolute bg-[var(--color-text-muted)] pointer-events-none"
                    style={{
                      left: labelWidth,
                      width: openWidth + nutWidth + frets * fretWidth,
                      top: Math.floor(stringHeight / 2),
                      height: Math.max(1, 1 + stringIdx * 0.3),
                      opacity: 0.6,
                    }}
                  />

                  {/* Tuning label */}
                  <div
                    className="flex items-center justify-center text-[10px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] shrink-0 z-10"
                    style={{ width: labelWidth }}
                  >
                    {openNote}
                  </div>

                  {/* Open string area (fret 0) */}
                  <div
                    className="relative flex items-center justify-center cursor-pointer hover:bg-[var(--color-overlay-hover)] transition-colors z-10"
                    style={{ width: openWidth }}
                    onClick={() => toggleDot(stringIdx, 0)}
                  >
                    {activeDots.some(d => d.string === stringIdx && d.fret === 0) && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent-primary)] border border-[var(--color-accent-primary-hover)] flex items-center justify-center shadow-[0_0_6px_rgba(96,165,250,0.4)]">
                        <span className="text-[7px] font-mono text-[var(--color-text-inverse)]">{getNoteName(midiNotes[stringIdx], 0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Nut (thick bar) */}
                  <div
                    className="bg-[var(--color-text-muted)] shrink-0 z-10"
                    style={{ width: nutWidth }}
                  />

                  {/* Fret spaces (fret 1 through frets) */}
                  {Array.from({ length: frets }).map((_, i) => {
                    const fretNum = i + 1;
                    const isActive = activeDots.some(d => d.string === stringIdx && d.fret === fretNum);
                    const noteName = getNoteName(midiNotes[stringIdx], fretNum);

                    return (
                      <div
                        key={i}
                        className={`relative flex items-center justify-end cursor-pointer transition-colors z-10
                          border-r border-r-[var(--color-border-strong)]
                          ${stringIdx < stringCount - 1 ? 'border-b border-b-[var(--color-border-subtle)]/30' : ''}
                          hover:bg-[var(--color-overlay-hover)]
                        `}
                        style={{ width: fretWidth }}
                        onClick={() => toggleDot(stringIdx, fretNum)}
                      >
                        {/* Active dot: positioned close to the RIGHT side (near the fret wire) */}
                        {isActive && (
                          <div
                            className="w-5 h-5 rounded-full bg-[var(--color-accent-primary)] border border-[var(--color-accent-primary-hover)] flex items-center justify-center shadow-[0_0_6px_rgba(96,165,250,0.4)] mr-1"
                          >
                            <span className="text-[7px] font-mono text-[var(--color-text-inverse)]">{noteName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

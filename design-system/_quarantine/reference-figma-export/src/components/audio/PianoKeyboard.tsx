import React, { useState, useRef, useCallback } from 'react';
import { IconExpand, IconCollapse } from '../icons/IconLibrary';

export interface PianoKeyboardProps {
  octaves?: number;
  startOctave?: number;
  onNotePress?: (note: string, octave: number, midiNote: number) => void;
  onNoteRelease?: (note: string, octave: number, midiNote: number) => void;
  className?: string;
  showNoteNames?: boolean;
}

type InteractionMode = 'scroll' | 'glide';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEY_W = 28; // fixed pixel width per white key
const BLACK_KEY_H_RATIO = 0.6; // 60% height of white keys

// Full 88-key piano: A0 (MIDI 21) to C8 (MIDI 108)
const FIRST_MIDI = 21; // A0
const LAST_MIDI = 108; // C8
const TOTAL_SEMITONES = LAST_MIDI - FIRST_MIDI + 1; // 88

const getMidiNote = (note: string, octave: number): number => {
  const noteIndex = NOTE_NAMES.indexOf(note);
  return (octave + 1) * 12 + noteIndex;
};

const midiToNote = (midi: number) => NOTE_NAMES[midi % 12];
const midiToOctave = (midi: number) => Math.floor(midi / 12) - 1;
const isBlackMidi = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

// Build the list of all white key MIDI notes in order
const allWhiteKeys: number[] = [];
for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
  if (!isBlackMidi(m)) allWhiteKeys.push(m);
}
const TOTAL_WHITE = allWhiteKeys.length; // 52
const FULL_WIDTH = TOTAL_WHITE * WHITE_KEY_W;

// Get the x position of a white key by its index in allWhiteKeys
const whiteKeyX = (whiteIndex: number) => whiteIndex * WHITE_KEY_W;

// For a given MIDI note, get its x position and width
const getKeyLayout = (midi: number) => {
  if (!isBlackMidi(midi)) {
    const idx = allWhiteKeys.indexOf(midi);
    return { x: whiteKeyX(idx), w: WHITE_KEY_W, isBlack: false };
  }
  // Black key: position between adjacent white keys
  const leftWhite = midi - 1;
  // Find the white key to the left
  let leftIdx = allWhiteKeys.indexOf(leftWhite);
  if (leftIdx < 0) {
    // Edge case for Bb: left neighbor might be 2 semitones away
    leftIdx = allWhiteKeys.indexOf(midi - 1);
  }
  const blackW = Math.round(WHITE_KEY_W * 0.58);
  const x = whiteKeyX(leftIdx) + WHITE_KEY_W - blackW / 2;
  return { x, w: blackW, isBlack: true };
};

// Get white key index range for a MIDI range
const midiToWhiteRange = (startMidi: number, endMidi: number) => {
  let firstWhite = -1, lastWhite = -1;
  for (let i = 0; i < allWhiteKeys.length; i++) {
    if (allWhiteKeys[i] >= startMidi && firstWhite < 0) firstWhite = i;
    if (allWhiteKeys[i] <= endMidi) lastWhite = i;
  }
  return { firstWhite, lastWhite };
};

export const PianoKeyboard = ({
  octaves: initialOctaves = 3,
  startOctave: initialStartOctave = 3,
  onNotePress,
  onNoteRelease,
  className = '',
  showNoteNames = true,
}: PianoKeyboardProps) => {
  // View range in MIDI notes
  const initStart = getMidiNote('C', initialStartOctave);
  const initEnd = getMidiNote('B', initialStartOctave + initialOctaves - 1);

  const [viewStart, setViewStart] = useState(Math.max(FIRST_MIDI, initStart));
  const [viewEnd, setViewEnd] = useState(Math.min(LAST_MIDI, initEnd));
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<InteractionMode>('glide');
  const [expanded, setExpanded] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [draggingSide, setDraggingSide] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDragRef = useRef({ x: 0, origStart: 0, origEnd: 0 });

  // Compute visible width
  const { firstWhite, lastWhite } = midiToWhiteRange(viewStart, viewEnd);
  const visibleWhiteCount = lastWhite - firstWhite + 1;
  const visibleWidth = visibleWhiteCount * WHITE_KEY_W;

  const handleKeyDown = useCallback((midi: number) => {
    setActiveKeys(prev => new Set(prev).add(midi));
    const note = midiToNote(midi);
    const octave = midiToOctave(midi);
    onNotePress?.(note, octave, midi);
  }, [onNotePress]);

  const handleKeyUp = useCallback((midi: number) => {
    setActiveKeys(prev => {
      const s = new Set(prev);
      s.delete(midi);
      return s;
    });
    const note = midiToNote(midi);
    const octave = midiToOctave(midi);
    onNoteRelease?.(note, octave, midi);
  }, [onNoteRelease]);

  const handleMouseEnterKey = (midi: number) => {
    if (isMouseDown && mode === 'glide') handleKeyDown(midi);
  };
  const handleMouseLeaveKey = (midi: number) => {
    if (activeKeys.has(midi)) handleKeyUp(midi);
  };

  // Scroll mode
  const handleScrollStart = (e: React.MouseEvent) => {
    if (mode !== 'scroll') return;
    scrollDragRef.current = { x: e.clientX, origStart: viewStart, origEnd: viewEnd };
    setIsMouseDown(true);
  };

  const handleScrollMove = (e: React.MouseEvent) => {
    if (mode !== 'scroll' || !isMouseDown) return;
    const dx = e.clientX - scrollDragRef.current.x;
    // Convert px to semitones (approximate: white key = 1 white = ~1.7 semitones avg)
    const whitesDelta = Math.round(-dx / WHITE_KEY_W);
    const semiDelta = Math.round(whitesDelta * (12 / 7)); // approximate
    const range = scrollDragRef.current.origEnd - scrollDragRef.current.origStart;
    let newStart = scrollDragRef.current.origStart + semiDelta;
    let newEnd = newStart + range;
    if (newStart < FIRST_MIDI) { newStart = FIRST_MIDI; newEnd = newStart + range; }
    if (newEnd > LAST_MIDI) { newEnd = LAST_MIDI; newStart = newEnd - range; }
    setViewStart(newStart);
    setViewEnd(newEnd);
  };

  const handleScrollEnd = () => {
    if (mode !== 'scroll' || !isMouseDown) return;
    setIsMouseDown(false);
    // Snap to nearest C with smooth animation
    snapToNearestNote();
  };

  const snapToNearestNote = () => {
    // Find the nearest C to current viewStart
    const noteInOctave = viewStart % 12;
    let snapStart = viewStart - noteInOctave; // snap down to C
    if (noteInOctave > 6) snapStart += 12; // snap up to next C if closer
    if (snapStart < FIRST_MIDI) snapStart = FIRST_MIDI;
    const range = viewEnd - viewStart;
    let snapEnd = snapStart + range;
    if (snapEnd > LAST_MIDI) { snapEnd = LAST_MIDI; snapStart = snapEnd - range; }

    if (snapStart !== viewStart) {
      setIsAnimating(true);
      setViewStart(snapStart);
      setViewEnd(snapEnd);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle drag for range adjustment
  const handleDragStart = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingSide(side);
    const origStart = viewStart;
    const origEnd = viewEnd;
    const startX = e.clientX;

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const semiDelta = Math.round((dx / WHITE_KEY_W) * (12 / 7));

      if (side === 'left') {
        if (ev.altKey) {
          // Mirror mode
          let ns = origStart + semiDelta;
          let ne = origEnd - semiDelta;
          if (ns < FIRST_MIDI) ns = FIRST_MIDI;
          if (ne > LAST_MIDI) ne = LAST_MIDI;
          if (ne - ns >= 12) { setViewStart(ns); setViewEnd(ne); }
        } else {
          let ns = origStart + semiDelta;
          if (ns < FIRST_MIDI) ns = FIRST_MIDI;
          if (origEnd - ns >= 12) setViewStart(ns);
        }
      } else {
        if (ev.altKey) {
          let ns = origStart - semiDelta;
          let ne = origEnd + semiDelta;
          if (ns < FIRST_MIDI) ns = FIRST_MIDI;
          if (ne > LAST_MIDI) ne = LAST_MIDI;
          if (ne - ns >= 12) { setViewStart(ns); setViewEnd(ne); }
        } else {
          let ne = origEnd + semiDelta;
          if (ne > LAST_MIDI) ne = LAST_MIDI;
          if (ne - origStart >= 12) setViewEnd(ne);
        }
      }
    };

    const handleUp = () => {
      setDraggingSide(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      // After release, center with animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Build visible keys
  const visibleKeys: { midi: number; x: number; w: number; isBlack: boolean }[] = [];
  // First, compute offset: the x of the first visible white key
  const offsetX = firstWhite * WHITE_KEY_W;

  for (let m = viewStart; m <= viewEnd; m++) {
    const layout = getKeyLayout(m);
    visibleKeys.push({
      midi: m,
      x: layout.x - offsetX,
      w: layout.w,
      isBlack: layout.isBlack,
    });
  }

  const whiteKeys = visibleKeys.filter(k => !k.isBlack);
  const blackKeys = visibleKeys.filter(k => k.isBlack);

  // Container width for centering
  const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 800;
  const padding = Math.max(0, (containerWidth - visibleWidth - 30) / 2); // 30 = handle widths

  // Minimap dimensions
  const minimapH = 20;
  const minimapKeyW = containerWidth > 100 ? (containerWidth - 30) / TOTAL_WHITE : 2;
  const minimapBlackW = minimapKeyW * 0.58;
  const minimapViewStartX = firstWhite * minimapKeyW;
  const minimapViewW = visibleWhiteCount * minimapKeyW;

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] ${className}`;

  const keyboardHeight = expanded ? 'calc(100% - 80px)' : '140px';

  const startNote = midiToNote(viewStart);
  const startOctave = midiToOctave(viewStart);
  const endNote = midiToNote(viewEnd);
  const endOctave = midiToOctave(viewEnd);

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div ref={containerRef} className={containerClass}>
        <div className="flex items-center justify-between p-4 pb-2 shrink-0">
          <div className="flex items-center gap-4">
            <span className="hardware-label">PIANO KEYBOARD</span>
            <div className="flex items-center gap-1 bg-[var(--color-bg-inset)] rounded-[var(--radius-sm)] p-0.5">
              <button
                onClick={() => setMode('glide')}
                className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs transition-all ${mode === 'glide' ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                Glide
              </button>
              <button
                onClick={() => setMode('scroll')}
                className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs transition-all ${mode === 'scroll' ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                Scroll
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="telemetry text-xs">{startNote}{startOctave} – {endNote}{endOctave}</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
            </button>
          </div>
        </div>

        {/* Main keyboard area */}
        <div className="relative flex items-stretch px-1 pb-2 flex-1 min-h-0">
          {/* Left handle */}
          <div
            className={`w-3 flex items-center justify-center cursor-ew-resize rounded-[var(--radius-sm)] shrink-0 transition-colors z-10
              ${draggingSide === 'left' ? 'bg-[var(--color-accent-primary)]/30' : 'bg-[var(--color-bg-inset)] hover:bg-[var(--color-overlay-hover)]'}`}
            onMouseDown={(e) => handleDragStart('left', e)}
            title="Drag to adjust range (Alt: mirror)"
          >
            <div className="w-0.5 h-6 bg-[var(--color-border-strong)] rounded-full" />
          </div>

          {/* Keyboard viewport */}
          <div
            className={`flex-1 overflow-hidden relative ${mode === 'scroll' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ height: keyboardHeight, minHeight: 100 }}
            onMouseDown={(e) => {
              setIsMouseDown(true);
              if (mode === 'scroll') handleScrollStart(e);
            }}
            onMouseUp={() => {
              if (mode === 'scroll') handleScrollEnd();
              else setIsMouseDown(false);
            }}
            onMouseLeave={() => {
              if (mode !== 'scroll') setIsMouseDown(false);
            }}
            onMouseMove={(e) => {
              if (mode === 'scroll') handleScrollMove(e);
            }}
          >
            {/* Centered piano keys container */}
            <div
              className="relative h-full"
              style={{
                width: visibleWidth,
                marginLeft: isAnimating ? padding : padding,
                transition: isAnimating ? 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none',
              }}
            >
              {/* White keys */}
              {whiteKeys.map(k => {
                const isActive = activeKeys.has(k.midi);
                const note = midiToNote(k.midi);
                const oct = midiToOctave(k.midi);
                return (
                  <div
                    key={k.midi}
                    className={`absolute top-0 bottom-0 cursor-pointer select-none
                      border-r border-[var(--color-border-strong)]
                      rounded-b-[var(--radius-sm)]
                      transition-colors duration-75
                      ${isActive
                        ? 'bg-[var(--color-accent-primary)] shadow-[var(--shadow-inset)]'
                        : 'bg-[var(--color-bg-surface-elevated)] hover:brightness-110 shadow-[0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]'
                      }
                    `}
                    style={{ left: k.x, width: k.w }}
                    onMouseDown={() => { if (mode === 'glide') handleKeyDown(k.midi); }}
                    onMouseUp={() => handleKeyUp(k.midi)}
                    onMouseEnter={() => handleMouseEnterKey(k.midi)}
                    onMouseLeave={() => handleMouseLeaveKey(k.midi)}
                  >
                    {showNoteNames && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                        {note}<sub className="text-[7px]">{oct}</sub>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Black keys */}
              {blackKeys.map(k => {
                const isActive = activeKeys.has(k.midi);
                const note = midiToNote(k.midi);
                return (
                  <div
                    key={k.midi}
                    className={`absolute top-0 cursor-pointer select-none z-10
                      border border-[var(--color-border-strong)]
                      rounded-b-[var(--radius-sm)]
                      transition-colors duration-75
                      ${isActive
                        ? 'bg-[var(--color-accent-primary)] shadow-[var(--shadow-inset)]'
                        : 'bg-[var(--color-bg-page)] hover:bg-[var(--color-bg-app-shell)] shadow-[0_1px_0_rgba(255,255,255,0.03),0_2px_4px_rgba(0,0,0,0.5)]'
                      }
                    `}
                    style={{ left: k.x, width: k.w, height: `${BLACK_KEY_H_RATIO * 100}%` }}
                    onMouseDown={() => { if (mode === 'glide') handleKeyDown(k.midi); }}
                    onMouseUp={() => handleKeyUp(k.midi)}
                    onMouseEnter={() => handleMouseEnterKey(k.midi)}
                    onMouseLeave={() => handleMouseLeaveKey(k.midi)}
                  >
                    {showNoteNames && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-[var(--color-text-secondary)]">
                        {note.replace('#', '♯')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right handle */}
          <div
            className={`w-3 flex items-center justify-center cursor-ew-resize rounded-[var(--radius-sm)] shrink-0 transition-colors z-10
              ${draggingSide === 'right' ? 'bg-[var(--color-accent-primary)]/30' : 'bg-[var(--color-bg-inset)] hover:bg-[var(--color-overlay-hover)]'}`}
            onMouseDown={(e) => handleDragStart('right', e)}
            title="Drag to adjust range (Alt: mirror)"
          >
            <div className="w-0.5 h-6 bg-[var(--color-border-strong)] rounded-full" />
          </div>
        </div>

        {/* Minimap — shows full 88-key piano with viewport highlighted */}
        <div className="mx-4 mb-3 relative rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-bg-inset)] border border-[var(--color-border-subtle)]" style={{ height: minimapH }}>
          {/* All white keys */}
          {allWhiteKeys.map((midi, i) => (
            <div
              key={midi}
              className="absolute top-0 bottom-0 border-r border-[var(--color-border-subtle)]/30"
              style={{
                left: i * minimapKeyW,
                width: minimapKeyW,
                backgroundColor: (midi >= viewStart && midi <= viewEnd) ? 'var(--color-bg-surface-elevated)' : 'var(--color-bg-inset)',
              }}
            />
          ))}
          {/* All black keys */}
          {Array.from({ length: TOTAL_SEMITONES }).map((_, i) => {
            const midi = FIRST_MIDI + i;
            if (!isBlackMidi(midi)) return null;
            const layout = getKeyLayout(midi);
            const mmX = (layout.x / FULL_WIDTH) * (TOTAL_WHITE * minimapKeyW);
            const mmW = minimapBlackW;
            return (
              <div
                key={midi}
                className="absolute top-0"
                style={{
                  left: mmX,
                  width: mmW,
                  height: minimapH * 0.6,
                  backgroundColor: (midi >= viewStart && midi <= viewEnd) ? '#1a1a1e' : '#0a0a0c',
                }}
              />
            );
          })}
          {/* Viewport indicator */}
          <div
            className="absolute top-0 bottom-0 border-2 border-[var(--color-accent-primary)] rounded-[1px] pointer-events-none"
            style={{
              left: minimapViewStartX,
              width: minimapViewW,
              transition: isAnimating ? 'left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none',
              boxShadow: '0 0 6px rgba(96,165,250,0.3)',
            }}
          />
          {/* Dimmed overlay outside viewport */}
          <div className="absolute top-0 bottom-0 left-0 bg-[rgba(0,0,0,0.4)] pointer-events-none"
            style={{ width: minimapViewStartX, transition: isAnimating ? 'width 0.35s ease' : 'none' }} />
          <div className="absolute top-0 bottom-0 right-0 bg-[rgba(0,0,0,0.4)] pointer-events-none"
            style={{ width: Math.max(0, TOTAL_WHITE * minimapKeyW - minimapViewStartX - minimapViewW), transition: isAnimating ? 'width 0.35s ease' : 'none' }} />
        </div>
      </div>
    </>
  );
};
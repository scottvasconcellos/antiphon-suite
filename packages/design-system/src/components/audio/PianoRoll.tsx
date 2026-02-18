import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IconDraw, IconEraser, IconExpand, IconCollapse } from '../../icons/IconLibrary';

interface Note {
  id: string;
  pitch: number;
  start: number; // in grid steps
  duration: number; // in grid steps
  velocity: number;
}

type QuantizeValue = 1 | 2 | 4 | 8 | 16;
type Tool = 'draw' | 'erase';

export interface PianoRollProps {
  notes?: Note[];
  onNoteChange?: (notes: Note[]) => void;
  bars?: number;
  className?: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

const ROW_HEIGHT = 18;
const STEP_WIDTH = 20;
const KEY_WIDTH = 64;

export const PianoRoll = ({
  notes: initialNotes = [],
  onNoteChange,
  bars = 4,
  className = '',
}: PianoRollProps) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [tool, setTool] = useState<Tool>('draw');
  const [quantize, setQuantize] = useState<QuantizeValue>(4); // quarter note = 4 steps per beat
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState<{ noteId: string; startX: number; startY: number; origPitch: number; origStart: number; movedX: number; movedY: number; broke: boolean } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const octaveStart = 3;
  const octaveEnd = 6;
  const totalOctaves = octaveEnd - octaveStart;
  const totalPitches = totalOctaves * 12;
  const beatsPerBar = 4;
  const stepsPerBeat = 4; // 16th note grid
  const totalSteps = bars * beatsPerBar * stepsPerBeat;

  // Quantize step size: how many 16th-note steps per quantize division
  const quantizeSteps: Record<QuantizeValue, number> = {
    1: 16,  // whole note = 16 sixteenths
    2: 8,   // half note
    4: 4,   // quarter note
    8: 2,   // eighth note
    16: 1,  // sixteenth note
  };
  const qStep = quantizeSteps[quantize];

  const snapToGrid = (step: number) => Math.round(step / qStep) * qStep;

  const updateNotes = useCallback((newNotes: Note[]) => {
    setNotes(newNotes);
    onNoteChange?.(newNotes);
  }, [onNoteChange]);

  const isBlackKey = (pitch: number) => BLACK_KEY_INDICES.has(pitch % 12);
  const getNoteName = (pitch: number) => NOTE_NAMES[pitch % 12];
  const getOctave = (pitch: number) => Math.floor(pitch / 12) + octaveStart;

  // Convert absolute pitch to row index (top = highest pitch)
  const pitchToRow = (pitch: number) => totalPitches - 1 - (pitch);
  const rowToPitch = (row: number) => totalPitches - 1 - row;

  const handleCellClick = (pitch: number, stepIdx: number, e: React.MouseEvent) => {
    // Ctrl+click always deletes
    if (e.ctrlKey || e.metaKey) {
      const newNotes = notes.filter(n => !(n.pitch === pitch && n.start <= stepIdx && stepIdx < n.start + n.duration));
      updateNotes(newNotes);
      return;
    }

    const snappedStep = snapToGrid(stepIdx);

    if (tool === 'erase') {
      const newNotes = notes.filter(n => !(n.pitch === pitch && n.start <= stepIdx && stepIdx < n.start + n.duration));
      updateNotes(newNotes);
    } else {
      // Check if note exists at this position
      const existing = notes.find(n => n.pitch === pitch && n.start <= stepIdx && stepIdx < n.start + n.duration);
      if (existing) {
        // Start drag
        return;
      }
      // Create note snapped to grid
      const newNote: Note = {
        id: `note-${Date.now()}-${pitch}-${snappedStep}`,
        pitch,
        start: snappedStep,
        duration: qStep,
        velocity: 80,
      };
      updateNotes([...notes, newNote]);
    }
  };

  const handleNoteMouseDown = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || tool === 'erase') {
      updateNotes(notes.filter(n => n.id !== noteId));
      return;
    }
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setDragging({
      noteId,
      startX: e.clientX,
      startY: e.clientY,
      origPitch: note.pitch,
      origStart: note.start,
      movedX: 0,
      movedY: 0,
      broke: false,
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      const pitchDelta = -Math.round(dy / ROW_HEIGHT);
      const stepDelta = Math.round(dx / STEP_WIDTH);

      // Horizontal resistance: need to move at least half a step before breaking free
      const broke = dragging.broke || Math.abs(dx) > STEP_WIDTH * 0.6;
      // Snap to nearest grid position
      const newStart = Math.max(0, Math.min(totalSteps - qStep, snapToGrid(dragging.origStart + (broke ? stepDelta : 0))));
      const newPitch = Math.max(0, Math.min(totalPitches - 1, dragging.origPitch + pitchDelta));

      setDragging(prev => prev ? { ...prev, movedX: dx, movedY: dy, broke } : null);

      updateNotes(notes.map(n =>
        n.id === dragging.noteId
          ? { ...n, pitch: newPitch, start: newStart }
          : n
      ));
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, notes, totalSteps, totalPitches, qStep]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-overlay)]'
    : `flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-4">
            <span className="hardware-label">MIDI PIANO ROLL</span>
            {/* Tool selector */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-inset)] rounded-[var(--radius-sm)] p-0.5">
              <button
                onClick={() => setTool('draw')}
                className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs flex items-center gap-1 transition-all ${tool === 'draw' ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                aria-label="Draw tool"
              >
                <IconDraw size={12} /> Draw
              </button>
              <button
                onClick={() => setTool('erase')}
                className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs flex items-center gap-1 transition-all ${tool === 'erase' ? 'bg-[var(--color-accent-danger)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                aria-label="Erase tool"
              >
                <IconEraser size={12} /> Erase
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quantize selector */}
            <div className="flex items-center gap-2">
              <span className="hardware-label">QUANTIZE</span>
              <select
                value={quantize}
                onChange={(e) => setQuantize(Number(e.target.value) as QuantizeValue)}
                className="bg-[var(--color-bg-inset)] text-[var(--color-text-primary)] text-xs font-mono px-2 py-1 border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--color-border-focus)]"
              >
                <option value={1}>1 (Whole)</option>
                <option value={2}>1/2 (Half)</option>
                <option value={4}>1/4 (Quarter)</option>
                <option value={8}>1/8 (Eighth)</option>
                <option value={16}>1/16 (16th)</option>
              </select>
            </div>
            <span className="telemetry text-xs">{bars} BARS</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
            </button>
          </div>
        </div>

        {/* Measure Numbers */}
        <div className="flex shrink-0">
          <div style={{ width: KEY_WIDTH }} className="shrink-0 bg-[var(--color-bg-app-shell)] border-b border-r border-[var(--color-border-subtle)]" />
          <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app-shell)]" style={{ width: totalSteps * STEP_WIDTH }}>
            {Array.from({ length: bars }).map((_, barIdx) => (
              <div
                key={barIdx}
                className="text-center text-[10px] font-mono text-[var(--color-text-muted)] border-r border-[var(--color-border-strong)] py-1"
                style={{ width: beatsPerBar * stepsPerBeat * STEP_WIDTH }}
              >
                {barIdx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Piano Roll Grid */}
        <div className={`flex overflow-auto ${expanded ? 'flex-1' : ''}`} style={expanded ? undefined : { maxHeight: 400 }}>
          {/* Piano Keys Column — right-aligned, black keys 75% width from right */}
          <div className="shrink-0 bg-[var(--color-bg-inset)] border-r border-[var(--color-border-subtle)]" style={{ width: KEY_WIDTH }}>
            {Array.from({ length: totalPitches }).map((_, rowIdx) => {
              const pitch = rowToPitch(rowIdx);
              const noteName = getNoteName(pitch);
              const octave = getOctave(pitch);
              const isBlack = isBlackKey(pitch);
              const isC = noteName === 'C';
              const blackKeyW = Math.round(KEY_WIDTH * 0.75);

              return (
                <div
                  key={rowIdx}
                  className={`relative border-b border-[var(--color-border-subtle)] ${isC ? 'border-b-[var(--color-border-strong)]' : ''}`}
                  style={{ height: ROW_HEIGHT, width: KEY_WIDTH }}
                >
                  {isBlack ? (
                    <>
                      {/* Gray empty space on the left */}
                      <div className="absolute left-0 top-0 bottom-0 bg-[var(--color-bg-inset)]" style={{ width: KEY_WIDTH - blackKeyW }} />
                      {/* Black key right-aligned */}
                      <div
                        className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-[#0c0c0e]"
                        style={{ width: blackKeyW }}
                      >
                        <span className="text-[9px] font-mono text-[var(--color-text-muted)] pr-1.5">
                          {noteName}{octave}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* White key full width, text right-aligned */
                    <div className="absolute inset-0 flex items-center justify-end bg-[var(--color-bg-surface-elevated)]">
                      <span className="text-[9px] font-mono text-[var(--color-text-secondary)] pr-1.5">
                        {noteName}{octave}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid Area */}
          <div ref={gridRef} className="relative" style={{ width: totalSteps * STEP_WIDTH, minWidth: totalSteps * STEP_WIDTH }}>
            {/* Grid rows */}
            {Array.from({ length: totalPitches }).map((_, rowIdx) => {
              const pitch = rowToPitch(rowIdx);
              const isBlack = isBlackKey(pitch);
              const isC = getNoteName(pitch) === 'C';

              return (
                <div
                  key={rowIdx}
                  className={`flex ${isC ? 'border-b border-b-[var(--color-border-strong)]' : 'border-b border-b-[var(--color-border-subtle)]'}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                    const isBarLine = stepIdx % (beatsPerBar * stepsPerBeat) === 0;
                    const isBeatLine = stepIdx % stepsPerBeat === 0;

                    return (
                      <div
                        key={stepIdx}
                        className={`cursor-pointer hover:bg-[var(--color-overlay-hover)]
                          ${isBlack ? 'bg-[rgba(0,0,0,0.2)]' : 'bg-[var(--color-bg-inset)]'}
                          ${isBarLine ? 'border-l border-l-[var(--color-border-strong)]' : isBeatLine ? 'border-l border-l-[var(--color-border-subtle)]' : 'border-l border-l-transparent'}
                        `}
                        style={{ width: STEP_WIDTH, height: ROW_HEIGHT }}
                        onClick={(e) => handleCellClick(pitch, stepIdx, e)}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Notes overlay */}
            {notes.map((note) => {
              const row = pitchToRow(note.pitch);
              if (row < 0 || row >= totalPitches) return null;
              return (
                <div
                  key={note.id}
                  className={`absolute rounded-sm cursor-grab active:cursor-grabbing border
                    ${tool === 'erase' ? 'hover:opacity-50' : ''}
                    bg-[var(--color-accent-primary)] border-[var(--color-accent-primary-hover)]
                  `}
                  style={{
                    top: row * ROW_HEIGHT + 1,
                    left: note.start * STEP_WIDTH + 1,
                    width: Math.max(note.duration * STEP_WIDTH - 2, 4),
                    height: ROW_HEIGHT - 2,
                    opacity: 0.6 + (note.velocity / 127) * 0.4,
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => handleNoteMouseDown(note.id, e)}
                >
                  <span className="text-[8px] font-mono text-[var(--color-text-inverse)] px-1 truncate block leading-[16px]">
                    {getNoteName(note.pitch)}{getOctave(note.pitch)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
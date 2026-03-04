import React, { useState, useRef, useCallback, useEffect } from 'react';
import { IconPlay, IconPause, IconStop, IconRecord, IconLoop, IconRewind, IconFastForward } from '../icons/IconLibrary';

export interface TransportProps {
  isPlaying?: boolean;
  isRecording?: boolean;
  isLooping?: boolean;
  tempo?: number;
  position?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  onLoop?: () => void;
  onTempoChange?: (tempo: number) => void;
  onRewind?: () => void;
  onFastForward?: () => void;
  onJumpToStart?: () => void;
  onJumpToEnd?: () => void;
  className?: string;
}

export const Transport = ({
  isPlaying: controlledPlaying,
  isRecording: controlledRecording,
  isLooping: controlledLooping,
  tempo = 120,
  position = '1.1.1',
  onPlay,
  onPause,
  onStop,
  onRecord,
  onLoop,
  onTempoChange,
  onRewind,
  onFastForward,
  onJumpToStart,
  onJumpToEnd,
  className = '',
}: TransportProps) => {
  const [localTempo, setLocalTempo] = useState(tempo);
  const [playing, setPlaying] = useState(controlledPlaying ?? false);
  const [recording, setRecording] = useState(controlledRecording ?? false);
  const [looping, setLooping] = useState(controlledLooping ?? false);
  const [rewindHeld, setRewindHeld] = useState(false);
  const [ffHeld, setFfHeld] = useState(false);
  const [stopFlash, setStopFlash] = useState(false);
  const [playFlash, setPlayFlash] = useState(false);
  const rewindTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const ffTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const rewindLastClickRef = useRef(0);
  const ffLastClickRef = useRef(0);

  useEffect(() => {
    if (controlledPlaying !== undefined) setPlaying(controlledPlaying);
  }, [controlledPlaying]);
  useEffect(() => {
    if (controlledRecording !== undefined) setRecording(controlledRecording);
  }, [controlledRecording]);
  useEffect(() => {
    if (controlledLooping !== undefined) setLooping(controlledLooping);
  }, [controlledLooping]);

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value);
    if (!isNaN(newTempo)) {
      setLocalTempo(newTempo);
      onTempoChange?.(newTempo);
    }
  };

  const handlePlayPause = () => {
    if (playing) {
      setPlaying(false);
      onPause?.();
    } else {
      setPlaying(true);
      setPlayFlash(true);
      setTimeout(() => setPlayFlash(false), 200);
      onPlay?.();
    }
  };

  const handleStop = () => {
    setPlaying(false);
    setRecording(false);
    setStopFlash(true);
    setTimeout(() => setStopFlash(false), 200);
    onStop?.();
  };

  const handleRecord = () => {
    setRecording(!recording);
    onRecord?.();
  };

  const handleLoopToggle = () => {
    setLooping(!looping);
    onLoop?.();
  };

  // Rewind: hold = rewind continuously, double-click = jump to start
  const handleRewindDown = () => {
    const now = Date.now();
    if (now - rewindLastClickRef.current < 300) {
      onJumpToStart?.();
      rewindLastClickRef.current = 0;
    } else {
      rewindLastClickRef.current = now;
    }
    setRewindHeld(true);
    onRewind?.();
  };

  const handleRewindUp = () => {
    setRewindHeld(false);
  };

  // Fast Forward: hold = ff continuously, double-click = jump to end
  const handleFfDown = () => {
    const now = Date.now();
    if (now - ffLastClickRef.current < 300) {
      onJumpToEnd?.();
      ffLastClickRef.current = 0;
    } else {
      ffLastClickRef.current = now;
    }
    setFfHeld(true);
    onFastForward?.();
  };

  const handleFfUp = () => {
    setFfHeld(false);
  };

  const transportBtnBase = `
    w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)]
    border transition-all duration-100 select-none
  `;
  const transportBtnIdle = `
    bg-[var(--color-bg-surface-elevated)] border-[var(--color-border-strong)]
    text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-hover)]
    shadow-[0_1px_0_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]
  `;
  const transportBtnActive = `
    bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]
    text-[var(--color-text-inverse)]
    shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]
  `;
  const transportBtnHeld = `
    bg-[var(--color-accent-primary)]/80 border-[var(--color-accent-primary)]
    text-[var(--color-text-inverse)]
    shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]
  `;

  return (
    <div className={`bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-4 ${className}`}>
      <div className="flex items-center gap-6 flex-wrap">
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <button
            className={`${transportBtnBase} ${rewindHeld ? transportBtnHeld : transportBtnIdle}`}
            onMouseDown={handleRewindDown}
            onMouseUp={handleRewindUp}
            onMouseLeave={handleRewindUp}
            title="Rewind (double-click: jump to start)"
            aria-label="Rewind"
          >
            <IconRewind size={16} filled={rewindHeld} />
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className={`${transportBtnBase} ${stopFlash ? transportBtnActive : transportBtnIdle}`}
            title="Stop"
            aria-label="Stop"
          >
            <IconStop size={16} filled={stopFlash} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className={`
              w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)]
              border transition-all duration-100 select-none
              ${playing
                ? `bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]`
                : `bg-[var(--color-bg-surface-elevated)] border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-hover)] shadow-[0_1px_0_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]`
              }
            `}
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <IconPause size={18} filled /> : <IconPlay size={18} filled={playFlash} />}
          </button>

          {/* Record */}
          <button
            onClick={handleRecord}
            className={`
              ${transportBtnBase}
              ${recording
                ? 'bg-[var(--color-accent-danger)] border-[var(--color-accent-danger)] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-[var(--color-bg-surface-elevated)] border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-danger)] hover:bg-[var(--color-overlay-hover)] shadow-[0_1px_0_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]'
              }
            `}
            style={recording ? { animation: 'recordPulse 1.5s ease-in-out infinite' } : undefined}
            title="Record"
            aria-label="Record"
          >
            <IconRecord size={12} className={recording ? 'text-white' : ''} />
          </button>

          {/* Fast Forward */}
          <button
            className={`${transportBtnBase} ${ffHeld ? transportBtnHeld : transportBtnIdle}`}
            onMouseDown={handleFfDown}
            onMouseUp={handleFfUp}
            onMouseLeave={handleFfUp}
            title="Fast Forward (double-click: jump to end)"
            aria-label="Fast Forward"
          >
            <IconFastForward size={16} filled={ffHeld} />
          </button>

          {/* Loop */}
          <button
            onClick={handleLoopToggle}
            className={`${transportBtnBase} ${looping ? transportBtnActive : transportBtnIdle}`}
            title="Loop"
            aria-label="Loop"
          >
            <IconLoop size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--color-border-subtle)]" />

        {/* Position Display */}
        <div className="flex flex-col">
          <span className="hardware-label mb-0.5">POSITION</span>
          <span className="font-mono text-base text-[var(--color-text-primary)] tracking-wider">
            {position}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--color-border-subtle)]" />

        {/* Tempo Control */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="hardware-label mb-0.5">TEMPO</span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={localTempo}
                onChange={handleTempoChange}
                min={20}
                max={300}
                className="w-16 px-2 py-1 bg-[var(--color-bg-inset)] text-[var(--color-text-primary)] font-mono text-sm border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--color-border-focus)]"
              />
              <span className="text-xs text-[var(--color-text-muted)] uppercase">BPM</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--color-border-subtle)]" />

        {/* Time Signature & Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="hardware-label mb-0.5">TIME SIG</span>
            <span className="font-mono text-sm text-[var(--color-text-primary)]">4/4</span>
          </div>

          <div className="flex flex-col">
            <span className="hardware-label mb-0.5">CPU</span>
            <span className="telemetry text-xs">28%</span>
          </div>

          <div className="flex flex-col">
            <span className="hardware-label mb-0.5">SAMPLE RATE</span>
            <span className="telemetry text-xs">48 kHz</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes recordPulse {
          0%, 100% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.5), 0 0 12px rgba(239,68,68,0.4); }
          50% { box-shadow: inset 0 1px 3px rgba(0,0,0,0.5), 0 0 20px rgba(239,68,68,0.7); }
        }
      `}</style>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Knob } from './Knob';
import { IconExpand, IconCollapse } from '../../icons/IconLibrary';
import { colorValues } from '../../tokens/colors';

export interface SynthesizerProps {
  className?: string;
}

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export const Synthesizer = ({ className = '' }: SynthesizerProps) => {
  const [expanded, setExpanded] = useState(false);
  const [waveType, setWaveType] = useState<WaveType>('sawtooth');
  const [attack, setAttack] = useState(10);
  const [decay, setDecay] = useState(30);
  const [sustain, setSustain] = useState(70);
  const [release, setRelease] = useState(40);
  const [filterCutoff, setFilterCutoff] = useState(8000);
  const [filterRes, setFilterRes] = useState(0.3);
  const [detune, setDetune] = useState(0);
  const [mix, setMix] = useState(80);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const envCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform preview
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;
    const cy = h / 2;
    const cycles = 3;

    ctx.strokeStyle = colorValues.accent.primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const t = (x / w) * cycles * Math.PI * 2;
      let y = 0;

      switch (waveType) {
        case 'sine':
          y = Math.sin(t);
          break;
        case 'square':
          y = Math.sin(t) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          y = 2 * ((t / (Math.PI * 2)) % 1) - 1;
          break;
        case 'triangle':
          y = 2 * Math.abs(2 * ((t / (Math.PI * 2)) % 1) - 1) - 1;
          break;
      }

      const py = cy - y * (h * 0.4);
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
  }, [waveType]);

  // Draw ADSR envelope preview
  useEffect(() => {
    const canvas = envCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;
    const pad = 4;

    // Normalize ADSR values to proportions
    const totalTime = attack + decay + 40 + release; // sustain is a fixed hold period
    const aX = (attack / totalTime) * (w - pad * 2);
    const dX = (decay / totalTime) * (w - pad * 2);
    const sX = (40 / totalTime) * (w - pad * 2); // sustain hold time
    const rX = (release / totalTime) * (w - pad * 2);
    const sustainLevel = sustain / 100;

    ctx.strokeStyle = colorValues.accent.primary;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = colorValues.overlay.selected;

    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    // Attack
    ctx.lineTo(pad + aX, pad);
    // Decay
    ctx.lineTo(pad + aX + dX, h - pad - (h - pad * 2) * sustainLevel);
    // Sustain
    ctx.lineTo(pad + aX + dX + sX, h - pad - (h - pad * 2) * sustainLevel);
    // Release
    ctx.lineTo(pad + aX + dX + sX + rX, h - pad);

    ctx.stroke();

    // Fill
    ctx.lineTo(pad, h - pad);
    ctx.fill();
  }, [attack, decay, sustain, release]);

  const containerClass = expanded
    ? 'fixed inset-4 z-40 flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-overlay)]'
    : `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] overflow-hidden ${className}`;

  const waveTypes: { value: WaveType; label: string }[] = [
    { value: 'sine', label: 'SIN' },
    { value: 'square', label: 'SQR' },
    { value: 'sawtooth', label: 'SAW' },
    { value: 'triangle', label: 'TRI' },
  ];

  return (
    <>
      {expanded && <div className="fixed inset-0 z-30 bg-[var(--color-bg-scrim)]" onClick={() => setExpanded(false)} />}
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] shrink-0">
          <span className="hardware-label">SYNTHESIZER</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <IconCollapse size={14} /> : <IconExpand size={14} />}
          </button>
        </div>

        <div className={`p-4 ${expanded ? 'flex-1 overflow-auto' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Oscillator Section */}
            <div className="bg-[var(--color-bg-inset)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border-subtle)]">
              <span className="hardware-label mb-3 block">OSCILLATOR</span>

              {/* Waveform selector */}
              <div className="flex gap-1 mb-3">
                {waveTypes.map(wt => (
                  <button
                    key={wt.value}
                    onClick={() => setWaveType(wt.value)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-mono rounded-[var(--radius-sm)] border transition-all
                      ${waveType === wt.value
                        ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]'
                        : 'bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)]'
                      }`}
                  >
                    {wt.label}
                  </button>
                ))}
              </div>

              {/* Waveform preview */}
              <div className="bg-[var(--color-bg-page)] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] mb-3 shadow-[var(--shadow-inset)]">
                <canvas
                  ref={waveCanvasRef}
                  style={{ width: '100%', height: 60, display: 'block' }}
                />
              </div>

              <div className="flex justify-around">
                <Knob label="DETUNE" defaultValue={detune} min={-100} max={100} unit=" ct" size="small" onChange={setDetune} />
                <Knob label="MIX" defaultValue={mix} min={0} max={100} unit="%" size="small" onChange={setMix} />
              </div>
            </div>

            {/* Envelope Section */}
            <div className="bg-[var(--color-bg-inset)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border-subtle)]">
              <span className="hardware-label mb-3 block">ENVELOPE</span>

              {/* ADSR preview */}
              <div className="bg-[var(--color-bg-page)] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] mb-3 shadow-[var(--shadow-inset)]">
                <canvas
                  ref={envCanvasRef}
                  style={{ width: '100%', height: 60, display: 'block' }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Knob label="A" defaultValue={attack} min={0} max={100} unit=" ms" size="small" onChange={setAttack} />
                <Knob label="D" defaultValue={decay} min={0} max={100} unit=" ms" size="small" onChange={setDecay} />
                <Knob label="S" defaultValue={sustain} min={0} max={100} unit="%" size="small" onChange={setSustain} />
                <Knob label="R" defaultValue={release} min={0} max={100} unit=" ms" size="small" onChange={setRelease} />
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-[var(--color-bg-inset)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border-subtle)]">
              <span className="hardware-label mb-3 block">FILTER</span>

              <div className="flex justify-around mt-4">
                <Knob label="CUTOFF" defaultValue={filterCutoff} min={20} max={20000} unit=" Hz" size="medium" onChange={setFilterCutoff} />
                <Knob label="RES" defaultValue={filterRes * 100} min={0} max={100} unit="%" size="medium" onChange={(v) => setFilterRes(v / 100)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

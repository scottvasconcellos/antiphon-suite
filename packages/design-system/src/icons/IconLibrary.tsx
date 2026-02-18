import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  filled?: boolean;
}

const sw = 1.5; // default stroke width
const bg = 'var(--color-bg-page, #0a0a0b)'; // dark background for etched lines

// Helper for icons that need a rounded-rect background with etched content
const RectBg = ({ size, children, className }: { size: number; children: React.ReactNode; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="3.5" fill="currentColor" />
    {children}
  </svg>
);

// --- APP & NAVIGATION ---

export const IconHome = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

export const IconDashboard = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );

export const IconProject = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

// Library: books on a shelf, last one leaning
export const IconLibrary = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <rect x="4" y="3" width="3" height="17" rx="0.5" />
      <rect x="8.5" y="5" width="2.5" height="15" rx="0.5" />
      <rect x="12.5" y="3" width="3" height="17" rx="0.5" />
      <rect x="16.5" y="5" width="2.8" height="15" rx="0.5" transform="rotate(8 17.9 20)" />
      <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="4" y="3" width="3" height="17" rx="0.5" />
      <rect x="8.5" y="5" width="2.5" height="15" rx="0.5" />
      <rect x="12.5" y="3" width="3" height="17" rx="0.5" />
      <rect x="16.5" y="5" width="2.8" height="15" rx="0.5" transform="rotate(8 17.9 20)" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  );

// Settings: gear with center hole always visible
export const IconSettings = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      fill={filled ? 'currentColor' : 'none'} />
    <circle cx="12" cy="12" r="3" fill={filled ? bg : 'none'} />
  </svg>
);

export const IconUser = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="7" r="4" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="4" y1="21" x2="20" y2="21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

export const IconSearch = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <circle cx="11" cy="11" r="6" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} />
      <line x1="16" y1="16" x2="20" y2="20" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

// --- ACTIONS ---
export const IconAdd = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <line x1="12" y1="7" x2="12" y2="17" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <line x1="7" y1="12" x2="17" y2="12" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

export const IconEdit = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke={bg} strokeWidth={1} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

export const IconDelete = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="10" y1="11" x2="10" y2="17" stroke={bg} strokeWidth={1.5} strokeLinecap="square" />
      <line x1="14" y1="11" x2="14" y2="17" stroke={bg} strokeWidth={1.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );

export const IconDownload = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <path d="M17 14v4H7v-4" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <polyline points="9.5 11 12 13.5 14.5 11" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="12" y1="13.5" x2="12" y2="6" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

export const IconUpload = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <path d="M17 14v4H7v-4" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <polyline points="14.5 9 12 6.5 9.5 9" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="12" y1="6.5" x2="12" y2="14" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

export const IconImport = IconUpload;
export const IconExport = IconDownload;

// --- PLAYBACK & TRANSPORT ---
export const IconPlay = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={0.5} className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );

export const IconPause = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );

export const IconStop = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <rect x="5" y="5" width="14" height="14" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="5" y="5" width="14" height="14" />
    </svg>
  );

export const IconRecord = ({ size = 20, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const IconLoop = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="16 4 20 8 16 12" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M4 12V10a4 4 0 0 1 4-4h12" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <polyline points="8 20 4 16 8 12" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M20 12v2a4 4 0 0 1-4 4H4" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );

export const IconRewind = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polygon points="11 19 2 12 11 5 11 19" />
    <polygon points="22 19 13 12 22 5 22 19" />
  </svg>
);

export const IconFastForward = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polygon points="13 19 22 12 13 5 13 19" />
    <polygon points="2 19 11 12 2 5 2 19" />
  </svg>
);

// --- AUDIO & MUSIC ---
export const IconVolume = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );

export const IconMute = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );

export const IconWaveform = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );

// Spectrum: equidistant bars — filled matches outline exactly
export const IconSpectrum = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <line x1="4.5" y1="19" x2="4.5" y2="14" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="8" y1="19" x2="8" y2="10" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="11.5" y1="19" x2="11.5" y2="5" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="15" y1="19" x2="15" y2="8" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="18.5" y1="19" x2="18.5" y2="12" stroke={bg} strokeWidth={2} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="3" y1="20" x2="3" y2="14" />
      <line x1="6.5" y1="20" x2="6.5" y2="10" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="13.5" y1="20" x2="13.5" y2="7" />
      <line x1="17" y1="20" x2="17" y2="11" />
      <line x1="20.5" y1="20" x2="20.5" y2="15" />
    </svg>
  );

export const IconMIDI = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M6 10h4M14 10h4M6 14h12" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h4M14 10h4M6 14h12" />
    </svg>
  );

export const IconKeyboard = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h12" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h12" />
    </svg>
  );

// Grid: nine filled squares for filled variant
export const IconGrid = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <rect x="3" y="3" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="3" width="5" height="5" rx="0.5" />
      <rect x="16" y="3" width="5" height="5" rx="0.5" />
      <rect x="3" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="16" y="9.5" width="5" height="5" rx="0.5" />
      <rect x="3" y="16" width="5" height="5" rx="0.5" />
      <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
      <rect x="16" y="16" width="5" height="5" rx="0.5" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );

// Note: eighth note
export const IconNote = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <ellipse cx="9" cy="17" rx="3.5" ry="2.5" fill="currentColor" />
      <line x1="12.5" y1="17" x2="12.5" y2="4" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <path d="M12.5 4c2.5 0 6 1.5 6 4.5" fill="none" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <ellipse cx="9" cy="17" rx="3.5" ry="2.5" />
      <line x1="12.5" y1="17" x2="12.5" y2="4" />
      <path d="M12.5 4c2.5 0 6 1.5 6 4.5" />
    </svg>
  );

export const IconChord = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="18" cy="6" r="3" fill="currentColor" />
      <line x1="8.5" y1="16.5" x2="9.5" y2="14.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="14.5" y1="9.5" x2="15.5" y2="8.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="6" cy="18" r="3" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <line x1="8" y1="16" x2="10" y2="14" />
      <line x1="14" y1="10" x2="16" y2="8" />
    </svg>
  );

// Scale: bars — filled matches outline bar count exactly
export const IconScale = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <rect x="4" y="14" width="2" height="6" />
      <rect x="8" y="10" width="2" height="10" />
      <rect x="12" y="6" width="2" height="14" />
      <rect x="16" y="12" width="2" height="8" />
      <rect x="20" y="8" width="2" height="12" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="2" y1="20" x2="22" y2="20" />
      <line x1="5" y1="20" x2="5" y2="14" />
      <line x1="9" y1="20" x2="9" y2="10" />
      <line x1="13" y1="20" x2="13" y2="6" />
      <line x1="17" y1="20" x2="17" y2="12" />
      <line x1="21" y1="20" x2="21" y2="8" />
    </svg>
  );

export const IconEQ = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <line x1="4" y1="21" x2="4" y2="14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="4" y1="10" x2="4" y2="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="12" y1="21" x2="12" y2="12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="12" y1="8" x2="12" y2="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="20" y1="21" x2="20" y2="16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="20" y1="12" x2="20" y2="3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <rect x="1" y="11.5" width="6" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="5.5" width="6" height="5" rx="1" fill="currentColor" />
      <rect x="17" y="13.5" width="6" height="5" rx="1" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );

// Compressor: knee curve
export const IconCompressor = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="2 2" opacity="0.3" stroke={bg} strokeWidth={1} />
      <polyline points="4 20 12 12 20 8" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="2 2" opacity="0.3" />
      <polyline points="4 20 12 12 20 8" />
      <line x1="12" y1="4" x2="12" y2="20" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );

// Automation: connected dots
export const IconAutomation = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <polyline points="3 18 10 8 21 14" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      <circle cx="3" cy="18" r="2.5" fill="currentColor" />
      <circle cx="10" cy="8" r="2.5" fill="currentColor" />
      <circle cx="21" cy="14" r="2.5" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="3 18 10 8 21 14" />
      <circle cx="3" cy="18" r="2" fill="currentColor" />
      <circle cx="10" cy="8" r="2" fill="currentColor" />
      <circle cx="21" cy="14" r="2" fill="currentColor" />
    </svg>
  );

// Envelope: ADSR shape
export const IconEnvelope = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="4 18 7 5 11 11 16 11 20 18" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="2 20 6 4 10 10 17 10 22 20" />
    </svg>
  );

// Reverb: radiating arcs from a point (more defined)
export const IconReverb = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <circle cx="6" cy="12" r="1" fill={bg} />
      <path d="M9 8a5.5 5.5 0 0 1 0 8" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M12 5.5a9 9 0 0 1 0 13" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M15 3a12.5 12.5 0 0 1 0 18" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <path d="M8 7a7 7 0 0 1 0 10" />
      <path d="M12 4a11 11 0 0 1 0 16" />
      <path d="M16 2a14 14 0 0 1 0 20" />
    </svg>
  );

// Decay: sharp attack then exponential falloff
export const IconDecay = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="4 18 4 5" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <path d="M4 5 C 6 5 8 17 20 18" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="4 5 4 19 20 19" />
      <path d="M4 5 C 8 5 8 18 20 19" />
    </svg>
  );

// Chorus: doubled sinusoidal waves with offset (more dynamic)
export const IconChorus = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <path d="M3 9 Q 7 3 11 9 Q 15 15 19 9 Q 20 7 21 9" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.3} strokeLinecap="square" />
      <path d="M3 15 Q 7 9 11 15 Q 15 21 19 15 Q 20 13 21 15" fill="none" stroke={bg} strokeWidth={strokeWidth + 0.3} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M2 9 Q 6 3 10 9 Q 14 15 18 9 Q 20.5 5 22 9" />
      <path d="M2 15 Q 6 9 10 15 Q 14 21 18 15 Q 20.5 11 22 15" />
    </svg>
  );

// Grand Piano (top-down view) — more detail
export const IconPiano = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M6 20 L6 8 Q6 3 12 3 Q18 3 18 8 L18 20 Z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="6" y1="14" x2="18" y2="14" stroke={bg} strokeWidth={1} />
      <line x1="8.5" y1="14" x2="8.5" y2="20" stroke={bg} strokeWidth={1} />
      <line x1="11" y1="14" x2="11" y2="20" stroke={bg} strokeWidth={1} />
      <line x1="13.5" y1="14" x2="13.5" y2="20" stroke={bg} strokeWidth={1} />
      <line x1="16" y1="14" x2="16" y2="20" stroke={bg} strokeWidth={1} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M6 20 L6 8 Q6 3 12 3 Q18 3 18 8 L18 20 Z" />
      <line x1="6" y1="14" x2="18" y2="14" />
      <line x1="8.5" y1="14" x2="8.5" y2="20" />
      <line x1="11" y1="14" x2="11" y2="20" />
      <line x1="13.5" y1="14" x2="13.5" y2="20" />
      <line x1="16" y1="14" x2="16" y2="20" />
      {/* Black keys */}
      <rect x="9.5" y="14" width="1" height="3" fill="currentColor" />
      <rect x="12" y="14" width="1" height="3" fill="currentColor" />
      <rect x="15" y="14" width="1" height="3" fill="currentColor" />
      {/* Lid prop line */}
      <line x1="8" y1="5" x2="8" y2="10" opacity="0.4" />
    </svg>
  );

// Guitar: detailed with visible tuning pegs (6)
export const IconGuitar = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M20 2 L16 9 L14 10 Q10 11 9 15 Q8 19 11 21 Q14 22 17 20 Q19 18 18 13 L19 10 L22 8 Z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <circle cx="14" cy="17" r="1.2" fill={bg} />
      <line x1="19.5" y1="1.5" x2="20.5" y2="2" stroke="currentColor" strokeWidth={1.2} strokeLinecap="square" />
      <line x1="20" y1="2.5" x2="21" y2="3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="square" />
      <line x1="20.5" y1="3.5" x2="21.5" y2="4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      {/* Neck */}
      <line x1="20" y1="2" x2="15" y2="9" />
      <line x1="22" y1="4" x2="17" y2="11" />
      {/* Body */}
      <path d="M15 9 Q10 11 9 15 Q8 19 11 21 Q14 22 17 20 Q19 18 18 13 Q19 11 17 11" />
      {/* Sound hole */}
      <circle cx="14" cy="17" r="1.5" />
      {/* 6 Tuning pegs */}
      <line x1="19" y1="1" x2="20" y2="1.5" />
      <line x1="19.5" y1="2" x2="20.5" y2="2.5" />
      <line x1="20" y1="3" x2="21" y2="3.5" />
      <line x1="21" y1="3" x2="22" y2="3.5" />
      <line x1="21.5" y1="4" x2="22.5" y2="4.5" />
      <line x1="22" y1="5" x2="23" y2="5.5" />
    </svg>
  );

// Bass: stockier body, 4 tuning pegs
export const IconBass = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M19 2 L15 8 L13 10 Q8 12 7 16 Q6 20 9 22 Q13 23 17 20 Q19 17 18 13 L20 10 L22 8 Z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <circle cx="13" cy="17" r="1.2" fill={bg} />
      <line x1="18" y1="1" x2="19" y2="1.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" />
      <line x1="19" y1="2.5" x2="20" y2="3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <line x1="19" y1="2" x2="14" y2="9" />
      <line x1="21" y1="4" x2="16" y2="11" />
      {/* Stockier body */}
      <path d="M14 9 Q8 12 7 16 Q6 20 9 22 Q13 23 17 20 Q19 17 18 13 Q19 11 16 11" />
      <circle cx="13" cy="17" r="1.5" />
      {/* 4 Tuning pegs */}
      <line x1="18" y1="1" x2="19" y2="1.5" />
      <line x1="18.5" y1="2" x2="19.5" y2="2.5" />
      <line x1="20.5" y1="3" x2="21.5" y2="3.5" />
      <line x1="21" y1="4" x2="22" y2="4.5" />
    </svg>
  );

// Drums: top-down kit with cymbal, snare, kick
export const IconDrums = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <ellipse cx="12" cy="16" rx="7" ry="4" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <ellipse cx="5" cy="8" rx="3.5" ry="2.5" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <ellipse cx="19" cy="8" rx="3.5" ry="2.5" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="9" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth={strokeWidth + 0.5} strokeLinecap="square" />
      <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
      {/* Cross hatch on snare */}
      <line x1="10" y1="15" x2="14" y2="17" stroke={bg} strokeWidth={0.8} />
      <line x1="14" y1="15" x2="10" y2="17" stroke={bg} strokeWidth={0.8} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <ellipse cx="12" cy="16" rx="7" ry="4" />
      <ellipse cx="5" cy="8" rx="3.5" ry="2.5" />
      <ellipse cx="19" cy="8" rx="3.5" ry="2.5" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <line x1="12" y1="1" x2="12" y2="5" />
      {/* Drum sticks hint */}
      <line x1="8" y1="6" x2="11" y2="13" opacity="0.5" />
      <line x1="16" y1="6" x2="13" y2="13" opacity="0.5" />
    </svg>
  );

// Synth: keyboard with knobs and proper black/white key layout
export const IconSynth = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <rect x="2" y="6" width="20" height="14" rx="2" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="2" y1="13" x2="22" y2="13" stroke={bg} strokeWidth={0.8} />
      <line x1="6" y1="13" x2="6" y2="20" stroke={bg} strokeWidth={0.8} />
      <line x1="9" y1="13" x2="9" y2="20" stroke={bg} strokeWidth={0.8} />
      <line x1="12" y1="13" x2="12" y2="20" stroke={bg} strokeWidth={0.8} />
      <line x1="15" y1="13" x2="15" y2="20" stroke={bg} strokeWidth={0.8} />
      <line x1="18" y1="13" x2="18" y2="20" stroke={bg} strokeWidth={0.8} />
      <rect x="7.2" y="13" width="1" height="3" fill={bg} />
      <rect x="10.2" y="13" width="1" height="3" fill={bg} />
      <rect x="14.5" y="13" width="1" height="3" fill={bg} />
      <circle cx="6" cy="9" r="1" fill={bg} />
      <circle cx="10" cy="9" r="1" fill={bg} />
      <circle cx="14" cy="9" r="1" fill={bg} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <line x1="2" y1="13" x2="22" y2="13" />
      <line x1="6" y1="13" x2="6" y2="20" />
      <line x1="9" y1="13" x2="9" y2="20" />
      <line x1="12" y1="13" x2="12" y2="20" />
      <line x1="15" y1="13" x2="15" y2="20" />
      <line x1="18" y1="13" x2="18" y2="20" />
      <rect x="7.2" y="13" width="1" height="3.5" fill="currentColor" />
      <rect x="10.2" y="13" width="1" height="3.5" fill="currentColor" />
      <rect x="14.5" y="13" width="1" height="3.5" fill="currentColor" />
      <rect x="16.5" y="13" width="1" height="3.5" fill="currentColor" />
      <circle cx="6" cy="9" r="1" fill="currentColor" />
      <circle cx="10" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="9" r="1" fill="currentColor" />
    </svg>
  );

// --- STATUS & FEEDBACK ---
export const IconCheck = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="17 8 10 16 7 13" fill="none" stroke={bg} strokeWidth={strokeWidth + 1} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

export const IconWarning = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke={bg} strokeWidth={2.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

export const IconError = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="9" y1="9" x2="15" y2="15" stroke={bg} strokeWidth={2} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );

export const IconInfo = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" stroke={bg} strokeWidth={2} strokeLinecap="square" />
      <line x1="12" y1="8" x2="12.01" y2="8" stroke={bg} strokeWidth={2.5} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );

// --- UTILITY ---
export const IconExpand = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="14 5 19 5 19 10" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <polyline points="10 19 5 19 5 14" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="19" y1="5" x2="14" y2="10" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="5" y1="19" x2="10" y2="14" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );

export const IconCollapse = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <RectBg size={size} className={className}>
      <polyline points="5 14 10 14 10 19" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <polyline points="19 10 14 10 14 5" fill="none" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="14" y1="10" x2="19" y2="5" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
      <line x1="5" y1="19" x2="10" y2="14" stroke={bg} strokeWidth={strokeWidth} strokeLinecap="square" />
    </RectBg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );

export const IconDraw = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="15" y1="5" x2="19" y2="9" stroke={bg} strokeWidth={1} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );

export const IconEraser = ({ size = 20, className = '', strokeWidth = sw, filled = false }: IconProps) =>
  filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.17 5.17a2 2 0 0 1 0 2.82L14 20" fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
      <line x1="18" y1="13" x2="11" y2="6" stroke={bg} strokeWidth={1} />
      <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
      <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.17 5.17a2 2 0 0 1 0 2.82L14 20" />
      <line x1="18" y1="13" x2="11" y2="6" />
      <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
  );

export const IconChevronDown = ({ size = 20, className = '', strokeWidth = sw }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronUp = ({ size = 20, className = '', strokeWidth = sw }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const IconChevronLeft = ({ size = 20, className = '', strokeWidth = sw }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconChevronRight = ({ size = 20, className = '', strokeWidth = sw }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconClose = ({ size = 20, className = '', strokeWidth = sw }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

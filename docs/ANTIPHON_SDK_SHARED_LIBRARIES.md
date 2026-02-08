# Antiphon SDK & Shared Libraries

**Version 1.0 | February 2026**  
**Complete SDK Reference & Shared Code Documentation**

---

## Executive Summary

This document covers **all shared code** across the Antiphon suite:

1. **@antiphon/sdk** – Hub integration, auth, updates, licensing
2. **@antiphon/music-theory** – Chord, scale, harmony algorithms
3. **@antiphon/midi-utils** – MIDI parsing, serialization
4. **@antiphon/ui-components** – Shared React components
5. **shared/types** – Common TypeScript interfaces
6. **shared/constants** – API endpoints, config

All packages:
- Written in TypeScript (type-safe)
- Fully tested (80%+ coverage)
- Documented with JSDoc
- Published to npm (private registry or monorepo)

---

## Table of Contents

1. [@antiphon/sdk Package](#antiphonsdk-package)
2. [@antiphon/music-theory Package](#antiphonmusic-theory-package)
3. [@antiphon/midi-utils Package](#antiphonmidi-utils-package)
4. [@antiphon/ui-components Package](#antiphonui-components-package)
5. [Shared Types](#shared-types)
6. [Shared Constants](#shared-constants)
7. [Testing Standards](#testing-standards)
8. [Documentation Standards](#documentation-standards)

---

## @antiphon/sdk Package

### Purpose

Common functionality for all Antiphon apps:
- Hub integration (registration, updates)
- Authentication (token storage, validation)
- Licensing (validation, offline caching)
- Error handling and logging

### Installation

```bash
pnpm add @antiphon/sdk
```

### API Reference

#### HubClient

**Main class for Hub integration:**

```typescript
import { HubClient } from '@antiphon/sdk';

const hub = new HubClient({
  appId: 'melody-engine',
  version: '1.2.3',
  hubApiUrl: 'http://localhost:3000' // Optional, defaults to localhost:3000
});

// Register app with Hub
await hub.register();

// Validate license
const isLicensed = await hub.validateLicense();

// Check for updates
const update = await hub.checkUpdate();

// Get user info
const user = await hub.getCurrentUser();
```

**Full API:**

```typescript
export interface HubClientConfig {
  appId: string;
  version: string;
  hubApiUrl?: string;
}

export class HubClient {
  constructor(config: HubClientConfig);
  
  /**
   * Register app with Hub
   * @throws {HubConnectionError} If Hub is not running
   */
  register(): Promise<void>;
  
  /**
   * Validate license with Hub
   * @returns {boolean} True if license valid, false otherwise
   */
  validateLicense(): Promise<boolean>;
  
  /**
   * Check for app updates
   * @returns {UpdateInfo | null} Update info if available, null otherwise
   */
  checkUpdate(): Promise<UpdateInfo | null>;
  
  /**
   * Get current authenticated user
   * @returns {User | null} User if authenticated, null otherwise
   */
  getCurrentUser(): Promise<User | null>;
  
  /**
   * Log event for analytics (optional)
   */
  logEvent(event: string, data?: Record<string, any>): Promise<void>;
}
```

#### AuthService

**Token storage and authentication:**

```typescript
import { AuthService } from '@antiphon/sdk';

const auth = new AuthService();

// Store auth token (encrypted)
await auth.storeToken('jwt_token_here');

// Retrieve token
const token = await auth.getToken();

// Clear token (logout)
await auth.clearToken();

// Check if authenticated
const isAuth = await auth.isAuthenticated();
```

**API:**

```typescript
export class AuthService {
  /**
   * Store authentication token (encrypted)
   */
  storeToken(token: string): Promise<void>;
  
  /**
   * Retrieve authentication token
   * @returns {string | null} Token if exists, null otherwise
   */
  getToken(): Promise<string | null>;
  
  /**
   * Clear authentication token
   */
  clearToken(): Promise<void>;
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Promise<boolean>;
}
```

#### LicenseService

**License validation and caching:**

```typescript
import { LicenseService } from '@antiphon/sdk';

const licenses = new LicenseService();

// Validate license (online)
const isValid = await licenses.validate({
  key: 'XXXXX-XXXXX-XXXXX-XXXXX',
  appId: 'melody-engine',
  userId: 'user_123'
});

// Cache license locally (for offline validation)
await licenses.cache(license);

// Get cached license
const cached = await licenses.getCached('melody-engine');
```

**API:**

```typescript
export interface License {
  key: string;
  appId: string;
  userId: string;
  expiresAt?: Date; // Optional (perpetual if absent)
  createdAt: Date;
}

export class LicenseService {
  /**
   * Validate license with server
   */
  validate(license: License): Promise<boolean>;
  
  /**
   * Cache license locally (encrypted)
   */
  cache(license: License): Promise<void>;
  
  /**
   * Get cached license
   */
  getCached(appId: string): Promise<License | null>;
  
  /**
   * Check if license is expired
   */
  isExpired(license: License): boolean;
}
```

#### UpdateService

**Check and apply updates:**

```typescript
import { UpdateService } from '@antiphon/sdk';

const updates = new UpdateService({
  appId: 'melody-engine',
  currentVersion: '1.2.3'
});

// Check for updates
const update = await updates.checkForUpdate();

if (update) {
  console.log(`Update available: ${update.version}`);
  console.log(update.changelog);
}

// Download and install update (via Hub)
await updates.installUpdate(update);
```

**API:**

```typescript
export interface UpdateInfo {
  appId: string;
  version: string;
  downloadUrl: string;
  size: number;
  changelog: string;
  releaseDate: string;
  critical: boolean; // True if security fix
}

export class UpdateService {
  constructor(config: { appId: string; currentVersion: string });
  
  /**
   * Check if update available
   */
  checkForUpdate(): Promise<UpdateInfo | null>;
  
  /**
   * Download and install update (delegates to Hub)
   */
  installUpdate(update: UpdateInfo): Promise<void>;
  
  /**
   * Get update history
   */
  getUpdateHistory(): Promise<UpdateInfo[]>;
}
```

#### Logger

**Structured logging:**

```typescript
import { Logger } from '@antiphon/sdk';

const logger = new Logger({ appId: 'melody-engine' });

logger.info('App started', { version: '1.2.3' });
logger.warn('Performance slow', { duration: 5000 });
logger.error('Failed to load file', { error: err, filePath: '/path/to/file' });
```

**API:**

```typescript
export class Logger {
  constructor(config: { appId: string });
  
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  
  /**
   * Get recent logs (for support bundles)
   */
  getRecentLogs(count?: number): Promise<LogEntry[]>;
}
```

### Error Handling

**Custom error types:**

```typescript
export class HubConnectionError extends Error {
  name = 'HubConnectionError';
}

export class LicenseValidationError extends Error {
  name = 'LicenseValidationError';
}

export class UpdateError extends Error {
  name = 'UpdateError';
}
```

**Usage:**

```typescript
try {
  await hub.register();
} catch (error) {
  if (error instanceof HubConnectionError) {
    // Hub not running
    showHubNotRunningDialog();
  } else {
    // Other error
    showGenericErrorDialog(error);
  }
}
```

---

## @antiphon/music-theory Package

### Purpose

Pure music theory algorithms:
- Chord detection and analysis
- Scale detection and generation
- Key detection
- Harmony and voice leading
- Roman numeral analysis

### Installation

```bash
pnpm add @antiphon/music-theory
```

### API Reference

#### Chord Detection

```typescript
import { detectChord, getRomanNumeral } from '@antiphon/music-theory';

// Detect chord from notes
const notes = [
  { pitch: 60 }, // C
  { pitch: 64 }, // E
  { pitch: 67 }  // G
];

const chord = detectChord(notes);
console.log(chord);
// { root: 'C', quality: 'major', notes: [...] }

// Get Roman numeral
const key = { tonic: 'C', mode: 'major' };
const numeral = getRomanNumeral(chord, key);
console.log(numeral); // "I"
```

**API:**

```typescript
export interface Chord {
  root: NoteName;
  quality: ChordQuality;
  inversion: number;
  notes: Note[];
}

export type ChordQuality = 
  | 'major' 
  | 'minor' 
  | 'diminished' 
  | 'augmented' 
  | 'dominant7' 
  | 'major7' 
  | 'minor7';

/**
 * Detect chord from notes
 */
export function detectChord(notes: Note[]): Chord | null;

/**
 * Get Roman numeral for chord in key
 */
export function getRomanNumeral(chord: Chord, key: Key): string;

/**
 * Get chord tones (root, third, fifth, etc.)
 */
export function getChordTones(chord: Chord): Note[];

/**
 * Check if note is in chord
 */
export function isChordTone(note: Note, chord: Chord): boolean;
```

#### Scale Detection

```typescript
import { detectScale, getScaleNotes } from '@antiphon/music-theory';

// Detect scale from notes
const notes = [
  { pitch: 60 }, // C
  { pitch: 62 }, // D
  { pitch: 64 }, // E
  { pitch: 65 }, // F
  { pitch: 67 }, // G
  { pitch: 69 }, // A
  { pitch: 71 }  // B
];

const scale = detectScale(notes);
console.log(scale);
// { tonic: 'C', mode: 'major', notes: [...] }

// Generate scale notes
const cMajorScale = getScaleNotes('C', 'major');
console.log(cMajorScale);
// ['C', 'D', 'E', 'F', 'G', 'A', 'B']
```

**API:**

```typescript
export interface Scale {
  tonic: NoteName;
  mode: ScaleMode;
  notes: NoteName[];
  intervals: Interval[];
}

export type ScaleMode = 
  | 'major' 
  | 'minor' 
  | 'dorian' 
  | 'phrygian' 
  | 'lydian' 
  | 'mixolydian' 
  | 'aeolian' 
  | 'locrian';

/**
 * Detect scale from notes
 */
export function detectScale(notes: Note[]): Scale | null;

/**
 * Get scale notes
 */
export function getScaleNotes(tonic: NoteName, mode: ScaleMode): NoteName[];

/**
 * Check if note is in scale
 */
export function isInScale(note: Note, scale: Scale): boolean;

/**
 * Get scale degree of note
 */
export function getScaleDegree(note: Note, scale: Scale): number;
```

#### Key Detection

```typescript
import { detectKey } from '@antiphon/music-theory';

// Detect key from notes (Krumhansl-Schmuckler algorithm)
const notes = [...]; // Array of notes from MIDI file

const key = detectKey(notes);
console.log(key);
// { tonic: 'C', mode: 'major', confidence: 0.92 }
```

**API:**

```typescript
export interface Key {
  tonic: NoteName;
  mode: 'major' | 'minor';
  confidence?: number; // 0-1
}

/**
 * Detect key from notes using Krumhansl-Schmuckler algorithm
 */
export function detectKey(notes: Note[]): Key;

/**
 * Get relative major/minor
 */
export function getRelativeKey(key: Key): Key;

/**
 * Get parallel major/minor
 */
export function getParallelKey(key: Key): Key;
```

#### Harmony & Voice Leading

```typescript
import { harmonize, findVoiceLeading } from '@antiphon/music-theory';

// Harmonize melody with chords
const melody = [...]; // Array of notes
const chords = [...]; // Array of chords

const harmony = harmonize(melody, chords);
console.log(harmony); // Array of harmony notes

// Find voice leading between chords
const voiceLeading = findVoiceLeading(chord1, chord2);
console.log(voiceLeading);
// { soprano: [60, 62], alto: [57, 59], tenor: [52, 53], bass: [48, 47] }
```

**API:**

```typescript
/**
 * Harmonize melody with chord progression
 */
export function harmonize(
  melody: Note[], 
  chords: Chord[]
): Note[];

/**
 * Find voice leading between two chords
 */
export function findVoiceLeading(
  chord1: Chord, 
  chord2: Chord
): VoiceLeading;

export interface VoiceLeading {
  soprano: number[]; // MIDI pitches
  alto: number[];
  tenor: number[];
  bass: number[];
}
```

#### Utilities

```typescript
import { 
  noteNameToMidi, 
  midiToNoteName, 
  transposeNote,
  getInterval
} from '@antiphon/music-theory';

// Convert note name to MIDI pitch
const midi = noteNameToMidi('C', 4); // C4 = 60

// Convert MIDI pitch to note name
const [name, octave] = midiToNoteName(60); // ['C', 4]

// Transpose note
const transposed = transposeNote({ pitch: 60 }, 2); // Up 2 semitones

// Get interval between notes
const interval = getInterval({ pitch: 60 }, { pitch: 67 }); // 7 semitones
```

---

## @antiphon/midi-utils Package

### Purpose

MIDI file parsing and serialization:
- Read MIDI files (binary parsing)
- Write MIDI files (binary serialization)
- MIDI event handling
- Tempo, time signature, key signature

### Installation

```bash
pnpm add @antiphon/midi-utils
```

### API Reference

#### MIDI Parsing

```typescript
import { parseMidi } from '@antiphon/midi-utils';

// Parse MIDI file from ArrayBuffer
const buffer = await readBinaryFile('song.mid');
const midiData = parseMidi(buffer);

console.log(midiData);
// {
//   format: 1,
//   tracks: [...],
//   division: 480
// }
```

**API:**

```typescript
export interface MidiData {
  format: 0 | 1 | 2;
  tracks: MidiTrack[];
  division: number; // Ticks per quarter note
}

export interface MidiTrack {
  name?: string;
  events: MidiEvent[];
}

export type MidiEvent = 
  | NoteOnEvent
  | NoteOffEvent
  | TempoEvent
  | TimeSignatureEvent
  | KeySignatureEvent
  | TextEvent;

/**
 * Parse MIDI file from ArrayBuffer
 */
export function parseMidi(buffer: ArrayBuffer): MidiData;

/**
 * Get notes from track
 */
export function getNotesFromTrack(track: MidiTrack): Note[];

/**
 * Get tempo changes
 */
export function getTempoChanges(track: MidiTrack): TempoChange[];
```

#### MIDI Serialization

```typescript
import { serializeMidi } from '@antiphon/midi-utils';

// Create MIDI data
const midiData: MidiData = {
  format: 1,
  tracks: [
    {
      name: 'Melody',
      events: [...]
    }
  ],
  division: 480
};

// Serialize to ArrayBuffer
const buffer = serializeMidi(midiData);

// Write to file
await writeBinaryFile('output.mid', buffer);
```

**API:**

```typescript
/**
 * Serialize MIDI data to ArrayBuffer
 */
export function serializeMidi(data: MidiData): ArrayBuffer;

/**
 * Create MIDI track from notes
 */
export function createTrackFromNotes(
  notes: Note[], 
  trackName?: string
): MidiTrack;

/**
 * Add tempo change to track
 */
export function addTempoChange(
  track: MidiTrack, 
  time: number, 
  bpm: number
): void;

/**
 * Add time signature to track
 */
export function addTimeSignature(
  track: MidiTrack, 
  time: number, 
  numerator: number, 
  denominator: number
): void;
```

#### MIDI Events

```typescript
export interface NoteOnEvent {
  type: 'noteOn';
  deltaTime: number;
  channel: number;
  note: number;      // MIDI pitch (0-127)
  velocity: number;  // 0-127
}

export interface NoteOffEvent {
  type: 'noteOff';
  deltaTime: number;
  channel: number;
  note: number;
  velocity: number;
}

export interface TempoEvent {
  type: 'tempo';
  deltaTime: number;
  microsecondsPerBeat: number;
}

export interface TimeSignatureEvent {
  type: 'timeSignature';
  deltaTime: number;
  numerator: number;
  denominator: number;
  clocksPerClick: number;
  thirtySecondNotesPerBeat: number;
}

export interface TextEvent {
  type: 'text';
  deltaTime: number;
  text: string;
}
```

---

## @antiphon/ui-components Package

### Purpose

Shared React components:
- Buttons
- Cards
- Modals
- Forms
- Lists
- Tooltips

All components:
- Use Antiphon Design System
- Fully accessible (WCAG AA)
- Animated with Framer Motion
- TypeScript typed

### Installation

```bash
pnpm add @antiphon/ui-components framer-motion
```

### Components

#### Button

```typescript
import { Button } from '@antiphon/ui-components';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Props:**

```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Card

```typescript
import { Card } from '@antiphon/ui-components';

<Card title="App Name">
  <p>Description here</p>
</Card>
```

**Props:**

```typescript
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

#### Modal

```typescript
import { Modal } from '@antiphon/ui-components';

<Modal 
  isOpen={isOpen} 
  onClose={handleClose}
  title="Confirm Action"
>
  <p>Are you sure?</p>
  <Button onClick={handleConfirm}>Confirm</Button>
</Modal>
```

**Props:**

```typescript
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

#### Input

```typescript
import { Input } from '@antiphon/ui-components';

<Input 
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  placeholder="you@example.com"
/>
```

**Props:**

```typescript
export interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}
```

#### Select

```typescript
import { Select } from '@antiphon/ui-components';

<Select
  label="Key"
  value={selectedKey}
  onChange={setSelectedKey}
  options={[
    { value: 'C', label: 'C Major' },
    { value: 'Am', label: 'A Minor' },
    { value: 'G', label: 'G Major' }
  ]}
/>
```

**Props:**

```typescript
export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}
```

#### Tooltip

```typescript
import { Tooltip } from '@antiphon/ui-components';

<Tooltip text="This is a tooltip">
  <button>Hover me</button>
</Tooltip>
```

**Props:**

```typescript
export interface TooltipProps {
  text: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
```

---

## Shared Types

**Package:** `shared/types`

**Location:** `shared/types/` (monorepo root)

### User Types

```typescript
// shared/types/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  ownedApps: string[];
  licenses: License[];
  createdAt: Date;
}
```

### App Types

```typescript
// shared/types/App.ts
export interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  iconUrl: string;
  downloadUrl: string;
  size: number;
  status: AppStatus;
  releaseDate: string;
  changelog: string;
  requiresLicense: boolean;
}

export type AppStatus = 
  | 'available' 
  | 'installing' 
  | 'installed' 
  | 'updating' 
  | 'error';
```

### License Types

```typescript
// shared/types/License.ts
export interface License {
  key: string;
  appId: string;
  userId: string;
  expiresAt?: Date;
  createdAt: Date;
}
```

### Music Types

```typescript
// shared/types/Music.ts
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface Note {
  pitch: number;
  duration: number;
  velocity: number;
  startTime: number;
}

export interface Chord {
  root: NoteName;
  quality: ChordQuality;
  inversion: number;
  notes: Note[];
}

export type ChordQuality = 
  | 'major' 
  | 'minor' 
  | 'diminished' 
  | 'augmented' 
  | 'dominant7' 
  | 'major7' 
  | 'minor7';

export interface Key {
  tonic: NoteName;
  mode: 'major' | 'minor';
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}
```

---

## Shared Constants

**Package:** `shared/constants`

### API Endpoints

```typescript
// shared/constants/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.antiphonrecords.com';
export const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.antiphonrecords.com';
export const HUB_API_URL = 'http://localhost:3000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VALIDATE: `${API_BASE_URL}/auth/validate`
  },
  REGISTRY: {
    GET: `${API_BASE_URL}/registry`,
    UPDATES: `${API_BASE_URL}/updates`
  },
  LICENSES: {
    VALIDATE: `${API_BASE_URL}/licenses/validate`
  }
};
```

### App Config

```typescript
// shared/constants/config.ts
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export const MIDI_CONFIG = {
  TICKS_PER_QUARTER: 480,
  DEFAULT_TEMPO: 120,
  DEFAULT_VELOCITY: 80
};

export const PERFORMANCE_BUDGETS = {
  MAX_ANALYSIS_TIME: 2000, // ms
  MAX_GENERATION_TIME: 5000, // ms
  MAX_UI_FRAME_TIME: 16 // ms (60fps)
};
```

---

## Testing Standards

### Unit Tests

**Coverage target:** 80%+ for domain logic

**Framework:** Vitest

**Example:**

```typescript
// packages/music-theory/src/chords.test.ts
import { describe, it, expect } from 'vitest';
import { detectChord, getRomanNumeral } from './chords';

describe('detectChord', () => {
  it('detects C major triad', () => {
    const notes = [
      { pitch: 60 }, // C
      { pitch: 64 }, // E
      { pitch: 67 }  // G
    ];
    
    const chord = detectChord(notes);
    
    expect(chord).toEqual({
      root: 'C',
      quality: 'major',
      inversion: 0,
      notes: expect.any(Array)
    });
  });
  
  it('returns null for unrecognized chord', () => {
    const notes = [
      { pitch: 60 },
      { pitch: 61 },
      { pitch: 62 }
    ];
    
    const chord = detectChord(notes);
    
    expect(chord).toBeNull();
  });
});

describe('getRomanNumeral', () => {
  it('returns I for tonic in C major', () => {
    const chord = { root: 'C', quality: 'major' };
    const key = { tonic: 'C', mode: 'major' };
    
    const numeral = getRomanNumeral(chord, key);
    
    expect(numeral).toBe('I');
  });
  
  it('returns vi for submediant in C major', () => {
    const chord = { root: 'A', quality: 'minor' };
    const key = { tonic: 'C', mode: 'major' };
    
    const numeral = getRomanNumeral(chord, key);
    
    expect(numeral).toBe('vi');
  });
});
```

### Integration Tests

**Test services layer with mocked backends:**

```typescript
// packages/sdk/src/HubClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import { HubClient } from './HubClient';

describe('HubClient', () => {
  it('registers app with Hub', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = mockFetch;
    
    const hub = new HubClient({
      appId: 'test-app',
      version: '1.0.0'
    });
    
    await hub.register();
    
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          appId: 'test-app',
          version: '1.0.0'
        })
      })
    );
  });
});
```

---

## Documentation Standards

### JSDoc Comments

**All public APIs must have JSDoc:**

```typescript
/**
 * Detects chord from array of notes
 * 
 * Uses template matching algorithm to identify chord quality.
 * Returns null if no recognizable chord pattern found.
 * 
 * @param notes - Array of notes (MIDI pitches)
 * @returns Detected chord or null
 * 
 * @example
 * ```typescript
 * const notes = [
 *   { pitch: 60 }, // C
 *   { pitch: 64 }, // E
 *   { pitch: 67 }  // G
 * ];
 * const chord = detectChord(notes);
 * console.log(chord.root); // 'C'
 * console.log(chord.quality); // 'major'
 * ```
 */
export function detectChord(notes: Note[]): Chord | null {
  // Implementation
}
```

### README Files

**Each package must have README.md:**

```markdown
# @antiphon/music-theory

Pure music theory algorithms for chord, scale, and harmony analysis.

## Installation

```bash
pnpm add @antiphon/music-theory
```

## Usage

```typescript
import { detectChord, getRomanNumeral } from '@antiphon/music-theory';

const chord = detectChord(notes);
const numeral = getRomanNumeral(chord, key);
```

## API Reference

See [API.md](./API.md) for complete reference.

## Testing

```bash
pnpm test
```

## License

Proprietary - Antiphon Records
```

---

## Summary

**Shared packages provide:**
- `@antiphon/sdk` – Hub integration, auth, licensing
- `@antiphon/music-theory` – Chord, scale, harmony algorithms
- `@antiphon/midi-utils` – MIDI parsing, serialization
- `@antiphon/ui-components` – React components

**All packages:**
- TypeScript for type safety
- Vitest for testing (80%+ coverage)
- JSDoc for documentation
- Published to npm (private or monorepo)

**Testing standards:**
- Unit tests for domain logic
- Integration tests for services
- E2E tests for critical flows

**Documentation standards:**
- JSDoc comments on all public APIs
- README.md in each package
- API reference documents
- Usage examples

---

**END OF ANTIPHON SDK & SHARED LIBRARIES REFERENCE**
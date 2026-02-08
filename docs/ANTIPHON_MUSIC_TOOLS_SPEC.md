# Antiphon Music Tools – App Specifications

**Version 1.0 | February 2026**  
**Complete Technical Specifications for Musical Apps**

---

## Executive Summary

This document specifies the **music production tools** in the Antiphon suite:

1. **Melody Engine** – AI-powered melody generator with chord-aware harmonization
2. **Chord Analyzer** – MIDI file analyzer for chord progressions and harmonic structure
3. **Future Tools** – Extensible framework for additional music apps

All tools:
- Integrate with Antiphon Hub (authentication, updates, licensing)
- Follow the Antiphon Build Pyramid (Layer 0-8)
- Use shared design system
- Support offline operation
- Export to DAWs via MIDI

---

## Table of Contents

1. [Shared Music App Architecture](#shared-music-app-architecture)
2. [Melody Engine Specification](#melody-engine-specification)
3. [Chord Analyzer Specification](#chord-analyzer-specification)
4. [Shared SDK Integration](#shared-sdk-integration)
5. [MIDI Export Standards](#midi-export-standards)
6. [DAW Integration Guidelines](#daw-integration-guidelines)
7. [Common Music Domain Logic](#common-music-domain-logic)

---

## Shared Music App Architecture

### Common Structure

**All music tools follow this pattern:**

```
music-app/
├── src/
│   ├── components/         # React UI components
│   ├── services/           # File I/O, audio, MIDI, Hub SDK
│   ├── domain/             # Pure music theory logic
│   │   ├── chords/         # Chord detection, analysis
│   │   ├── scales/         # Scale detection, modes
│   │   ├── melody/         # Melody generation, analysis
│   │   ├── harmony/        # Harmonization logic
│   │   └── midi/           # MIDI parsing, serialization
│   ├── types/              # TypeScript interfaces
│   └── App.tsx
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   └── commands/       # Tauri commands
│   └── Cargo.toml
└── package.json
```

### Shared Domain Layer

**Music theory logic shared across apps:**

**Packages:**
- `@antiphon/music-theory` – Chord, scale, harmony logic
- `@antiphon/midi-utils` – MIDI parsing, serialization
- `@antiphon/audio-engine` – Audio playback, synthesis (future)

**Example:**

```typescript
// packages/music-theory/src/chords.ts
export interface Chord {
  root: Note;
  quality: ChordQuality;
  inversions: number;
  notes: Note[];
}

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant7' | 'major7' | 'minor7';

export function detectChord(notes: Note[]): Chord | null {
  // Pure algorithm
  // Returns detected chord or null
}

export function getRomanNumeral(chord: Chord, key: Key): string {
  // Returns Roman numeral analysis (I, IV, V, etc.)
}
```

### Hub SDK Integration

**Every app integrates with Hub:**

```typescript
// Using @antiphon/sdk
import { HubClient } from '@antiphon/sdk';

export class MusicApp {
  private hub: HubClient;
  
  constructor() {
    this.hub = new HubClient({
      appId: 'melody-engine',
      version: '1.2.3'
    });
  }
  
  async initialize() {
    // Register with Hub
    await this.hub.register();
    
    // Check license
    const isLicensed = await this.hub.validateLicense();
    if (!isLicensed) {
      this.showLicenseError();
      return;
    }
    
    // Start app
    this.start();
  }
  
  async checkForUpdates() {
    const update = await this.hub.checkUpdate();
    if (update) {
      this.showUpdateNotification(update);
    }
  }
}
```

### Common Services

**File I/O:**

```typescript
// services/fileService.ts
import { open, save } from '@tauri-apps/plugin-dialog';
import { readBinaryFile, writeBinaryFile } from '@tauri-apps/plugin-fs';

export class FileService {
  async openMidiFile(): Promise<MidiData | null> {
    const filePath = await open({
      filters: [{
        name: 'MIDI Files',
        extensions: ['mid', 'midi']
      }]
    });
    
    if (!filePath) return null;
    
    const buffer = await readBinaryFile(filePath);
    return parseMidi(buffer); // Domain function
  }
  
  async saveMidiFile(data: MidiData): Promise<void> {
    const filePath = await save({
      filters: [{
        name: 'MIDI Files',
        extensions: ['mid', 'midi']
      }]
    });
    
    if (!filePath) return;
    
    const buffer = serializeMidi(data); // Domain function
    await writeBinaryFile(filePath, buffer);
  }
}
```

**Project persistence:**

```typescript
// services/projectService.ts
export class ProjectService {
  async saveProject(project: Project): Promise<void> {
    const filePath = await save({
      filters: [{
        name: 'Antiphon Project',
        extensions: ['antiphon']
      }]
    });
    
    if (!filePath) return;
    
    const json = JSON.stringify(project, null, 2);
    await writeTextFile(filePath, json);
  }
  
  async loadProject(): Promise<Project | null> {
    const filePath = await open({
      filters: [{
        name: 'Antiphon Project',
        extensions: ['antiphon']
      }]
    });
    
    if (!filePath) return null;
    
    const json = await readTextFile(filePath);
    return JSON.parse(json);
  }
}
```

---

## Melody Engine Specification

### Product Definition (Layer 0)

**Point of the app:**
> "Generates original melodies using AI trained on music theory principles, with chord-aware harmonization and scale constraints—musicians use it for songwriting inspiration and MIDI composition."

**User outcome:**
> "A songwriter selects a key and chord progression, clicks 'Generate,' and receives 4 unique melody ideas with harmonization—exports the chosen melody to their DAW in under 2 minutes."

**Non-negotiables:**
- Generation must complete in < 5 seconds
- Melodies must be musically valid (no random notes)
- Must respect scale and chord constraints
- Must export standard MIDI files
- Must work offline (no cloud API required)

**MVP scope:**
- Select key (C, D, E♭, etc.)
- Select scale (major, minor, modes)
- Input chord progression
- Generate melody (AI-powered)
- Harmonize melody with chords
- Export to MIDI

**Later scope:**
- Real-time MIDI input
- Audio playback with instruments
- Melody variations and transformations
- Style presets (jazz, classical, pop)
- Rhythm and articulation controls

### Data Models (Layer 3)

**Project:**

```typescript
interface MelodyProject {
  id: string;
  name: string;
  key: Key;
  scale: Scale;
  chordProgression: Chord[];
  melody: Note[];
  tempo: number;
  timeSignature: TimeSignature;
}

interface Key {
  tonic: NoteName; // C, D, E, etc.
  mode: Mode;      // major, minor
}

interface Scale {
  name: string;         // "C Major", "A Minor", "D Dorian"
  notes: NoteName[];    // Scale degrees
  intervals: Interval[]; // W W H W W W H
}

interface Note {
  pitch: number;       // MIDI pitch (0-127)
  duration: number;    // Sixteenth notes (1 = 16th, 4 = quarter)
  velocity: number;    // 0-127
  startTime: number;   // Ticks from start
}
```

**Chord progression:**

```typescript
interface ChordProgression {
  chords: Chord[];
  beatsPerChord: number; // e.g., 4 beats per chord
}
```

### Domain Logic (Layer 2)

**Melody generation algorithm:**

```typescript
// domain/melody/generator.ts
export class MelodyGenerator {
  generate(params: GenerateParams): Note[] {
    const { key, scale, chordProgression, length } = params;
    
    // 1. Generate rhythm pattern
    const rhythm = this.generateRhythm(length);
    
    // 2. Choose scale degrees for each note
    const degrees = this.generateDegrees(rhythm, chordProgression, scale);
    
    // 3. Map degrees to MIDI pitches
    const notes = this.degreesToNotes(degrees, key, scale);
    
    // 4. Apply humanization (slight timing/velocity variations)
    return this.humanize(notes);
  }
  
  private generateRhythm(length: number): Duration[] {
    // Simple approach: mostly quarter and eighth notes
    // More complex: Markov chain trained on real melodies
    // AI approach: LSTM model for rhythm patterns
    
    const rhythm: Duration[] = [];
    let currentLength = 0;
    
    while (currentLength < length) {
      const duration = this.chooseRhythmValue();
      rhythm.push(duration);
      currentLength += duration;
    }
    
    return rhythm;
  }
  
  private generateDegrees(
    rhythm: Duration[], 
    chords: Chord[], 
    scale: Scale
  ): ScaleDegree[] {
    // For each note, choose scale degree that fits chord
    const degrees: ScaleDegree[] = [];
    
    for (let i = 0; i < rhythm.length; i++) {
      const currentChord = this.getChordAtPosition(i, chords);
      const degree = this.chooseDegreeFittingChord(currentChord, scale);
      degrees.push(degree);
    }
    
    return degrees;
  }
  
  private chooseDegreeFittingChord(chord: Chord, scale: Scale): ScaleDegree {
    // Prefer chord tones (root, third, fifth)
    // Weight: 70% chord tones, 30% scale tones
    
    const chordTones = this.getChordTones(chord, scale);
    const scaleTones = scale.notes;
    
    if (Math.random() < 0.7) {
      return this.randomChoice(chordTones);
    } else {
      return this.randomChoice(scaleTones);
    }
  }
}
```

**Harmonization:**

```typescript
// domain/harmony/harmonizer.ts
export class Harmonizer {
  harmonize(melody: Note[], chords: Chord[]): Note[] {
    const harmony: Note[] = [];
    
    for (const note of melody) {
      const chord = this.getChordAtTime(note.startTime, chords);
      const harmonyNote = this.findHarmonyNote(note, chord);
      if (harmonyNote) {
        harmony.push(harmonyNote);
      }
    }
    
    return harmony;
  }
  
  private findHarmonyNote(melody: Note, chord: Chord): Note | null {
    // Find closest chord tone below melody note
    const chordTones = chord.notes
      .map(n => n.pitch)
      .filter(p => p < melody.pitch)
      .sort((a, b) => b - a); // Descending
    
    if (chordTones.length === 0) return null;
    
    // Use highest chord tone below melody (typically third or fifth)
    return {
      pitch: chordTones[0],
      duration: melody.duration,
      velocity: melody.velocity * 0.8, // Softer than melody
      startTime: melody.startTime
    };
  }
}
```

### User Interface (Layer 4)

**Main screen:**

```
┌─────────────────────────────────────────┐
│  Melody Engine                [⚙️ Settings]│
├─────────────────────────────────────────┤
│                                          │
│  Key: [C Major ▼]                       │
│  Scale: [Major ▼]                       │
│  Tempo: [120] BPM                       │
│                                          │
│  Chord Progression:                     │
│  ┌────┬────┬────┬────┐                │
│  │ C  │ Am │ F  │ G  │                │
│  └────┴────┴────┴────┘                │
│  [+ Add Chord]                          │
│                                          │
│  Length: [16] bars                      │
│                                          │
│  ┌────────────────────────────┐        │
│  │  [♪ Generate Melody]       │        │
│  └────────────────────────────┘        │
│                                          │
│  Generated Melody:                      │
│  ┌────────────────────────────────┐   │
│  │  [Piano roll visualization]    │   │
│  │  ♪───♪─♪─────♪───♪─♪───       │   │
│  └────────────────────────────────┘   │
│                                          │
│  [▶️ Play] [⟲ Regenerate] [💾 Export]  │
│                                          │
└─────────────────────────────────────────┘
```

**Workflow:**
1. Select key and scale
2. Build chord progression (drag-and-drop cards)
3. Set tempo and length
4. Click "Generate Melody"
5. Preview with playback
6. Regenerate if unsatisfied
7. Export to MIDI

### Performance Budget (Layer 5)

**Targets:**
- Melody generation: < 5 seconds
- UI responsiveness: < 16ms per frame (60fps)
- MIDI export: < 1 second
- Project save/load: < 500ms

**Heavy computation:**
- Run melody generation in Web Worker (off UI thread)
- Stream audio playback (don't block on full file load)

---

## Chord Analyzer Specification

### Product Definition (Layer 0)

**Point of the app:**
> "Analyzes MIDI files to detect chord progressions, identify harmonic functions, and display Roman numeral analysis—musicians use it to understand songs faster and learn advanced music theory through real examples."

**User outcome:**
> "A music student imports a MIDI file of a song they want to learn, sees the chord progression with Roman numeral analysis, and exports the annotated MIDI to their DAW—understanding the theory in under 5 minutes."

**Non-negotiables:**
- Analysis must complete in < 2 seconds for files under 1000 notes
- Chord detection accuracy > 90% for standard progressions
- Must display Roman numeral analysis
- Must export annotated MIDI (chords as text events)
- Must work offline

**MVP scope:**
- Import MIDI files
- Detect key (major/minor)
- Detect chords
- Display Roman numeral analysis
- Show chord progression timeline
- Export to MIDI

**Later scope:**
- Real-time MIDI input
- Chord voicing analysis
- Voice leading visualization
- Modulation detection
- Borrowing and secondary dominants

### Data Models (Layer 3)

**Analysis result:**

```typescript
interface AnalysisResult {
  file: string;
  key: Key;
  chords: DetectedChord[];
  progression: ChordProgression;
  timeline: ChordTimeline;
}

interface DetectedChord {
  chord: Chord;
  startTime: number;  // Ticks
  endTime: number;
  confidence: number; // 0-1
  romanNumeral: string; // "I", "IV", "V", "vi", etc.
  function: HarmonicFunction; // Tonic, Subdominant, Dominant
}

type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant' | 'secondary' | 'borrowed';

interface ChordTimeline {
  duration: number; // Total ticks
  events: TimelineEvent[];
}

interface TimelineEvent {
  time: number;
  chord: DetectedChord;
}
```

### Domain Logic (Layer 2)

**Key detection:**

```typescript
// domain/analysis/keyDetection.ts
export function detectKey(notes: Note[]): Key {
  // Krumhansl-Schmuckler key-finding algorithm
  
  // 1. Count pitch class occurrences
  const pitchClassCounts = countPitchClasses(notes);
  
  // 2. Correlate with major/minor profiles
  const majorCorrelations = correlateWithMajorKeys(pitchClassCounts);
  const minorCorrelations = correlateWithMinorKeys(pitchClassCounts);
  
  // 3. Choose key with highest correlation
  const bestMajor = maxBy(majorCorrelations, c => c.score);
  const bestMinor = maxBy(minorCorrelations, c => c.score);
  
  return bestMajor.score > bestMinor.score ? bestMajor.key : bestMinor.key;
}

function countPitchClasses(notes: Note[]): number[] {
  const counts = new Array(12).fill(0);
  for (const note of notes) {
    const pitchClass = note.pitch % 12;
    counts[pitchClass] += note.duration * note.velocity;
  }
  return counts;
}
```

**Chord detection:**

```typescript
// domain/analysis/chordDetection.ts
export function detectChords(notes: Note[], key: Key): DetectedChord[] {
  // 1. Segment notes by time (chords likely change every 1-4 beats)
  const segments = segmentByTime(notes, 480); // 480 ticks = 1 beat
  
  // 2. For each segment, identify chord
  const chords: DetectedChord[] = [];
  
  for (const segment of segments) {
    const chord = identifyChord(segment.notes, key);
    if (chord) {
      chords.push({
        chord,
        startTime: segment.startTime,
        endTime: segment.endTime,
        confidence: chord.confidence,
        romanNumeral: getRomanNumeral(chord, key),
        function: getHarmonicFunction(chord, key)
      });
    }
  }
  
  return chords;
}

function identifyChord(notes: Note[], key: Key): Chord | null {
  // 1. Find unique pitch classes in segment
  const pitchClasses = [...new Set(notes.map(n => n.pitch % 12))];
  
  // 2. Match against chord templates
  const templates = getChordTemplates();
  let bestMatch: Chord | null = null;
  let bestScore = 0;
  
  for (const template of templates) {
    const score = matchChord(pitchClasses, template);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }
  
  return bestMatch;
}

function getRomanNumeral(chord: Chord, key: Key): string {
  // Find scale degree of chord root in key
  const degree = getScaleDegree(chord.root, key);
  
  // Major = uppercase, minor = lowercase
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const roman = numerals[degree - 1];
  
  if (chord.quality === 'minor') return roman.toLowerCase();
  if (chord.quality === 'diminished') return roman.toLowerCase() + '°';
  if (chord.quality === 'augmented') return roman + '+';
  
  return roman;
}
```

**Harmonic function:**

```typescript
// domain/analysis/harmonicFunction.ts
export function getHarmonicFunction(chord: Chord, key: Key): HarmonicFunction {
  const degree = getScaleDegree(chord.root, key);
  
  // Tonic function: I, vi, III (in major)
  if ([1, 6, 3].includes(degree)) return 'tonic';
  
  // Subdominant function: IV, ii
  if ([4, 2].includes(degree)) return 'subdominant';
  
  // Dominant function: V, vii°
  if ([5, 7].includes(degree)) return 'dominant';
  
  // Secondary dominants (V/x)
  if (chord.quality === 'dominant7') return 'secondary';
  
  return 'tonic'; // Default
}
```

### User Interface (Layer 4)

**Main screen:**

```
┌─────────────────────────────────────────┐
│  Chord Analyzer              [⚙️ Settings]│
├─────────────────────────────────────────┤
│                                          │
│  [📁 Open MIDI File]                    │
│                                          │
│  File: my-song.mid                      │
│  Key: C Major (confidence: 92%)         │
│  Duration: 32 bars                      │
│                                          │
│  ┌───────────────────────────────────┐ │
│  │  [▶️ Analyze]                     │ │
│  └───────────────────────────────────┘ │
│                                          │
│  Chord Progression:                     │
│  ┌─────────────────────────────────┐  │
│  │ Bar 1-4:   C   Am   F    G      │  │
│  │            I   vi   IV   V       │  │
│  │                                  │  │
│  │ Bar 5-8:   C   Am   Dm   G      │  │
│  │            I   vi   ii   V       │  │
│  │                                  │  │
│  │ Bar 9-12:  F   G    Em   Am     │  │
│  │            IV  V    iii  vi      │  │
│  └─────────────────────────────────┘  │
│                                          │
│  Timeline:                              │
│  ┌─────────────────────────────────┐  │
│  │  [Visual chord timeline]         │  │
│  │  ───C───Am───F───G───C─────      │  │
│  └─────────────────────────────────┘  │
│                                          │
│  [💾 Export MIDI] [📋 Copy Progression] │
│                                          │
└─────────────────────────────────────────┘
```

**Workflow:**
1. Open MIDI file
2. Click "Analyze"
3. View detected chords and Roman numerals
4. Scroll through chord progression
5. Visualize timeline
6. Export annotated MIDI (with chord markers)

### Performance Budget (Layer 5)

**Targets:**
- Key detection: < 500ms
- Chord detection: < 2 seconds for 1000 notes
- UI update: < 16ms per frame
- MIDI export: < 1 second

---

## Shared SDK Integration

### Antiphon SDK

**Package:** `@antiphon/sdk`

**Purpose:** Common functionality for all Antiphon apps (auth, updates, licensing, Hub integration).

**Files:**

```typescript
// packages/sdk/src/index.ts
export { HubClient } from './HubClient';
export { AuthService } from './auth';
export { UpdateService } from './updates';
export { LicenseService } from './licensing';
export * from './types';
```

### HubClient

```typescript
// packages/sdk/src/HubClient.ts
export interface HubClientConfig {
  appId: string;
  version: string;
  hubApiUrl?: string; // Default: http://localhost:3000
}

export class HubClient {
  private config: HubClientConfig;
  
  constructor(config: HubClientConfig) {
    this.config = config;
  }
  
  async register(): Promise<void> {
    // Register app with Hub
    const response = await fetch(`${this.hubApiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appId,
        version: this.config.version
      })
    });
    
    if (!response.ok) throw new Error('Hub registration failed');
  }
  
  async validateLicense(): Promise<boolean> {
    // Check license with Hub
    const response = await fetch(`${this.hubApiUrl}/validate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: this.config.appId })
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.valid;
  }
  
  async checkUpdate(): Promise<UpdateInfo | null> {
    const response = await fetch(`${this.hubApiUrl}/check-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appId,
        currentVersion: this.config.version
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.updateAvailable ? data.update : null;
  }
  
  private get hubApiUrl(): string {
    return this.config.hubApiUrl || 'http://localhost:3000';
  }
}
```

### Usage in Apps

```typescript
// App initialization
import { HubClient } from '@antiphon/sdk';

const hub = new HubClient({
  appId: 'melody-engine',
  version: '1.2.3'
});

async function initialize() {
  try {
    await hub.register();
    
    const isLicensed = await hub.validateLicense();
    if (!isLicensed) {
      showLicenseError();
      return;
    }
    
    startApp();
  } catch (error) {
    console.error('Initialization failed:', error);
    showErrorDialog('Failed to connect to Antiphon Hub');
  }
}
```

---

## MIDI Export Standards

### Standard MIDI Format

**Export:**
- Format 1 (multi-track)
- 480 ticks per quarter note (resolution)
- Tempo track (tempo changes, time signature)
- Note tracks (melody, harmony, chords)

**Tracks:**
1. **Tempo track** – Meta events (tempo, time signature, key signature)
2. **Melody track** – Main melody notes
3. **Harmony track** – Harmonization notes (optional)
4. **Chord track** – Chord text events (for DAW display)

### MIDI Serialization

```typescript
// domain/midi/serializer.ts
export function serializeMidi(data: MidiData): ArrayBuffer {
  const writer = new MidiWriter();
  
  // Header chunk
  writer.writeHeader({
    format: 1,
    tracks: data.tracks.length,
    division: 480
  });
  
  // Track chunks
  for (const track of data.tracks) {
    writer.writeTrack(track);
  }
  
  return writer.toBuffer();
}

class MidiWriter {
  private buffer: number[] = [];
  
  writeHeader(header: MidiHeader) {
    this.writeString('MThd');
    this.writeUint32(6); // Header length
    this.writeUint16(header.format);
    this.writeUint16(header.tracks);
    this.writeUint16(header.division);
  }
  
  writeTrack(track: MidiTrack) {
    const trackData: number[] = [];
    
    // Write track events
    for (const event of track.events) {
      this.writeEvent(trackData, event);
    }
    
    // Write track chunk
    this.writeString('MTrk');
    this.writeUint32(trackData.length);
    this.buffer.push(...trackData);
  }
  
  writeEvent(buffer: number[], event: MidiEvent) {
    // Delta time
    this.writeVarLen(buffer, event.deltaTime);
    
    if (event.type === 'noteOn') {
      buffer.push(0x90 | event.channel);
      buffer.push(event.note);
      buffer.push(event.velocity);
    } else if (event.type === 'noteOff') {
      buffer.push(0x80 | event.channel);
      buffer.push(event.note);
      buffer.push(0x40); // Default velocity
    }
    // ... more event types
  }
  
  toBuffer(): ArrayBuffer {
    return new Uint8Array(this.buffer).buffer;
  }
}
```

### Chord Text Events

**Add chord markers to MIDI:**

```typescript
// Add text event for chord
function addChordMarker(track: MidiTrack, time: number, chord: string) {
  track.events.push({
    type: 'text',
    deltaTime: time,
    text: chord // "C", "Am", "F", "G"
  });
}

// Usage:
const chords = ['C', 'Am', 'F', 'G'];
let time = 0;
for (const chord of chords) {
  addChordMarker(tempoTrack, time, chord);
  time += 1920; // 4 beats at 480 tpqn
}
```

---

## DAW Integration Guidelines

### Drag-and-Drop Export

**Recommended workflow:**
1. User generates/analyzes content
2. Clicks "Export to MIDI"
3. File saves to `~/Downloads/melody-export.mid`
4. User drags file into DAW

**Alternative:** Direct DAW integration (future, complex).

### Compatibility Testing

**Test with:**
- Logic Pro (macOS)
- Ableton Live (macOS, Windows)
- FL Studio (Windows)
- Reaper (macOS, Windows)
- Pro Tools (macOS, Windows)

**Verify:**
- MIDI file imports without errors
- Notes play at correct pitch and timing
- Chord markers display (if DAW supports text events)
- Tempo and time signature correct

---

## Common Music Domain Logic

### Shared Types

```typescript
// shared/types/music.ts
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface Note {
  pitch: number;      // MIDI pitch (0-127)
  duration: number;   // Ticks or sixteenth notes
  velocity: number;   // 0-127
  startTime: number;  // Ticks from start
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
  | 'minor7'
  | 'halfDiminished7'
  | 'diminished7';

export interface Key {
  tonic: NoteName;
  mode: 'major' | 'minor';
}

export interface TimeSignature {
  numerator: number;   // 4 in 4/4
  denominator: number; // 4 in 4/4
}
```

### Utility Functions

```typescript
// packages/music-theory/src/utils.ts
export function noteNameToMidi(name: NoteName, octave: number): number {
  const pitchClasses = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  return pitchClasses[name] + (octave + 1) * 12;
}

export function midiToNoteName(midi: number): [NoteName, number] {
  const noteNames: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  return [noteNames[pitchClass], octave];
}

export function transposeNote(note: Note, semitones: number): Note {
  return {
    ...note,
    pitch: note.pitch + semitones
  };
}

export function getInterval(note1: Note, note2: Note): number {
  return Math.abs(note1.pitch - note2.pitch);
}
```

---

## Summary

**All Antiphon music tools:**
- Integrate with Hub (auth, updates, licensing)
- Follow Build Pyramid (Layer 0-8)
- Use shared design system
- Export standard MIDI
- Separate Domain / Services / UI layers
- Work offline

**Melody Engine:**
- Generates melodies with AI
- Respects key, scale, and chord constraints
- Harmonizes automatically
- Exports MIDI for DAWs

**Chord Analyzer:**
- Detects chords in MIDI files
- Identifies key and harmonic function
- Displays Roman numeral analysis
- Exports annotated MIDI

**Shared SDK:**
- `@antiphon/sdk` – Hub integration
- `@antiphon/music-theory` – Chord, scale, harmony logic
- `@antiphon/midi-utils` – MIDI parsing, serialization

**Next steps:**
1. Build shared packages (SDK, music-theory, midi-utils)
2. Implement Melody Engine (Layer 0-8)
3. Implement Chord Analyzer (Layer 0-8)
4. Test MIDI export with major DAWs
5. Integrate with Hub

---

**END OF ANTIPHON MUSIC TOOLS SPECIFICATION**
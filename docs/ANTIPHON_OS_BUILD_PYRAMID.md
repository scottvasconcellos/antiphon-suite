# Antiphon OS – App Build Pyramid & Operating System

**Version 1.0 | February 2026**  
**Complete Build Protocol for Every Antiphon App**

---

## Executive Summary

The Antiphon OS is a disciplined, production-ready framework that prevents the three most common causes of indie app failure:

1. **Premature polish** (skin before structure)
2. **Architecture drift** (spaghetti code)
3. **Costly rewrites** (building on weak foundations)

**Core Philosophy:** Foundation → Structure → Skin (NOT Skin → Structure → Rewrite)

This is your **repeatable build protocol** used for every app forever. No exceptions.

---

## The Three Truths About App Death

Apps die from exactly 3 causes:

1. **Bad architecture** – UI contains business logic, everything breaks when you add features
2. **Unpredictable state** – user clicks fast and app behavior becomes random
3. **Performance surprises** – works fine with 10 items, dies with 1000

**NEVER from lack of visual polish.** Never.

---

## Table of Contents

1. [Quick Reference Checklist](#quick-reference-checklist)
2. [Layer 0: Product Clarity](#layer-0-product-clarity)
3. [Layer 1: Technical Foundation](#layer-1-technical-foundation)
4. [Layer 2: Architecture](#layer-2-architecture)
5. [Layer 3: Data & State Design](#layer-3-data-state-design)
6. [Layer 4: Workflow Skeleton](#layer-4-workflow-skeleton)
7. [Layer 5: Integration & Hardening](#layer-5-integration-hardening)
8. [Layer 6: Design System](#layer-6-design-system)
9. [Layer 7: Motion & Interaction Polish](#layer-7-motion-interaction-polish)
10. [Layer 8: Packaging & Release Discipline](#layer-8-packaging-release-discipline)
11. [Weekly Kill-Switch Questions](#weekly-kill-switch-questions)
12. [The Antiphon Operating System (AI Usage)](#the-antiphon-operating-system)
13. [Common Failure Patterns](#common-failure-patterns)
14. [Professional Standards](#professional-standards)

---

## Quick Reference Checklist

**Use this for EVERY app. Only proceed to next layer when all boxes are checked.**

### ☐ Layer 0: Product Clarity (NO CODE YET)

**Icon: 🎯 Target**

- [ ] Point of the app defined (1-3 sentences)
- [ ] Non-negotiables documented (latency, offline/online, licensing)
- [ ] MVP scope vs. later scope clearly separated
- [ ] User outcome statement written
- [ ] Acceptance criteria defined (human-readable tests)
- [ ] Kill List created (what we are NOT building)

**Key Question:** *If this shipped today, what problem disappears for the user?*

---

### ☐ Layer 1: Technical Foundation

**Icon: ⚙️ Gear**

- [ ] Repo structure decided (monorepo vs. multi-repo)
- [ ] Packaging strategy defined (installer, code signing)
- [ ] Versioning strategy established (SemVer)
- [ ] CI/CD pipeline configured
- [ ] Environment setup documented
- [ ] Shared SDK/libraries identified
- [ ] Build system configured and tested
- [ ] Can ship safely (yes/no)

**Key Question:** *Can a new developer clone and build in under 30 minutes?*

---

### ☐ Layer 2: Architecture (MOST CRITICAL)

**Icon: 🏗️ Building Blocks**

- [ ] Domain layer designed (pure business logic, no UI)
- [ ] Services layer designed (filesystem, audio, network, persistence)
- [ ] UI layer designed (presentation only)
- [ ] Separation of concerns enforced
- [ ] Dependency boundaries defined
- [ ] Interfaces/contracts documented
- [ ] Anti-God-File principles applied
- [ ] Testability verified

**Golden Rule:** UI must NOT contain business logic.

**Key Question:** *Can I test core logic without running the UI?*

---

### ☐ Layer 3: Data & State Design

**Icon: 🗄️ Database**

- [ ] Data models/schemas defined
- [ ] Project file format designed
- [ ] Serialization strategy chosen
- [ ] State machine/reducer model implemented
- [ ] Deterministic behavior verified
- [ ] Undo/redo model designed
- [ ] Persistence strategy documented
- [ ] Migration plan created

**Key Question:** *Can I predict exactly what happens when the user clicks something?*

---

### ☐ Layer 4: Workflow Skeleton (UGLY FIRST PASS)

**Icon: 🖼️ Wireframe**

- [ ] End-to-end flow implemented (import → process → export)
- [ ] Navigation structure complete
- [ ] Screen map documented
- [ ] Happy path functional
- [ ] Error states displayed
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Functional prototype working (boring UI acceptable)

**Principle:** Ugly but correct > Beautiful but fragile

**Key Question:** *Can a user complete the full workflow without help?*

---

### ☐ Layer 5: Integration & Hardening

**Icon: 🔒 Shield**

- [ ] Performance budget defined
- [ ] Latency targets met
- [ ] Threading/workers implemented (heavy compute off UI thread)
- [ ] Memory safety verified
- [ ] Large file handling tested
- [ ] Crash recovery implemented
- [ ] Logging system configured
- [ ] Telemetry planned (optional)
- [ ] Retry logic implemented
- [ ] Input validation complete

**Key Question:** *Could a professional rely on this mid-session?*

---

### ☐ Layer 6: Design System

**Icon: 🎭 Palette**

- [ ] Design tokens defined (colors, spacing, typography)
- [ ] Typography scale established
- [ ] Spacing system documented
- [ ] Component library created
- [ ] Visual hierarchy defined
- [ ] Contrast rules verified (WCAG AA minimum)
- [ ] Accessibility features implemented
- [ ] Interaction consistency enforced

**Principle:** Single source of truth for all UI elements

**Key Question:** *Could I build a new app using only these components?*

---

### ☐ Layer 7: Motion & Interaction Polish (LAST)

**Icon: 🌊 Motion Wave**

- [ ] Motion language defined
- [ ] Weighted animations implemented
- [ ] Physicality/restraint principles applied
- [ ] Framer Motion presets configured
- [ ] Layout transitions smooth
- [ ] Microinteractions refined
- [ ] Tactility verified

**Warning:** If you're adding animations before Layers 1-6 are complete, you're procrastinating.

**Key Question:** *Does motion serve utility or just look pretty?*

---

### ☐ Layer 8: Packaging & Release Discipline

**Icon: 🚀 Rocket**

- [ ] Release pipeline configured
- [ ] Auto-update strategy implemented (Hub-managed)
- [ ] Installer QA completed
- [ ] Backward compatibility tested
- [ ] Data migration tested
- [ ] Support bundle export created (logs + version info)
- [ ] Error codes standardized
- [ ] Rollback plan documented

**Key Question:** *Can I push an update without fear?*

---

## Layer 0: Product Clarity (NO CODE YET)

### Purpose

Define what problem disappears for the user when this ships today.

⚠️ **Warning:** Most indie apps fail because this layer is fuzzy.

### Why This Matters

Before writing a single line of code, you must be able to answer:

> *"If this shipped today, what problem disappears for the user?"*

Without product clarity, you'll build beautiful solutions to problems that don't exist, or solve the wrong problem entirely.

### Key Deliverables

#### 1. Point of the App (1-3 Sentences)

What does this app do, and why does it exist?

**Example (Music Theory Tool):**
> "Analyzes chord progressions in MIDI files and identifies scale degrees, functional harmony, and voice leading. Musicians use it to understand songs faster and learn advanced theory through real examples."

**Example (Hub):**
> "Manages installation, updates, and licensing for all Antiphon tools. Users authenticate once, see owned products, and install/launch apps from one place—like iZotope Product Portal but for Antiphon suite."

#### 2. Non-Negotiables

Technical and business constraints that cannot be compromised.

**Examples:**
- Analysis must complete in < 2 seconds for files under 1000 notes
- Must work offline (no internet required for core function)
- Must support perpetual license (no subscription)
- Must integrate with DAWs via MIDI export
- Hub compatibility required (registry + SDK compliance)

#### 3. MVP Scope (Must Ship) vs. Later Scope

Draw a clear line between what's required for launch and what can come later.

**MVP:**
- Import MIDI files
- Detect key and chords
- Display analysis results
- Export to MIDI

**Later:**
- Real-time MIDI input
- Audio file analysis
- Chord library/database
- AI-powered suggestions

#### 4. User Outcome Statement

What does the user achieve after using this app?

**Example:**
> "A musician imports a MIDI file of a song they want to learn, sees the chord progression with Roman numeral analysis, and exports the annotated MIDI to their DAW—understanding the theory in under 5 minutes."

#### 5. Acceptance Criteria (Human-Readable Tests)

Specific, testable conditions that define success.

**Examples:**
- Given a MIDI file in C major, when analyzed, the app identifies I, IV, V, vi chords correctly
- Given a file with 500 notes, when analyzed, results display in under 1 second
- Given an analyzed project, when exported, the MIDI file opens correctly in Logic Pro
- Given invalid Tauri environment, when launched, app shows clear refusal message (not a crash)

#### 6. Kill List (What We Are NOT Building)

Explicitly state what's out of scope to prevent feature creep.

**Examples:**
- NOT a DAW or audio editor
- NOT a chord library or educational content platform
- NOT a real-time performance tool
- NOT cloud-based or collaborative
- NOT a browser app or web service

### Layer 0 Reality Rules (From Your Questionnaire)

**Environment Invariants:**
- Desktop app only (Tauri/Electron substrate required)
- Browser ≠ valid runtime
- Dev server ≠ valid runtime
- CI/browser previews ≠ valid runtime

**Partial Functionality:**
- Not acceptable at Layer 0
- No "half-alive" UI, no "some things work"
- If foundation is wrong, app must stop talking

**Mocking:**
- No mock data or mock runtime allowed at Layer 0
- Mock mode is Layer 1+ opt-in, never automatic fallback

**Missing Substrate:**
- Hard stop with explicit message
- No retries pretending it might fix itself
- Failure is honesty, not error

**Automation:**
- Never allowed to bypass Layer 0
- Encountering Layer 0 refusal = SKIP status, not PASS
- Green tests that lie = broken Layer 0

**Who Layer 0 is for:**
- The system itself
- App must know what it is before anyone else does

**Success Definition:**
- Truthful self-assessment
- Correct refusal when appropriate
- A refused startup can be a Layer 0 pass

**Single-sentence invariant:**
> "If this app ever runs in an environment it does not fully understand and explicitly accept, it is already broken."

### Validation Questions

Before moving to Layer 1, answer these:

1. Can I explain this app's value in one sentence?
2. Have I identified the exact user pain point?
3. Do I know what "done" looks like for MVP?
4. Have I eliminated unnecessary features?
5. Would I pay for this if someone else built it?
6. Does my Layer 0 reality check pass (environment valid)?

**Exit Criteria:** All deliverables documented and validated with at least one potential user. Layer 0 reality rules enforced.

---

## Layer 1: Technical Foundation

### Purpose

Can we build, run, and package this reliably?

### Keywords

Repo Structure, Monorepo, Packaging, Code Signing, Installer, Versioning, CI/CD, Environment Setup, Shared SDK

### Why This Matters

This is the unglamorous infrastructure work that separates hobby projects from real software companies. You can't ship confidently without it.

### Key Decisions

#### 1. Repository Strategy

**Option A: Monorepo (Recommended for Antiphon Suite)**

All apps (Hub + tools) in one repository with shared code.

**Pros:**
- Easier to share UI components and utilities
- Atomic commits across apps
- Simpler dependency management
- One CI pipeline
- Shared types prevent API mismatches

**Cons:**
- Larger repository size
- Requires build system that handles multiple packages (Nx, Turborepo, or pnpm workspaces)

**Structure:**
```
antiphon-suite/
├── packages/
│   ├── hub/              # Hub manager app
│   ├── melody-engine/    # Music tool 1
│   ├── chord-analyzer/   # Music tool 2
│   ├── sdk/              # Shared client SDK
│   └── ui-components/    # Shared React components
├── shared/
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Common utilities
│   └── constants/        # API endpoints, config
├── docs/                 # This file and others
└── package.json          # Root workspace config
```

**Option B: Multi-Repo**

Separate repository for each app, with shared "Antiphon SDK" as dependency.

**Pros:**
- Independent versioning
- Clearer ownership boundaries

**Cons:**
- Harder to coordinate changes across apps
- Dependency version conflicts

**For Antiphon Suite:** Use monorepo. The tight integration (Hub + apps + SDK) makes this the only sane choice.

#### 2. Build System & Tooling

**Recommended Stack:**
- **React + Vite** for all apps (fast, modern, lightweight)
- **TypeScript** for type safety
- **pnpm workspaces** (or Turborepo) for monorepo management
- **Tauri** for desktop packaging (Rust backend, smaller than Electron)
- **Vitest** for unit tests
- **Playwright** for E2E tests

**Build Commands:**
```bash
# Install all dependencies
pnpm install

# Build all apps
pnpm run build

# Build specific app
pnpm --filter @antiphon/hub build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

#### 3. Versioning Strategy

**SemVer for all packages:**
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

**Independent versioning:**
- Hub and each app version independently
- SDK has its own version
- Apps declare SDK version compatibility in manifest

#### 4. CI/CD Pipeline

**GitHub Actions workflow:**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm build
```

**Quality gates:**
- All tests pass
- Linting clean
- Type checking passes
- Build succeeds

#### 5. Code Signing & Distribution

**macOS:**
- Apple Developer account required
- Certificate: "Developer ID Application"
- Notarization via Apple
- Distribute as signed `.dmg`

**Windows:**
- Code signing certificate (from DigiCert, Sectigo, etc.)
- Sign `.exe` installer
- Optional: Microsoft Store submission

**Cost:** ~$99/year Apple, ~$200-400/year Windows cert

#### 6. Hub Compatibility Requirements

Every app must:
- Register with Hub via `/register` API endpoint
- Include `manifest.json` with app metadata
- Support Hub SDK for auth/updates
- Follow shared API versioning

**Add to Layer 1 checklist:**
- [ ] App manifest.json created
- [ ] Hub SDK integrated
- [ ] Registry schema followed

### Key Questions

1. Can a new developer clone and build in under 30 minutes?
2. Does CI catch breaking changes before merge?
3. Can we produce signed builds for both platforms?
4. Is the Hub SDK integration documented?

### Exit Criteria

- `pnpm install` and `pnpm build` work from clean clone
- CI pipeline is green
- You can produce a signed dev build on macOS and Windows
- Hub compatibility verified (if applicable)

---

## Layer 2: Architecture (MOST CRITICAL)

### Purpose

Separate **what the app does** from **how it looks**.

⚠️ **If this layer is wrong, you WILL rewrite the app later.**

### The Golden Rule

**UI must NOT contain business logic.**

This is non-negotiable. If you violate this, everything else falls apart.

### Standard 3-Layer Pattern

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - Components / screens             │
│  - Presentation logic only          │
│  - NO business logic                │
└──────────────┬──────────────────────┘
               │ calls
               ▼
┌─────────────────────────────────────┐
│      Services Layer                 │
│  - Filesystem, audio, network       │
│  - Persistence, platform APIs       │
│  - Adapters to external systems     │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│       Domain Layer                  │
│  - Pure business logic              │
│  - NO framework imports             │
│  - NO UI, NO file I/O               │
│  - 100% testable headless           │
└─────────────────────────────────────┘
```

**Dependency arrows:**
- UI → Services → Domain (allowed)
- UI → Domain (allowed, for simple cases)
- Domain → UI (❌ NEVER)
- Domain → Services (❌ NEVER; services call domain, not vice versa)

### Domain Layer

**Purpose:** Pure business logic.

**Rules:**
- No React imports
- No file I/O
- No network calls
- No DOM access
- No framework dependencies

**Contains:**
- Algorithms (chord detection, scale analysis, etc.)
- Validators (input validation logic)
- Calculations (BPM, key detection, etc.)
- Business rules (licensing checks, feature flags)

**Example:**

```typescript
// domain/chordAnalyzer.ts
export function detectChords(notes: Note[]): Chord[] {
  // Pure algorithm - no side effects
  // 100% testable
}

export function getRomanNumeral(chord: Chord, key: Key): string {
  // Pure logic
}
```

**Test:**

```typescript
// domain/chordAnalyzer.test.ts
test('detects C major triad', () => {
  const notes = [new Note('C'), new Note('E'), new Note('G')];
  const chords = detectChords(notes);
  expect(chords[0].name).toBe('C major');
});
```

### Services Layer

**Purpose:** Bridge between domain and outside world.

**Contains:**
- File system access
- Audio processing APIs
- Network requests
- Local storage / IndexedDB
- Platform-specific code (Tauri APIs)

**Example:**

```typescript
// services/fileService.ts
export class FileService {
  async loadMidiFile(path: string): Promise<MidiData> {
    // Platform-specific I/O
    const buffer = await Tauri.fs.readBinaryFile(path);
    return parseMidi(buffer); // calls domain parser
  }
}
```

### UI Layer

**Purpose:** Presentation only.

**Rules:**
- React components for display
- Event handlers that call services/domain
- NO business logic in components
- State management for UI state only (not domain state)

**Example:**

```typescript
// ui/components/ChordDisplay.tsx
export function ChordDisplay({ filePath }: Props) {
  const [chords, setChords] = useState<Chord[]>([]);
  
  async function analyze() {
    const midi = await fileService.loadMidiFile(filePath);
    const detectedChords = detectChords(midi.notes); // domain
    setChords(detectedChords);
  }
  
  return (
    <div>
      <button onClick={analyze}>Analyze</button>
      {chords.map(c => <ChordCard chord={c} />)}
    </div>
  );
}
```

### Anti-God-File Principles

**Target:** <300-400 lines per module

**Warning signs of God files:**
- Single file > 800 lines
- Mixes UI + logic + I/O
- Many unrelated functions
- Hard to test

**Fix:** Break into smaller modules by responsibility.

### Interfaces & Contracts

Document boundaries between layers:

```typescript
// types/services.ts
export interface FileService {
  loadMidiFile(path: string): Promise<MidiData>;
  saveMidiFile(path: string, data: MidiData): Promise<void>;
}

// types/domain.ts
export interface ChordAnalyzer {
  detectChords(notes: Note[]): Chord[];
  getRomanNumeral(chord: Chord, key: Key): string;
}
```

### Testability Check

**Can you test domain logic without:**
- Starting the app UI?
- Touching the filesystem?
- Making network requests?

If NO → architecture is wrong. Fix it now.

### Key Questions

1. Can I test core logic without running the UI?
2. Can I swap storage implementation without touching domain?
3. Are there any import cycles?
4. Is any component over 400 lines?

### Exit Criteria

- Domain layer has unit tests (80%+ coverage)
- Changing file format or network client does NOT require touching domain
- No circular imports
- No God files (all modules <500 lines)

---

## Layer 3: Data & State Design

### Purpose

Make the app predictable. Same input + same prior state = same result.

### Why This Matters

Unpredictable state is the #2 app killer (after bad architecture).

If you can't predict what happens when user clicks fast, your state model is broken.

### Key Deliverables

#### 1. Data Models / Schemas

Define your core data structures.

**Example (Music app):**

```typescript
interface Project {
  id: string;
  name: string;
  key: Key;
  timeSignature: TimeSignature;
  tempo: number;
  tracks: Track[];
}

interface Track {
  id: string;
  name: string;
  notes: Note[];
  chords: Chord[];
}
```

#### 2. Project File Format

**JSON schema:**

```json
{
  "version": "1.0.0",
  "project": {
    "id": "abc123",
    "name": "My Song",
    "key": "C",
    "tempo": 120,
    "tracks": [...]
  }
}
```

**Migration plan:**
- Version field required
- Migration scripts for breaking changes
- Backward compatibility for at least 2 major versions

#### 3. State Machine

Define clear states and transitions.

**Example (File loading):**

```typescript
type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; data: Project }
  | { status: 'error'; error: Error };
```

**Transitions:**
- `idle` → `loading` (user clicks "Open")
- `loading` → `success` (file loaded)
- `loading` → `error` (file invalid)
- `success` → `loading` (user clicks "Open" again)
- `error` → `loading` (user retries)

**Invalid transitions:**
- `success` → `idle` (not possible, can only load new file)
- `loading` → `idle` (cancel might allow this)

#### 4. Deterministic Behavior

**Test:** Given same input sequence, app produces same result every time.

**Example:**

```typescript
test('chord analysis is deterministic', () => {
  const notes = [C4, E4, G4];
  
  const result1 = detectChords(notes);
  const result2 = detectChords(notes);
  
  expect(result1).toEqual(result2); // Must be identical
});
```

#### 5. Undo/Redo Model

**For apps with editing:**

```typescript
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function undo<T>(history: HistoryState<T>): HistoryState<T> {
  const [present, ...past] = history.past;
  return {
    past,
    present,
    future: [history.present, ...history.future]
  };
}
```

#### 6. Persistence Strategy

**Options:**
- Local file (JSON, binary)
- IndexedDB (browser storage, but Layer 0 forbids browser)
- SQLite (desktop apps)

**For Antiphon apps:**
- Hub uses local registry (JSON or SQLite)
- Tools save projects as `.antiphon` files (JSON)

### Key Questions

1. Can I predict exactly what happens when user clicks something?
2. Is state serializable (can I save/load it)?
3. Can I implement undo/redo easily?
4. Are there any race conditions (async state updates)?

### Exit Criteria

- State machine documented
- Same input always produces same output
- Project file format specified
- Migration plan exists for future schema changes

---

## Layer 4: Workflow Skeleton (UGLY FIRST PASS)

### Purpose

Prove the entire user journey with boring UI.

### The Mantra

**Ugly but correct > Beautiful but fragile**

### Why This Matters

Most devs panic at this stage and jump to making it pretty. Don't.

You need to prove the **flow works** before making it beautiful.

### Key Deliverables

#### 1. End-to-End Flow

User can complete primary task start-to-finish.

**Example (Music analysis tool):**
1. Click "Open File" → file picker appears
2. Select MIDI file → file loads
3. Click "Analyze" → chords detected
4. Click "Export" → MIDI saved

**Build this with:**
- Unstyled buttons (`<button>Open File</button>`)
- Plain lists (`<ul><li>Chord: C major</li></ul>`)
- Basic layout (no fancy CSS)

#### 2. Navigation Structure

All screens accessible.

**Example:**
- Home screen
- Analysis screen
- Settings screen
- About screen

**Navigation works:**
- [ ] Can reach every screen
- [ ] Back button works
- [ ] Deep linking works (if applicable)

#### 3. Screen Map

Document all screens and their connections.

```
Home
├─ Open File → Analysis
├─ Settings
└─ About

Analysis
├─ Export → Save dialog
└─ Back → Home
```

#### 4. Happy Path Functional

Primary user journey works without errors.

**Test by:**
- Following the flow manually
- Having someone else try it (don't help them)

#### 5. Error States

What happens when things go wrong?

**Examples:**
- File is invalid → show error message
- Analysis fails → show retry button
- Network timeout → show offline indicator

**Build these now** (even with ugly UI):

```typescript
{error && (
  <div style={{color: 'red'}}>
    Error: {error.message}
    <button onClick={retry}>Retry</button>
  </div>
)}
```

#### 6. Loading States

What happens during async operations?

```typescript
{loading && <div>Loading...</div>}
```

#### 7. Empty States

What shows when there's no data?

```typescript
{chords.length === 0 && (
  <div>No chords detected. Try a different file.</div>
)}
```

### What This Should Look Like

**It should be UGLY:**
- Black text on white background
- Unstyled buttons
- Basic layout (no grid, no fancy spacing)
- No animations
- No icons

**But it should be COMPLETE:**
- Every button does something
- Every screen is reachable
- Errors are caught and displayed
- User can accomplish their goal

### Common Mistakes

❌ Adding visual polish at this stage  
❌ Spending time on animations  
❌ Tweaking spacing and colors  
❌ Designing custom components  

✅ Proving the flow works  
✅ Getting user feedback on workflow  
✅ Identifying missing steps  

### Key Questions

1. Can a user complete the full workflow without help?
2. Are all screens accessible?
3. Do errors display clearly?
4. Can I demo this to a user (ignoring ugly UI)?

### Exit Criteria

- Full workflow works end-to-end
- All screens exist and are connected
- Error/loading/empty states visible
- User can complete primary task (ugly UI is fine)

---

## Layer 5: Integration & Hardening

### Purpose

Turn a prototype into a tool a professional can rely on mid-session.

### The Question

**Could a professional rely on this mid-session without fear?**

If the answer is "no," you're not ready for design polish.

### Key Deliverables

#### 1. Performance Budget

Define acceptable performance for key operations.

**Examples:**
- File load: <500ms for files under 10MB
- Analysis: <2s for 1000 notes
- Export: <1s for typical project
- UI responsiveness: <16ms per frame (60fps)

**Measure with:**
- `console.time()` / `console.timeEnd()`
- Chrome DevTools Performance tab
- Profiling tools

#### 2. Latency Targets Met

Test with realistic data:
- Large files (1000+ items)
- Worst-case scenarios
- Slow machines (not just your dev MacBook)

**If targets not met:**
- Profile to find bottleneck
- Optimize that specific code
- Consider Web Workers for heavy computation

#### 3. Threading / Workers

**Rule:** Heavy computation off UI thread.

**Use Web Workers for:**
- File parsing (large MIDI files)
- Audio analysis
- Complex calculations

**Example:**

```typescript
// worker.ts
self.onmessage = (e) => {
  const result = expensiveAnalysis(e.data);
  self.postMessage(result);
};

// main.ts
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.onmessage = (e) => setResult(e.data);
```

#### 4. Memory Safety

**Watch for:**
- Memory leaks (unused event listeners)
- Large objects in memory
- Circular references

**Test:**
- Open/close files repeatedly
- Check memory usage in DevTools
- Ensure garbage collection happens

#### 5. Large File Handling

**Test with:**
- 10x typical file size
- Malformed files
- Files with unexpected data

**Graceful degradation:**
- Show warning for very large files
- Stream processing if possible
- Offer to cancel long operations

#### 6. Crash Recovery

**Implement:**
- Auto-save (every 30s)
- Recovery on restart
- Clear error messages (not "Oops!")

**Example:**

```typescript
window.addEventListener('beforeunload', () => {
  localStorage.setItem('autosave', JSON.stringify(project));
});

// On startup:
const saved = localStorage.getItem('autosave');
if (saved) {
  showRecoveryDialog();
}
```

#### 7. Logging System

**Log:**
- Errors with stack traces
- User actions (for debugging)
- Performance metrics

**Use structured logging:**

```typescript
logger.info('File loaded', { filename, size, duration });
logger.error('Analysis failed', { error, context });
```

#### 8. Retry Logic

For network operations:

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

#### 9. Input Validation

**Validate:**
- File types (not just extension)
- File size (before loading)
- Data structure (schema validation)
- User input (forms, text fields)

**Example:**

```typescript
function validateMidiFile(buffer: ArrayBuffer): Result<MidiData> {
  if (buffer.byteLength === 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (!isMidiHeader(buffer)) {
    return { ok: false, error: 'Not a valid MIDI file' };
  }
  return { ok: true, data: parseMidi(buffer) };
}
```

### Performance Checklist

- [ ] Large files (10x normal size) don't freeze UI
- [ ] Analysis completes within budget
- [ ] Memory usage stable over time
- [ ] No memory leaks
- [ ] Heavy work happens in workers
- [ ] App recovers from crashes
- [ ] Errors logged with context
- [ ] Retry logic for network operations
- [ ] Input validated before processing

### Key Questions

1. Could a professional rely on this mid-session?
2. Does it handle errors gracefully?
3. Is performance acceptable with realistic data?
4. Can users recover from crashes?

### Exit Criteria

- Performance budget met for all key operations
- Large files handled without freezing
- Crash recovery works
- Logging captures errors with context
- Input validation prevents bad data

---

## Layer 6: Design System

### Purpose

Build a **single source of truth** for UI that works across all apps.

### The Principle

**Build once, use everywhere.**

Every Antiphon app shares the same design system. This is non-negotiable.

### Key Deliverables

#### 1. Design Tokens

**Colors:**

```css
:root {
  /* Backgrounds */
  --color-bg-primary: #000000;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #333333;
  
  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  
  /* Borders */
  --color-border: #666666;
  
  /* Accents (musical UI only) */
  --color-accent-gold: #fbbf24;
  --color-accent-blue: #60a5fa;
  --color-accent-red: #fca5a5;
}
```

**Spacing:**

```css
:root {
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
}
```

#### 2. Typography Scale

**Font family:**

```css
:root {
  --font-family: Inter, -apple-system, sans-serif;
}
```

**Scale:**

```css
.text-xs   { font-size: 0.75rem; }  /* 12px */
.text-sm   { font-size: 0.875rem; } /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg   { font-size: 1.125rem; } /* 18px */
.text-xl   { font-size: 1.25rem; }  /* 20px */
.text-2xl  { font-size: 1.5rem; }   /* 24px */
.text-3xl  { font-size: 1.875rem; } /* 30px */
.text-4xl  { font-size: 2.25rem; }  /* 36px */
```

**Weights:**

```css
.font-normal   { font-weight: 400; }
.font-medium   { font-weight: 500; }
.font-semibold { font-weight: 600; }
```

#### 3. Component Library

Build reusable components:

**Button:**

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size = 'md', children, onClick }: ButtonProps) {
  return (
    <button 
      className={`btn btn--${variant} btn--${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Card:**

```typescript
export function Card({ title, children }: CardProps) {
  return (
    <div className="app-card">
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}
```

**Modal:**

```typescript
export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
```

#### 4. Visual Hierarchy

**Establish clear hierarchy:**
- Primary actions: Black buttons with white text
- Secondary actions: Gray buttons
- Destructive actions: Red border/text on hover
- Text hierarchy: Bold headings, regular body

#### 5. Contrast Rules (WCAG AA)

**Minimum contrast ratios:**
- Body text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Test with:**
- Chrome DevTools Accessibility panel
- WebAIM Contrast Checker

#### 6. Accessibility Features

**Keyboard navigation:**
- [ ] All interactive elements tabbable
- [ ] Focus visible (outline or ring)
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons

**Screen readers:**
- [ ] Alt text on images
- [ ] ARIA labels on icon buttons
- [ ] Landmark regions (main, nav, header)

**Focus management:**
- [ ] Focus trapped in modals
- [ ] Focus returns to trigger after close
- [ ] Skip links for main content

### Shared Component Package

**Create `@antiphon/ui-components` package:**

```typescript
// packages/ui-components/src/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Modal } from './Modal';
// ... more components
```

**Use in apps:**

```typescript
import { Button, Card, Modal } from '@antiphon/ui-components';
```

### Key Questions

1. Could I build a new app using only these components?
2. Is contrast sufficient for readability?
3. Can I navigate the app with keyboard only?
4. Do all apps look consistent?

### Exit Criteria

- Design tokens defined and documented
- Component library with 10+ reusable components
- Accessibility tested (keyboard nav, screen reader)
- WCAG AA contrast ratios met
- All apps use the same design system

---

## Layer 7: Motion & Interaction Polish (LAST)

### Purpose

Add life, weight, and tactile feel—only after behavior is solid.

⚠️ **Warning:** If you're here before Layers 1-6 are complete, you're procrastinating with aesthetics.

### The Antiphon Motion Philosophy

From the animation system document:

**Guiding principles:**
- Motion is **purposeful, weighted, restrained**
- Evokes analog equipment (heavy switches, smooth dials)
- No flashy gimmicks, no cartoonish bounces
- Animations serve utility, not decoration

### Key Animation Presets

(See `ANTIPHON_ANIMATION_SYSTEM.md` for full details)

**Card entrance:**
- Grows from top-left (scale 0.8 → 1.0)
- Spring physics with gentle overshoot
- ~300-400ms duration

**Tooltip:**
- Fast fade + slide (150-200ms)
- Appears near trigger element

**Modal:**
- Slower entrance (350ms)
- Fade + subtle scale
- Overlay fade-in

**Button press:**
- Slight scale down (0.98)
- Immediate feedback (<100ms)

### Framer Motion Implementation

**Define presets:**

```typescript
// motionPresets.ts
export const cardVariant = {
  hidden: { opacity: 0, scale: 0.8, originX: 0, originY: 0 },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { type: 'spring', stiffness: 120, damping: 20 }
  }
};

export const tooltipVariant = {
  hidden: { opacity: 0, y: 4 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' }
  }
};
```

**Use in components:**

```typescript
import { motion } from 'framer-motion';
import { cardVariant } from './motionPresets';

export function Card({ children }: Props) {
  return (
    <motion.div 
      className="app-card"
      variants={cardVariant}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
```

### Timing Standards

**By element weight:**
- Small/light (icons, tooltips): 150-200ms
- Medium (cards, buttons): 200-300ms
- Large (modals, panels): 300-400ms

**Never exceed 500ms** for UI animations (feels sluggish).

### Microinteractions

**Button press:**

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.1 }}
>
  Click me
</motion.button>
```

**Hover effects:**

```css
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
}
```

### Layout Transitions

**AnimatePresence for enter/exit:**

```typescript
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Sound Design (Optional)

Add subtle UI sounds:
- Button click: soft mechanical click
- Modal open: gentle "whoosh"
- Error: subtle alert tone

**Keep sounds:**
- Very quiet (< -20dB)
- Short (< 200ms)
- Optional (user can disable)

### Key Questions

1. Does motion serve utility or just look pretty?
2. Are animations fast enough (no sluggishness)?
3. Is motion consistent across all screens?
4. Can motion be reduced/disabled for accessibility?

### Exit Criteria

- Motion presets defined and implemented
- All transitions use standard timing
- Microinteractions polished (hover, press, drag)
- Motion can be disabled (prefers-reduced-motion)
- No animation exceeds 400ms

---

## Layer 8: Packaging & Release Discipline

### Purpose

Become a company, not just a coder.

### The Question

**Can we push an update without fear?**

If not, this layer isn't done.

### Key Deliverables

#### 1. Release Pipeline

**Automated build on tag:**

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm tauri build
      - uses: actions/upload-artifact@v3
        with:
          name: app-${{ matrix.os }}
          path: src-tauri/target/release/bundle/*
```

#### 2. Auto-Update Strategy (Hub-Managed)

**For Antiphon suite:**
- Hub checks for updates (not individual apps)
- Hub downloads and installs updates
- Apps register their version with Hub

**Update flow:**
1. User opens Hub
2. Hub pings update server
3. Shows available updates
4. User clicks "Update All"
5. Hub downloads packages
6. Hub installs updates
7. Hub relaunches apps if open

#### 3. Installer QA Checklist

**macOS:**
- [ ] `.dmg` opens without errors
- [ ] App drags to Applications folder
- [ ] App launches after install
- [ ] Uninstall removes all files
- [ ] Notarization passes
- [ ] Gatekeeper allows launch

**Windows:**
- [ ] `.exe` installer runs
- [ ] App appears in Start Menu
- [ ] Uninstaller works
- [ ] No antivirus false positives
- [ ] Signed with valid certificate

#### 4. Backward Compatibility

**Rules:**
- Support projects from last 2 major versions
- Migration scripts for breaking changes
- Clear deprecation warnings

**Test:**
- Open projects from v1.0 in v2.0
- Ensure data migrates correctly
- No data loss

#### 5. Data Migration

**Schema versioning:**

```typescript
interface ProjectV1 {
  version: '1.0.0';
  data: { /* ... */ };
}

interface ProjectV2 {
  version: '2.0.0';
  data: { /* new fields */ };
}

function migrate(project: ProjectV1): ProjectV2 {
  return {
    version: '2.0.0',
    data: {
      ...project.data,
      newField: defaultValue
    }
  };
}
```

#### 6. Support Bundle

**Export diagnostic info:**

```typescript
function generateSupportBundle() {
  return {
    app: {
      name: 'Antiphon Hub',
      version: '1.2.3',
      build: 'a1b2c3d'
    },
    system: {
      os: 'macOS 13.4',
      arch: 'arm64',
      memory: '16GB'
    },
    logs: recentLogs,
    settings: sanitizedSettings
  };
}
```

**User clicks "Export Support Info" → saves JSON file → sends to support.**

#### 7. Error Codes

**Standardize error codes:**

```typescript
enum ErrorCode {
  FILE_NOT_FOUND = 'E001',
  INVALID_FORMAT = 'E002',
  ANALYSIS_FAILED = 'E003',
  NETWORK_ERROR = 'E004',
  // ...
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: any
  ) {
    super(message);
  }
}
```

**Log with codes:**

```typescript
logger.error('File load failed', {
  code: ErrorCode.FILE_NOT_FOUND,
  filename,
  path
});
```

#### 8. Rollback Plan

**If update breaks:**
1. Hub keeps previous version in `~/.antiphon/backups/`
2. User clicks "Rollback to Previous Version"
3. Hub restores old version
4. Hub marks update as "failed" (won't auto-update)

**Server-side killswitch:**
- Update server can mark version as "bad"
- Hub skips that version
- Push hotfix as new version

### Release Checklist

**Before each release:**

- [ ] All tests pass
- [ ] Manual QA completed
- [ ] CHANGELOG updated
- [ ] Version bumped (SemVer)
- [ ] Tagged in git (`v1.2.3`)
- [ ] CI builds artifacts
- [ ] Installers tested on clean machines
- [ ] Backward compatibility verified
- [ ] Migration tested (if breaking changes)
- [ ] Support bundle tested
- [ ] Rollback plan documented

### Key Questions

1. Can we push an update without fear?
2. Can users rollback if something breaks?
3. Are error codes consistent?
4. Does the update flow work end-to-end?

### Exit Criteria

- Release pipeline fully automated
- Installers tested on clean machines
- Backward compatibility verified
- Rollback plan works
- Support bundle exports correctly
- Update flow tested in Hub

---

## Weekly Kill-Switch Questions

**Stop polishing if ANY answer is "no". Fix the foundation first.**

### ✅ Question 1: Is the domain logic stable?

**What it means:**
Core business logic isn't changing every day. Algorithms, calculations, rules are mostly settled.

**How to check:**
- Count commits to Domain Layer in past week
- Are they bug fixes or constant rewrites?

**If "no":**
- Architecture is probably wrong (refactor Domain Layer)
- Or requirements are unclear (revisit Layer 0)

---

### ✅ Question 2: Is architecture modular?

**What it means:**
You can change one part without affecting others. Layers are truly independent.

**How to check:**
- Try swapping Services implementation (e.g., different file format)
- Does it require changing Domain or UI?

**If "no":**
- Dependencies are leaking across boundaries
- Refactor to enforce interfaces (Layer 2)

---

### ✅ Question 3: Is state predictable?

**What it means:**
You can predict exactly what happens when user clicks something. No surprises.

**How to check:**
- Write down expected behavior for each action
- Test it—does it match prediction?

**If "no":**
- State machine is incomplete or wrong
- Redesign state model (Layer 3)

---

### ✅ Question 4: Does the full workflow run?

**What it means:**
User can complete primary task start-to-finish without errors.

**How to check:**
- Run through happy path
- Try edge cases (large files, invalid input)

**If "no":**
- Integration is broken (debug Layer 5)
- Or workflow design is flawed (revisit Layer 4)

---

### ✅ Question 5: Could this survive real users?

**What it means:**
App handles errors gracefully, doesn't crash, performance is acceptable.

**How to check:**
- Give it to someone unfamiliar
- Watch them use it (don't help)
- Does it break? Do they get confused?

**If "no":**
- Hardening incomplete (Layer 5)
- Or UX is unclear (Layer 4)

---

**Only proceed to design/motion polish when ALL five are "yes".**

---

## The Antiphon Operating System (AI Usage)

### Purpose

A repeatable workflow for using AI (Codex, Claude, etc.) effectively at each layer.

### The 10-Step Flow

Per layer:

1. **Define** – You write human-readable deliverable (what needs to exist)
2. **Prompt** – Ask AI to implement (be specific, reference this doc + architecture)
3. **Validate** – You test the output against acceptance criteria
4. **Iterate** – If wrong, refine prompt and re-generate (don't accept "good enough")
5. **Refactor** – If architecture feels wrong, STOP and fix design (don't polish bad foundation)
6. **Document** – AI generates docs/comments for what it built
7. **Test** – Write tests (or have AI generate tests, then you review)
8. **Commit** – Commit when layer complete (atomic commits, clear messages)
9. **Checkpoint** – Review entire layer against checklist
10. **Proceed** – Only move to next layer when current layer passes all checkboxes

### When to STOP Codex

- **Before architecture decisions** – You design Layer 2, AI implements
- **When adding unrequested features** – Scope creep is the enemy
- **When suggesting complex refactors** – AI often over-engineers
- **Before visual polish** – Don't let it jump to Layer 7 when you're on Layer 4
- **When it starts making up "better" solutions** – Your spec is law

### When to REFACTOR

**Signs you need to refactor:**
- Domain logic appearing in UI components
- God files (> 500 lines)
- Duplicate code in 3+ places
- Confusing state (bugs when user clicks fast)

**Action:** Stop feature work. Refactor architecture. Then resume.

### When to REDESIGN

**Signs you need to go back to architecture (Layer 2):**
- Every feature requires changing 5+ files
- Testing is impossible (logic too coupled to UI)
- Adding features breaks existing features
- State management is chaotic
- Rewriting same code in multiple places

**Action:** Pause. Redesign Layer 2. Implement clean architecture. Resume.

### When to OPTIMIZE

**Only optimize when:**
1. You've measured performance (don't guess)
2. It fails performance budget (Layer 5)
3. Users complain about slowness

**Premature optimization is the root of all evil.**

Get it working, then make it fast (if needed).

---

## Common Failure Patterns

### Failure Pattern 1: Premature Polish (The #1 Killer)

**Symptoms:**
- Spending weeks on animations before core logic works
- Beautiful UI that crashes when user tries it
- Pixel-perfect designs of features that don't exist yet

**Why it happens:**
Visual work feels productive and looks impressive in demos. Architecture work is invisible.

**The fix:**
Enforce the pyramid. No Layer 7 until Layers 1-6 pass checklist.

**Prevention:**
Use Kill-Switch Questions weekly. If domain logic isn't stable, design doesn't matter yet.

---

### Failure Pattern 2: God Files (Architecture Rot)

**Symptoms:**
- Single file > 1000 lines
- Mixing UI + logic + I/O in one file
- Hard to test anything
- Fear of changing code (will break everything)

**Why it happens:**
No clear architecture. Everything dumps into one place.

**The fix:**
Stop immediately. Refactor into Domain / Services / UI layers.

**Prevention:**
Enforce Layer 2. Review architecture weekly.

---

### Failure Pattern 3: Unclear Product Vision

**Symptoms:**
- "It does everything!"
- Can't explain app in one sentence
- Constant feature creep
- No clear definition of "done"

**Why it happens:**
Skipped Layer 0. Jumped straight to coding.

**The fix:**
Stop. Go back to Layer 0. Define the Point and Kill List.

**Prevention:**
Never start coding without Layer 0 complete.

---

### Failure Pattern 4: Skipping Testing

**Symptoms:**
- "It works on my machine"
- No automated tests
- Every bug fix breaks something else
- Fear of refactoring

**Why it happens:**
Architecture makes testing hard (UI contains logic).

**The fix:**
Fix architecture (Layer 2). Write tests for Domain layer.

**Prevention:**
80%+ coverage for Domain layer. UI tests optional.

---

### Failure Pattern 5: No Migration Plan

**Symptoms:**
- Breaking changes with each version
- Users lose data on update
- No way to open old projects

**Why it happens:**
No schema versioning (Layer 3).

**The fix:**
Add version field to all saved data. Write migration scripts.

**Prevention:**
Schema versioning from day 1. Test migrations.

---

## Professional Standards

### Code Quality

**Standards:**
- TypeScript for type safety
- ESLint + Prettier configured
- No `any` types in domain logic
- Meaningful variable names
- Functions < 50 lines
- Modules < 400 lines

### Testing

**Coverage targets:**
- Domain layer: 80%+ unit test coverage
- Services layer: 50%+ integration test coverage
- UI layer: smoke tests only (E2E for critical flows)

**Test pyramid:**
- Many unit tests (fast, cheap)
- Some integration tests (moderate)
- Few E2E tests (slow, expensive)

### Documentation

**Required:**
- README with setup instructions
- Architecture diagram (3 layers)
- API documentation (interfaces/contracts)
- Inline comments for complex algorithms
- CHANGELOG for all releases

### Git Workflow

**Branches:**
- `main` – production-ready code
- `develop` – integration branch
- `feature/*` – feature branches
- `hotfix/*` – urgent fixes

**Commits:**
- Atomic (one logical change per commit)
- Clear messages (`feat: Add chord detection`, `fix: Memory leak in analyzer`)
- Reference issues (`Closes #123`)

**Pull Requests:**
- All code reviewed before merge
- CI must pass
- At least one approval required

---

## Summary: The Professional Rule

**DO NOT POLISH WHAT YOU MIGHT REWRITE.**

This is the #1 mistake indie devs make.

You sense it instinctively—trust that instinct.

Build the pyramid in order:
1. Product Clarity
2. Technical Foundation
3. Architecture
4. Data/State
5. Workflow Skeleton
6. Hardening
7. Design System
8. Motion Polish
9. Release Discipline

**Foundation → Structure → Skin**

Never the other way around.

---

## Appendix: Quick Decision Trees

### "Should I optimize this code?"

```
Is it slow? 
  ↓ NO → Don't optimize (premature optimization)
  ↓ YES
    Have you measured it?
      ↓ NO → Measure first (don't guess)
      ↓ YES
        Is it the bottleneck?
          ↓ NO → Optimize the actual bottleneck
          ↓ YES → Optimize this code
```

### "Should I add this feature?"

```
Is it in Layer 0 MVP scope?
  ↓ NO → Add to "Later" list
  ↓ YES
    Is current layer complete?
      ↓ NO → Finish current layer first
      ↓ YES → Add the feature
```

### "Should I refactor this?"

```
Is it hard to test?
  ↓ YES → Refactor (extract domain logic)
  
Is it a God file (>500 lines)?
  ↓ YES → Refactor (break into modules)
  
Is it duplicated 3+ times?
  ↓ YES → Refactor (extract shared function)
  
Otherwise:
  ↓ Don't refactor (it's working)
```

---

**END OF ANTIPHON OS BUILD PYRAMID**

This document is the law for every Antiphon app.

Commit it to memory. Reference it weekly. Never violate it.

Foundation → Structure → Skin. Always.
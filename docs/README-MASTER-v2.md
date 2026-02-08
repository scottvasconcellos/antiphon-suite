# Antiphon Master README

**Version 2.0 | February 2026**  
**Quick Navigation & Setup Guide**

---

## What is Antiphon?

**Antiphon** is a suite of professional music production tools for Catholic musicians, songwriters, and producers. It includes:

1. **Antiphon Hub** – Central manager app (authentication, installation, updates, licensing)
2. **Melody Engine** – AI-powered melody generator with chord-aware harmonization
3. **Chord Analyzer** – MIDI file analyzer for chord progressions and harmonic structure
4. **Future Tools** – Extensible framework for additional music apps

**Tech Stack:**
- React + Vite + Tauri (desktop apps)
- TypeScript (type-safe)
- Framer Motion (animations)
- Monorepo with shared packages

**Philosophy:** Foundation → Structure → Skin (never the reverse)

---

## Master Documentation Suite

### 📚 Complete Documentation Library

Core documentation lives in the `/docs` folder and describes the current Antiphon suite (Hub, shared engines, and existing tools), along with patterns that any future apps or engines can adopt. Additional specs will be added over time as new engines are created.

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[ANTIPHON_OS_BUILD_PYRAMID.md](./ANTIPHON_OS_BUILD_PYRAMID.md)** | Complete build protocol for every app (Layer 0-8) | Before starting ANY app, during weekly reviews |
| **[ANTIPHON_DESIGN_ANIMATION_SYSTEM.md](./ANTIPHON_DESIGN_ANIMATION_SYSTEM.md)** | Design system, motion language, animation presets | Layer 6-7 (design & motion polish) |
| **[ANTIPHON_HUB_SPEC.md](./ANTIPHON_HUB_SPEC.md)** | Hub manager app technical specification | Building Hub, integrating apps with Hub |
| **[ANTIPHON_MUSIC_TOOLS_SPEC.md](./ANTIPHON_MUSIC_TOOLS_SPEC.md)** | Current music tools and engine patterns (e.g., Melody Engine, Chord Analyzer) plus guidelines for future engines | Building or integrating any music tool that uses an Antiphon engine, or when defining a new engine |
| **[ANTIPHON_SDK_SHARED_LIBRARIES.md](./ANTIPHON_SDK_SHARED_LIBRARIES.md)** | SDK, music-theory, MIDI utils, UI components | Integrating shared code, writing tests |
| **[README.md](./README.md)** | This file - navigation and quick setup | Starting point, quick reference |

---

## Quick Start

### Prerequisites

**Install required tools:**

```bash
# Node.js 18+ and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Rust (for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# macOS: Xcode Command Line Tools
xcode-select --install

# Windows: Visual Studio Build Tools
# Download from https://visualstudio.microsoft.com/downloads/
```

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/antiphon/antiphon-suite.git
cd antiphon-suite

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run Hub in dev mode
pnpm --filter @antiphon/hub dev

# Run Melody Engine in dev mode
pnpm --filter @antiphon/melody-engine dev

# Run Chord Analyzer in dev mode
pnpm --filter @antiphon/chord-analyzer dev
```

### Repository Structure

```
antiphon-suite/
├── packages/
│   ├── hub/                    # Hub manager app
│   ├── melody-engine/          # Melody generator tool
│   ├── chord-analyzer/         # Chord analysis tool
│   ├── sdk/                    # Shared SDK
│   ├── music-theory/           # Music theory algorithms
│   ├── midi-utils/             # MIDI parsing/serialization
│   └── ui-components/          # Shared React components
├── shared/
│   ├── types/                  # TypeScript interfaces
│   └── constants/              # API endpoints, config
├── docs/
│   ├── ANTIPHON_OS_BUILD_PYRAMID.md
│   ├── ANTIPHON_DESIGN_ANIMATION_SYSTEM.md
│   ├── ANTIPHON_HUB_SPEC.md
│   ├── ANTIPHON_MUSIC_TOOLS_SPEC.md
│   ├── ANTIPHON_SDK_SHARED_LIBRARIES.md
│   └── README.md (this file)
└── package.json                # Root workspace config
```

---

## Development Workflow

### The Build Pyramid (ALWAYS FOLLOW)

Every app follows this sequence (see `ANTIPHON_OS_BUILD_PYRAMID.md`):

**Layer 0: Product Clarity (NO CODE YET)**
- Define point of app, user outcome, non-negotiables
- Create Kill List (what we're NOT building)
- Write acceptance criteria

**Layer 1: Technical Foundation**
- Repo structure, build system, CI/CD
- Environment setup, versioning strategy

**Layer 2: Architecture (MOST CRITICAL)**
- Domain / Services / UI separation
- UI must NOT contain business logic
- Testability verified

**Layer 3: Data & State Design**
- Data models, state machine, persistence strategy
- Deterministic behavior verified

**Layer 4: Workflow Skeleton (UGLY FIRST PASS)**
- End-to-end flow functional
- Boring UI acceptable
- **Ugly but correct > Beautiful but fragile**

**Layer 5: Integration & Hardening**
- Performance targets met, threading optimized
- Crash recovery, logging, input validation

**Layer 6: Design System**
- Design tokens, typography, spacing, components
- Accessibility (WCAG AA)

**Layer 7: Motion & Interaction Polish (LAST)**
- Animation presets, microinteractions
- Purposeful, weighted, restrained motion

**Layer 8: Packaging & Release Discipline**
- Release pipeline, auto-updates, installers
- Backward compatibility, rollback plan

### Weekly Kill-Switch Questions

**Stop polishing if ANY answer is "no":**

1. ✅ Is the domain logic stable?
2. ✅ Is architecture modular?
3. ✅ Is state predictable?
4. ✅ Does the full workflow run?
5. ✅ Could this survive real users?

Only proceed to design/motion polish when ALL five are "yes."

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm --filter @antiphon/hub build

# Run tests
pnpm test

# Run tests for specific package
pnpm --filter @antiphon/music-theory test

# Lint all code
pnpm lint

# Format all code
pnpm format

# Run Hub in development
pnpm --filter @antiphon/hub dev

# Build Hub for production
pnpm --filter @antiphon/hub build

# Create Hub installer (macOS)
pnpm --filter @antiphon/hub tauri build

# Add dependency to package
pnpm --filter @antiphon/hub add react-query

# Add shared dependency to all packages
pnpm add -w typescript
```

---

## Key Principles

### Architecture

**Golden Rule:** UI must NOT contain business logic.

**3-Layer Pattern:**
- Domain Layer (pure business logic, no framework imports)
- Services Layer (filesystem, audio, network, persistence)
- UI Layer (React components, presentation only)

**Dependency arrows:**
- UI → Services → Domain (allowed)
- Domain → UI (❌ NEVER)

### Testing

**Coverage targets:**
- Domain layer: 80%+ unit tests
- Services layer: 50%+ integration tests
- UI layer: E2E tests for critical flows only

### Design System

**Colors:**
- Background: `#000000` (pure black)
- Text: `#ffffff`, `#b3b3b3`, `#808080`
- Accents: Reserved for musical content only

**Typography:**
- Font: Inter (variable)
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px

**Spacing:**
- 8pt grid: 4px, 8px, 16px, 24px, 32px

### Motion Philosophy

**Principles:**
1. Motion is purposeful (serves utility, not decoration)
2. Motion is weighted (elements have mass)
3. Motion is restrained (subtle, professional)

**Timing:**
- Light elements: 150-200ms
- Medium elements: 200-300ms
- Heavy elements: 300-400ms
- Never exceed 500ms

---

## Integration with Hub

### Every App Must:

1. **Register with Hub** on startup
2. **Validate license** before starting
3. **Check for updates** periodically
4. **Use shared SDK** (`@antiphon/sdk`)
5. **Follow Hub API** (see `ANTIPHON_HUB_SPEC.md`)

**Example:**

```typescript
import { HubClient } from '@antiphon/sdk';

const hub = new HubClient({
  appId: 'melody-engine',
  version: '1.2.3'
});

async function initialize() {
  await hub.register();
  
  const isLicensed = await hub.validateLicense();
  if (!isLicensed) {
    showLicenseError();
    return;
  }
  
  startApp();
}
```

---

## Release Process

### Before Each Release:
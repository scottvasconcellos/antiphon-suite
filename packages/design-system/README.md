# @antiphon/design-system

Premium Dark-Mode Design System for Antiphon Suite. A comprehensive design system extracted from Figma, providing tokens, components, icons, and guidelines for consistent UI across all Antiphon applications.

## Viewing Storybook

From the **monorepo root**:

```bash
pnpm storybook
```

Then open **http://localhost:6006** in your browser.  
Alternatively, double-click **`Launch Storybook.command`** in this folder (Finder); it starts Storybook and opens the browser.

## Installation

```bash
pnpm add @antiphon/design-system
```

## Quick Start

### 1. Import Styles

Import the design system styles in your app's entry point:

```tsx
import '@antiphon/design-system/styles';
```

### 2. Configure Tailwind

Extend the design system's Tailwind config in your app's `tailwind.config.js`:

```js
import designSystemConfig from '@antiphon/design-system/tailwind.config.js';

export default {
  ...designSystemConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Include design system components
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

### 3. Use Components

```tsx
import { Button, Card, Input } from '@antiphon/design-system/components';
import { IconHome, IconSettings } from '@antiphon/design-system/icons';

function App() {
  return (
    <Card>
      <Button variant="primary">
        <IconHome /> Home
      </Button>
      <Input placeholder="Search..." />
    </Card>
  );
}
```

## Package Structure

```
packages/design-system/
├── src/
│   ├── tokens/          # Design tokens (colors, typography, spacing, etc.)
│   ├── components/      # React components (UI + audio)
│   ├── icons/           # Icon library
│   ├── styles/          # CSS files and utilities
│   ├── guidelines/      # Brand guidelines
│   └── assets/          # Logo and images
```

## Exports

### Main Entry

```tsx
import { tokens, Button, IconHome } from '@antiphon/design-system';
```

### Scoped Exports

```tsx
// Components only
import { Button, Card } from '@antiphon/design-system/components';

// Icons only
import { IconHome, IconSettings } from '@antiphon/design-system/icons';

// Tokens only
import { colors, typography, spacing } from '@antiphon/design-system/tokens';

// Styles only
import '@antiphon/design-system/styles';
```

## Design Tokens

### Colors

```tsx
import { colors } from '@antiphon/design-system/tokens';

// Background tiers
colors.bg.page           // #0a0a0b
colors.bg.surface        // #18181b
colors.bg.surfaceElevated // #1f1f23

// Text colors
colors.text.primary      // #e8e8ea
colors.text.secondary   // #a1a1a8
colors.text.muted       // #6b6b72

// Accent colors
colors.accent.primary   // #60a5fa
colors.accent.success   // #22c55e
colors.accent.warning   // #f59e0b
colors.accent.danger    // #ef4444
```

### Typography

```tsx
import { typography } from '@antiphon/design-system/tokens';

typography.fontSize.displayLg  // 3.5rem
typography.fontSize.headingLg   // 1.5rem
typography.fontSize.bodyMd      // 0.875rem
typography.fontSize.micro       // 0.6875rem (hardware labels)
```

### Spacing

```tsx
import { spacing } from '@antiphon/design-system/tokens';

spacing.base   // 0.25rem (4px base unit)
spacing.md     // 0.75rem (12px)
spacing.xl     // 1.5rem (24px)
spacing['2xl'] // 2rem (32px)
```

### Shadows

```tsx
import { shadows } from '@antiphon/design-system/tokens';

shadows.raised   // Subtle elevation
shadows.overlay  // Modal/dropdown shadow
shadows.inset    // Pressed/input shadow
shadows.bevel    // Hardware depth effect
```

## Components

### UI Components

- **Button** - Primary, secondary, ghost, danger, illuminated variants
- **Card** - Container component with elevation
- **Input** - Text input with focus states
- **Select** - Dropdown select
- **Slider** - Range input
- **Toggle** - Switch/toggle control
- **Modal** - Dialog/modal component
- **Tabs** - Tab navigation
- **Badge** - Status badges
- **Toast** - Notification toasts
- **ProgressBar** - Progress indicator

### Radix UI Primitives

All Radix UI components are re-exported:
- Accordion, Alert Dialog, Avatar, Breadcrumb, Calendar, Carousel
- Chart, Checkbox, Collapsible, Command, Context Menu, Dialog
- Drawer, Dropdown Menu, Form, Hover Card, Input OTP, Label
- Menubar, Navigation Menu, Pagination, Popover, Progress
- Radio Group, Resizable, Scroll Area, Separator, Sheet
- Sidebar, Skeleton, Sonner, Switch, Table, Textarea
- Toggle Group, Tooltip

### Audio Components

- **PianoRoll** - Piano roll editor
- **PianoKeyboard** - Virtual piano keyboard
- **Waveform** - Audio waveform visualization
- **Transport** - Playback controls
- **GrooveGrid** - Step sequencer grid
- **Knob** - Rotary control knob
- **Fretboard** - Guitar fretboard
- **Synthesizer** - Synth interface

## Icons

50+ icons available, all supporting `filled` and `outline` variants:

```tsx
import { IconHome, IconSettings, IconPlay } from '@antiphon/design-system/icons';

<IconHome size={24} filled={false} />
<IconSettings size={20} filled={true} />
<IconPlay size={16} />
```

### Icon Categories

- **Navigation**: Home, Dashboard, Project, Library, Settings, User, Search
- **Actions**: Add, Edit, Delete, Download, Upload, Expand, Collapse
- **Audio**: Play, Pause, Volume, Mute, Waveform, Spectrum, MIDI, Keyboard
- **Music**: Note, Chord, Scale, Grid, Loop, Record
- **Effects**: EQ, Compressor, Automation, Envelope, Reverb, Decay, Chorus
- **Instruments**: Guitar, Synth, Piano, Bass, Drums
- **Status**: Check, Warning, Error, Info

## Utility Classes

### Hardware Label

```tsx
<span className="hardware-label">GAIN</span>
```

Small, uppercase, monospace-style labels for control groups and hardware-inspired UI.

### Telemetry

```tsx
<span className="telemetry">-12.5 dB</span>
```

Monospace font for numeric readouts, meters, and technical displays.

### Display

```tsx
<h1 className="display">Antiphon Suite</h1>
```

Large display text for hero headlines and marketing content.

## Design principles (layout & hierarchy)

**Central reference for agents and developers:** [`docs/DESIGN_PRINCIPLES.md`](../../docs/DESIGN_PRINCIPLES.md) (repo root `docs/`). It defines:

- **Quick reference** — theme, layout, hierarchy, typography, logo placement
- **Layout patterns** — topbar, hero, sections, cards-in-cards, pricing, CTA, footer
- **Typography roles** — H1/H2/H3, eyebrow, body, muted, pill, stat value
- **Buttons, badges, cards** — primary/secondary, pills, section/feature/stack/stat/plan cards
- **Token mapping** — mock → design system tokens
- **Logo** — top-left in header; asset path: `packages/design-system/src/assets/` (e.g. `logo.svg` / `logo.png`)

Use it when you need to build UIs that are visually consistent with the Antiphon mock and brand.

## Guidelines

See `src/guidelines/Guidelines.md` for comprehensive brand guidelines covering:

- Brand geometry and composition
- Visual hierarchy rules
- Grid and responsive composition
- Iconography rules
- Depth and material behavior
- Motion and interaction rules
- Content and voice rules
- Platform-specific rules
- Quality gates and checklists

## CSS Variables

All design tokens are available as CSS variables:

```css
.my-component {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  padding: var(--spacing-md);
  font-size: var(--font-size-body-md);
}
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { ButtonProps, IconProps, ColorToken } from '@antiphon/design-system';
```

## Versioning

The design system follows semantic versioning. Breaking changes will be documented in the changelog.

## Updating the Design System

See `.cursor/rules/design-system-update.md` for instructions on updating the design system from new Figma exports.

## License

Private - Antiphon Suite internal use only.

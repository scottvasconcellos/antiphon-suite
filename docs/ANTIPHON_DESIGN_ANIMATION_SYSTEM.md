# Antiphon Design & Animation System

**Version 1.0 | February 2026**  
**Complete Visual, Motion & Interaction Standards**

---

## Executive Summary

This document defines:

1. **Design System** – Colors, typography, spacing, components
2. **Motion Language** – Animation timing, physics, presets
3. **Interaction Patterns** – Hover, press, drag, gesture standards
4. **Accessibility** – WCAG compliance, keyboard nav, screen readers

**Core Philosophy:** Purposeful, weighted, restrained motion that serves utility—not decoration.

---

## Table of Contents

1. [Visual Design System](#visual-design-system)
2. [The Antiphon Motion Philosophy](#the-antiphon-motion-philosophy)
3. [Motion Timing Standards](#motion-timing-standards)
4. [Animation Presets](#animation-presets)
5. [Framer Motion Implementation](#framer-motion-implementation)
6. [Interaction Patterns](#interaction-patterns)
7. [Accessibility Standards](#accessibility-standards)
8. [Component Animation Library](#component-animation-library)

---

## Visual Design System

### Design Tokens

**The single source of truth for all visual properties.**

#### Colors

**Backgrounds:**

```css
:root {
  /* Primary backgrounds */
  --color-bg-primary: #000000;      /* Main app background */
  --color-bg-secondary: #1a1a1a;    /* Cards, panels */
  --color-bg-tertiary: #333333;     /* Hover states */
  
  /* Surface colors */
  --color-surface: #262626;         /* Elevated surfaces */
  --color-surface-hover: #2d2d2d;   /* Hover state */
}
```

**Text:**

```css
:root {
  /* Text hierarchy */
  --color-text-primary: #ffffff;    /* Headings, emphasis */
  --color-text-secondary: #b3b3b3;  /* Body text */
  --color-text-tertiary: #808080;   /* Muted, metadata */
  --color-text-disabled: #4d4d4d;   /* Disabled state */
}
```

**Borders:**

```css
:root {
  --color-border: #666666;          /* Default borders */
  --color-border-subtle: #404040;   /* Subtle dividers */
  --color-border-focus: #ffffff;    /* Focus rings */
}
```

**Accents (Musical UI Only):**

```css
:root {
  /* Reserve color for musical content only */
  --color-accent-gold: #fbbf24;     /* Major chords, warmth */
  --color-accent-blue: #60a5fa;     /* Minor chords, cool */
  --color-accent-red: #fca5a5;      /* Diminished, tension */
  --color-accent-green: #86efac;    /* Augmented, bright */
}
```

**Functional Colors:**

```css
:root {
  /* Status colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

**Light Mode (Optional):**

```css
[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e5e5e5;
  --color-text-primary: #000000;
  --color-text-secondary: #4d4d4d;
  --color-text-tertiary: #808080;
  --color-border: #d4d4d4;
}
```

#### Typography

**Font Family:**

```css
:root {
  --font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
}
```

**Type Scale:**

```css
/* Fluid typography using clamp() for responsive scaling */
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);      /* 12-14px */
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);        /* 14-16px */
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);      /* 16-18px */
  --text-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);    /* 18-20px */
  --text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);        /* 20-24px */
  --text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);     /* 24-30px */
  --text-3xl: clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem);   /* 30-36px */
  --text-4xl: clamp(2.25rem, 1.95rem + 1.5vw, 3rem);         /* 36-48px */
}
```

**Fixed sizes (for specific use cases):**

```css
:root {
  --text-xs-fixed: 0.75rem;   /* 12px */
  --text-sm-fixed: 0.875rem;  /* 14px */
  --text-base-fixed: 1rem;    /* 16px */
  --text-lg-fixed: 1.125rem;  /* 18px */
  --text-xl-fixed: 1.25rem;   /* 20px */
  --text-2xl-fixed: 1.5rem;   /* 24px */
  --text-3xl-fixed: 1.875rem; /* 30px */
  --text-4xl-fixed: 2.25rem;  /* 36px */
}
```

**Weights:**

```css
:root {
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

**Line Heights:**

```css
:root {
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

#### Spacing

**8pt grid system:**

```css
:root {
  --space-0: 0;
  --space-1: 0.125rem;  /* 2px */
  --space-2: 0.25rem;   /* 4px */
  --space-3: 0.375rem;  /* 6px */
  --space-4: 0.5rem;    /* 8px */
  --space-6: 0.75rem;   /* 12px */
  --space-8: 1rem;      /* 16px */
  --space-10: 1.25rem;  /* 20px */
  --space-12: 1.5rem;   /* 24px */
  --space-16: 2rem;     /* 32px */
  --space-20: 2.5rem;   /* 40px */
  --space-24: 3rem;     /* 48px */
  --space-32: 4rem;     /* 64px */
}
```

**Component spacing:**

```css
:root {
  --spacing-xs: var(--space-2);   /* Tight (4px) */
  --spacing-sm: var(--space-4);   /* Small (8px) */
  --spacing-md: var(--space-8);   /* Medium (16px) */
  --spacing-lg: var(--space-12);  /* Large (24px) */
  --spacing-xl: var(--space-16);  /* Extra large (32px) */
}
```

#### Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - buttons, tags */
  --radius-md: 0.5rem;    /* 8px - cards, inputs */
  --radius-lg: 0.75rem;   /* 12px - modals */
  --radius-xl: 1rem;      /* 16px - large panels */
  --radius-full: 9999px;  /* Circular */
}
```

#### Shadows

```css
:root {
  /* Elevation system */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.3);
  --shadow-2xl: 0 20px 40px rgba(0, 0, 0, 0.4);
  
  /* Inset shadows */
  --shadow-inset: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

---

## The Antiphon Motion Philosophy

### Core Principles

1. **Motion is purposeful** – Every animation serves a utility, not decoration
2. **Motion is weighted** – Elements have mass, like analog equipment (heavy switches, smooth dials)
3. **Motion is restrained** – Subtle, professional, never flashy or cartoonish
4. **Motion reinforces hierarchy** – Important elements move more deliberately

### The Analog Equipment Metaphor

Think of physical studio gear:
- **Heavy switches** – Deliberate, satisfying click
- **Smooth dials** – Continuous rotation with momentum
- **Mechanical faders** – Resistance, weight, precision
- **VU meters** – Bouncy response with damping

**Our UI should feel the same:**
- Buttons have weight (slight resistance on press)
- Modals open like heavy doors (smooth, measured)
- Cards settle into place with gentle spring physics
- Hover states are immediate and tactile

### What We Avoid

❌ Cartoonish bounces (exaggerated overshoot)  
❌ Flashy gimmicks (spinning, exploding, rainbow trails)  
❌ Decorative motion (animating for visual flair)  
❌ Slow, sluggish transitions (>400ms for UI elements)  
❌ Inconsistent timing (random durations)  

### Motion Hierarchy

**Light elements (fast):**
- Icons, tooltips, badges
- 150-200ms

**Medium elements (moderate):**
- Buttons, cards, list items
- 200-300ms

**Heavy elements (deliberate):**
- Modals, sidebars, full-screen transitions
- 300-400ms

**Never exceed 500ms** for UI transitions (feels unresponsive).

---

## Motion Timing Standards

### Duration by Weight

**Based on element size and perceived mass:**

| Element Type | Mass | Duration | Example |
|--------------|------|----------|---------|
| Icon, Badge | Light | 150-200ms | Tooltip appear |
| Button, Tag | Light-medium | 200-250ms | Button hover |
| Card, Item | Medium | 250-300ms | Card entrance |
| Panel, Drawer | Medium-heavy | 300-350ms | Sidebar slide |
| Modal, Overlay | Heavy | 350-400ms | Modal fade-in |
| Page Transition | Heavy | 400-500ms | Route change |

### Easing Functions

**Standard easings:**

```typescript
export const easings = {
  // Smooth, natural motion
  easeOut: [0.16, 1, 0.3, 1],           // Fast start, gentle end
  easeIn: [0.7, 0, 0.84, 0],            // Gentle start, fast end
  easeInOut: [0.65, 0, 0.35, 1],        // Smooth both ends
  
  // Sharp, responsive motion
  sharp: [0.4, 0, 0.2, 1],              // Quick, decisive
  
  // Spring physics (use for enter/exit)
  spring: { type: 'spring', stiffness: 120, damping: 20 }
};
```

**When to use each:**

- **easeOut** – Default for enter animations (elements appearing)
- **easeIn** – Exit animations (elements disappearing)
- **easeInOut** – Reversible actions (toggle, expand/collapse)
- **sharp** – Immediate feedback (button press, click)
- **spring** – Natural, weighted motion (cards settling, modals opening)

### Spring Physics Parameters

**For spring-based animations:**

```typescript
interface SpringConfig {
  type: 'spring';
  stiffness: number;  // How quickly it tries to reach target (higher = faster)
  damping: number;    // Resistance to motion (higher = less overshoot)
  mass?: number;      // Perceived weight (higher = slower)
}
```

**Presets:**

```typescript
export const springs = {
  // Gentle, smooth (default)
  gentle: { type: 'spring', stiffness: 100, damping: 20, mass: 1 },
  
  // Snappy, responsive
  snappy: { type: 'spring', stiffness: 200, damping: 25, mass: 0.8 },
  
  // Heavy, weighty
  heavy: { type: 'spring', stiffness: 80, damping: 15, mass: 1.5 },
  
  // Bouncy (use sparingly)
  bouncy: { type: 'spring', stiffness: 150, damping: 10, mass: 1 }
};
```

**Guideline:** Use `gentle` as default. Only deviate for specific effect.

---

## Animation Presets

### Core Presets

**Every common animation pattern codified for consistency.**

#### 1. Card Entrance

**Visual:** Card grows from top-left corner, settling with subtle spring.

```typescript
export const cardVariant = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    originX: 0,  // Grow from left
    originY: 0   // Grow from top
  },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { 
      type: 'spring', 
      stiffness: 120, 
      damping: 20,
      duration: 0.3
    }
  }
};
```

**Use for:** App cards in Hub, content cards, panels

#### 2. Modal Entrance

**Visual:** Fade in with subtle scale, slower than cards (heavy).

```typescript
export const modalVariant = {
  hidden: { 
    opacity: 0, 
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { 
      duration: 0.35, 
      ease: [0.16, 1, 0.3, 1] // easeOut
    }
  }
};
```

**Overlay (background):**

```typescript
export const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.25 }
  }
};
```

**Use for:** Modals, dialogs, confirmations

#### 3. Tooltip / Popover

**Visual:** Fast fade + slide (feels lightweight).

```typescript
export const tooltipVariant = {
  hidden: { 
    opacity: 0, 
    y: 4,        // Slide up 4px
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1.0,
    transition: { 
      duration: 0.15, 
      ease: [0.16, 1, 0.3, 1]
    }
  }
};
```

**Use for:** Tooltips, popovers, dropdown menus

#### 4. List Item Stagger

**Visual:** Items appear sequentially with slight delay.

```typescript
export const listContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,  // 80ms between items
      delayChildren: 0.1      // 100ms before first item
    }
  }
};

export const listItemVariant = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.25, 
      ease: [0.16, 1, 0.3, 1]
    }
  }
};
```

**Use for:** Lists of cards, search results, app inventory

#### 5. Button Press

**Visual:** Subtle scale down (tactile feedback).

```typescript
export const buttonPressVariant = {
  rest: { scale: 1.0 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.15 }
  },
  press: { 
    scale: 0.98,
    transition: { duration: 0.08 }
  }
};
```

**Use for:** All interactive buttons

#### 6. Fade Transition (Route Changes)

**Visual:** Crossfade between pages.

```typescript
export const pageTransitionVariant = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] }
  }
};
```

**Use for:** Page/route transitions

#### 7. Expand / Collapse

**Visual:** Height changes with smooth easing.

```typescript
export const expandVariant = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    overflow: 'hidden'
  },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: { duration: 0.25, ease: [0.65, 0, 0.35, 1] },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  }
};
```

**Use for:** Accordions, expandable sections

#### 8. Notification / Toast

**Visual:** Slide in from top-right, pause, slide out.

```typescript
export const toastVariant = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    x: 100 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    x: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { 
      duration: 0.25, 
      ease: [0.7, 0, 0.84, 0]
    }
  }
};
```

**Use for:** Toast notifications, alerts

---

## Framer Motion Implementation

### Installation

```bash
pnpm add framer-motion
```

### Basic Usage

**Animated component:**

```typescript
import { motion } from 'framer-motion';

export function Card({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1.0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

**Using variants:**

```typescript
import { motion } from 'framer-motion';
import { cardVariant } from './motionPresets';

export function Card({ children }: Props) {
  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
```

### Shared Presets File

**Create `src/motion/presets.ts`:**

```typescript
import { Variants, Transition } from 'framer-motion';

// Easings
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.65, 0, 0.35, 1],
  sharp: [0.4, 0, 0.2, 1]
};

// Springs
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1 },
  snappy: { type: 'spring' as const, stiffness: 200, damping: 25, mass: 0.8 },
  heavy: { type: 'spring' as const, stiffness: 80, damping: 15, mass: 1.5 }
};

// Card entrance
export const cardVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8, originX: 0, originY: 0 },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { ...springs.gentle, duration: 0.3 }
  }
};

// Modal entrance
export const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1.0,
    transition: { duration: 0.35, ease: easings.easeOut }
  }
};

// Tooltip
export const tooltipVariant: Variants = {
  hidden: { opacity: 0, y: 4, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1.0,
    transition: { duration: 0.15, ease: easings.easeOut }
  }
};

// Button press
export const buttonPressVariant = {
  rest: { scale: 1.0 },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
  press: { scale: 0.98, transition: { duration: 0.08 } }
};

// List stagger
export const listContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

export const listItemVariant: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25, ease: easings.easeOut }
  }
};

// Page transition
export const pageTransitionVariant: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.3, ease: easings.easeOut } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easings.easeIn } }
};

// Expand/collapse
export const expandVariant: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: { duration: 0.25, ease: easings.easeInOut },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  }
};

// Toast notification
export const toastVariant: Variants = {
  hidden: { opacity: 0, y: -20, x: 100 },
  visible: { 
    opacity: 1, 
    y: 0, 
    x: 0,
    transition: { duration: 0.3, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.25, ease: easings.easeIn }
  }
};
```

### Using Presets

**Example: Animated card list**

```typescript
import { motion } from 'framer-motion';
import { listContainerVariant, listItemVariant } from '@/motion/presets';

export function AppList({ apps }: Props) {
  return (
    <motion.div
      variants={listContainerVariant}
      initial="hidden"
      animate="visible"
    >
      {apps.map(app => (
        <motion.div
          key={app.id}
          variants={listItemVariant}
        >
          <AppCard app={app} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### AnimatePresence for Enter/Exit

**For elements that mount/unmount:**

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { modalVariant, overlayVariant } from '@/motion/presets';

export function Modal({ isOpen, onClose, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="modal-overlay"
            variants={overlayVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          {/* Modal content */}
          <motion.div
            className="modal-content"
            variants={modalVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Layout Animations

**For elements that change position:**

```typescript
<motion.div layout transition={{ duration: 0.3, ease: easings.easeInOut }}>
  {/* Content that might reflow */}
</motion.div>
```

**Shared layout animations (advanced):**

```typescript
<motion.div layoutId="card-123">
  {/* Element that morphs between views */}
</motion.div>
```

---

## Interaction Patterns

### Hover States

**Standard hover:**

```css
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  background-color: var(--color-bg-tertiary);
  box-shadow: var(--shadow-md);
}
```

**With Framer Motion:**

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.15 }}
>
  Hover me
</motion.button>
```

### Press States

**Immediate feedback (<100ms):**

```typescript
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.08 }}
>
  Press me
</motion.button>
```

**With visual feedback:**

```typescript
const [isPressed, setIsPressed] = useState(false);

<motion.button
  onMouseDown={() => setIsPressed(true)}
  onMouseUp={() => setIsPressed(false)}
  animate={{ scale: isPressed ? 0.98 : 1.0 }}
  transition={{ duration: 0.08 }}
>
  Press me
</motion.button>
```

### Drag Interactions

**Draggable elements:**

```typescript
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 0 }}
  dragElastic={0.1}
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
>
  Drag me
</motion.div>
```

**Drag to reorder:**

```typescript
import { Reorder } from 'framer-motion';

export function ReorderableList({ items, onReorder }: Props) {
  return (
    <Reorder.Group values={items} onReorder={onReorder}>
      {items.map(item => (
        <Reorder.Item key={item.id} value={item}>
          {item.name}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

### Focus States

**Keyboard navigation:**

```css
.btn:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

**With motion:**

```typescript
<motion.button
  whileFocus={{ scale: 1.02 }}
>
  Focus me
</motion.button>
```

### Loading States

**Skeleton loaders:**

```typescript
export function SkeletonCard() {
  return (
    <motion.div
      className="skeleton-card"
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}
```

**Spinner:**

```typescript
export function Spinner() {
  return (
    <motion.div
      className="spinner"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}
```

---

## Accessibility Standards

### WCAG Compliance

**Minimum standards:** WCAG 2.1 Level AA

#### Color Contrast

**Text contrast ratios:**
- Body text (14-18px): 4.5:1 minimum
- Large text (18px+ or 14px+ bold): 3:1 minimum
- UI components: 3:1 minimum

**Test with:**
- Chrome DevTools Accessibility panel
- WebAIM Contrast Checker

**Current palette compliance:**
- `#ffffff` on `#000000` = 21:1 ✅
- `#b3b3b3` on `#000000` = 9.7:1 ✅
- `#808080` on `#000000` = 5.3:1 ✅

#### Keyboard Navigation

**Requirements:**
- [ ] All interactive elements tabbable
- [ ] Focus order logical (top-to-bottom, left-to-right)
- [ ] Focus visible (outline or ring)
- [ ] Escape closes modals/overlays
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate lists/menus

**Implementation:**

```typescript
<button
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click or press Enter
</button>
```

#### Focus Management

**Trap focus in modals:**

```typescript
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function Modal({ isOpen, children }: Props) {
  const modalRef = useFocusTrap(isOpen);
  
  return (
    <div ref={modalRef}>
      {children}
    </div>
  );
}
```

**Return focus after close:**

```typescript
const [isOpen, setIsOpen] = useState(false);
const triggerRef = useRef<HTMLButtonElement>(null);

function handleClose() {
  setIsOpen(false);
  triggerRef.current?.focus(); // Return focus
}
```

#### Screen Reader Support

**ARIA labels:**

```typescript
<button aria-label="Close modal">
  <CloseIcon />
</button>
```

**Landmark regions:**

```typescript
<main role="main">
  <nav role="navigation" aria-label="Main navigation">
    {/* Nav items */}
  </nav>
  <section aria-labelledby="apps-heading">
    <h2 id="apps-heading">Installed Apps</h2>
    {/* Apps */}
  </section>
</main>
```

**Live regions (for dynamic updates):**

```typescript
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Reduced Motion

**Respect user preference:**

```typescript
import { useReducedMotion } from 'framer-motion';

export function AnimatedCard({ children }: Props) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

**CSS media query:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Animation Library

### Complete Examples

#### Animated Button

```typescript
import { motion } from 'framer-motion';
import { buttonPressVariant } from '@/motion/presets';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <motion.button
      className={`btn btn--${variant}`}
      variants={buttonPressVariant}
      initial="rest"
      whileHover="hover"
      whileTap="press"
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

#### Animated Card

```typescript
import { motion } from 'framer-motion';
import { cardVariant } from '@/motion/presets';

export function Card({ title, children }: CardProps) {
  return (
    <motion.div
      className="app-card"
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}
      transition={{ duration: 0.2 }}
    >
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </motion.div>
  );
}
```

#### Animated Modal

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { modalVariant, overlayVariant } from '@/motion/presets';

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            variants={overlayVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          <motion.div
            className="modal-content"
            variants={modalVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="modal-header">
              <h2>{title}</h2>
              <button onClick={onClose} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

#### Animated List

```typescript
import { motion } from 'framer-motion';
import { listContainerVariant, listItemVariant } from '@/motion/presets';

export function AppList({ apps }: AppListProps) {
  return (
    <motion.div
      className="app-list"
      variants={listContainerVariant}
      initial="hidden"
      animate="visible"
    >
      {apps.map(app => (
        <motion.div
          key={app.id}
          variants={listItemVariant}
        >
          <AppCard app={app} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

#### Animated Tooltip

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { tooltipVariant } from '@/motion/presets';

export function Tooltip({ isVisible, text, children }: TooltipProps) {
  return (
    <div className="tooltip-wrapper">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="tooltip"
            variants={tooltipVariant}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### Animated Toast

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { toastVariant } from '@/motion/presets';

export function Toast({ isVisible, message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="toast"
          variants={toastVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <span>{message}</span>
          <button onClick={onClose}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Summary

**Motion serves utility, not decoration.**

Every animation in the Antiphon system:
- Has a clear purpose (feedback, hierarchy, spatial relationship)
- Respects user preferences (reduced motion)
- Maintains consistent timing (150-400ms for UI)
- Uses spring physics for natural feel
- Never exceeds 500ms (feels sluggish)

**The three motion rules:**
1. **Purposeful** – Why is this moving?
2. **Weighted** – Does it feel like a physical object?
3. **Restrained** – Is it subtle and professional?

If you can't answer "yes" to all three, don't animate it.

---

**END OF ANTIPHON DESIGN & ANIMATION SYSTEM**
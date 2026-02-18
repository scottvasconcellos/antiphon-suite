# Antiphon Brand Implementation Guidelines

> Version 2.0 | Last updated: February 2026
>
> This document defines the behavioral rules, composition standards, and decision-making frameworks for all Antiphon surfaces. It does not redefine the color palette, typography scale, or spacing scale — those are defined in the design library. This document describes *how* to use them.

---

## Table of Contents

- [A. Brand Geometry, Composition, and Layout](#a-brand-geometry-composition-and-layout)
- [B. Visual Hierarchy Rules](#b-visual-hierarchy-rules)
- [C. Grid and Responsive Composition](#c-grid-and-responsive-composition)
- [D. Iconography and Illustration Rules](#d-iconography-and-illustration-rules)
- [E. Depth, Surface, and Material Behavior](#e-depth-surface-and-material-behavior)
- [F. Motion and Interaction Rules](#f-motion-and-interaction-rules)
- [G. Content, Voice, and UI Copy Layout Rules](#g-content-voice-and-ui-copy-layout-rules)
- [H. Platform-Specific Application Rules](#h-platform-specific-application-rules)
- [I. Quality Gates and Brand Linting](#i-quality-gates-and-brand-linting)

---

## A. Brand Geometry, Composition, and Layout

### Core Principle

The Antiphon "A" logo — a symmetrical glyph with a sharp peak, arched negative space, and tapered wings — is the geometric seed for the entire visual language. Every layout, divider, and container should feel as though it could have been designed by the same hand that drew the logo.

### A.1 Symmetry vs. Asymmetry

Antiphon defaults to **bilateral symmetry**. The logo is vertically symmetrical, and this should be the compositional baseline for all hero sections, modals, empty states, and marketing layouts. Asymmetry is allowed only when it serves a functional purpose.

**When symmetry is required:**
- Hero sections, splash screens, and full-width marketing compositions
- Modal dialogs and confirmation prompts
- Empty states and first-run experiences
- Logo lock-ups and brand zones

**When asymmetry is allowed:**
- App shells with sidebars and inspectors (the asymmetry is functional, not decorative)
- Content-heavy layouts where a reading axis demands left-alignment
- Split-pane editors (piano roll + inspector, timeline + mixer)
- Dashboard grids where content volume varies between modules

**When asymmetry is prohibited:**
- Never use asymmetry for purely decorative effect
- Never offset a modal dialog from center
- Never use diagonal compositions or rotated containers

### A.2 Logo-Derived Geometry

The logo provides three recurring geometric motifs. Use them sparingly and structurally, never as decoration.

**Peak / Apex:**
The sharp upward vertex of the "A" can inform section break shapes, hero gradients that taper upward, and upward-pointing indicator arrows. Use the peak motif only in singular, dominant positions — never repeated in a row.

**Arch / Negative Space:**
The arched counter-space inside the "A" informs the curvature of panel separators, the shape of empty-state illustrations, and the inner geometry of icons. Arches should be subtle — they reference the logo without mimicking it.

**Taper / Wings:**
The outward taper of the letter's legs informs the way panels widen toward their base, how cards can have slightly heavier bottom borders, and how dividers may taper from center outward. Use this motif to create a grounded, stable feeling.

**Rules:**
| Motif | Must | Should | Avoid |
|---|---|---|---|
| Peak | Use once per page at most | Reference in hero gradient direction | Repeating peak shapes in patterns |
| Arch | Use for structural curves only | Reference in empty-state art | Using arches as decorative borders |
| Taper | Use to suggest gravity/groundedness | Apply to divider line-weight falloff | Creating visible wedge shapes |

### A.3 Negative Space

Antiphon treats negative space the way studio hardware treats front-panel real estate: every element earns its position.

- **Must** maintain generous padding around the logo mark — minimum clear space equal to the height of the crossbar on all sides.
- **Must** use the largest spacing token appropriate for the context around primary interactive elements (transport controls, main action buttons, hero CTAs).
- **Should** increase breathing room as visual importance increases: the most important element on screen gets the most space around it.
- **Should** use inset backgrounds to create perceived negative space within dense panels.
- **Avoid** filling available space reflexively. An empty area is not a problem to solve.
- **Avoid** reducing padding to "fit more in." If it doesn't fit, the module is too large.

### A.4 Alignment Principles

**Optical vs. Geometric Centering:**
- Text blocks and icons within buttons use **optical centering** — adjusted slightly upward and leftward from mathematical center to appear visually centered.
- Grid layouts and containers use **geometric centering** — mathematically precise.
- Play/stop icons and transport controls require optical correction; triangular play icons should be shifted slightly right of center.

**Baseline Alignment:**
- All inline text + icon pairings must be baseline-aligned or optically corrected to appear so.
- Labels above controls (hardware-style) must left-align with the control's left edge.
- Numeric readouts in telemetry rows must right-align or use tabular (monospace) figures.

### A.5 Page Flow and Reading Order

**Marketing and documentation pages:** Use an F-pattern scan. The hero anchors the top, then content flows left-to-right, top-to-bottom in defined rows. Secondary content (testimonials, social proof) occupies the right column or lower sections.

**App screens and editors:** Use a Z-pattern with a persistent navigation anchor. The eye should move: logo/brand → toolbar → primary workspace → inspector/detail panel.

**Reading order priority:**
1. **Primary:** The single most important element (hero title, active editor pane, transport bar)
2. **Secondary:** Supporting controls and navigation (sidebar, tab bar, breadcrumbs)
3. **Tertiary:** Metadata, status indicators, and contextual help

### A.6 Hardware Front-Panel Layout

Many Antiphon surfaces should feel like the front panel of a hardware rack unit. This metaphor informs grouping, labeling, and segmentation.

**Panel segmentation:**
- Group related controls into clearly bounded modules (cards, inset panels, bordered sections).
- Each module gets a single hardware-style label (uppercase, wide tracking, muted color) positioned above the group, left-aligned.
- Modules are separated by consistent spacing, never by decorative dividers.

**Section headers:**
- Section headers within a panel use the hardware-label utility class as the primary identifier.
- A section header is always followed by its content with one spacing step of separation.

**"Module Bay" vs. Flat Editorial:**
| If the surface is... | Use... |
|---|---|
| A control panel, mixer, or parameter editor | Module bay layout: bounded modules with hardware labels |
| A marketing page, documentation page, or long-form content | Flat editorial layout: open sections, generous vertical rhythm |
| A dashboard with mixed content types | Hybrid: module bays for widgets, editorial for summaries |
| A modal or dialog | Flat layout with a single visual group |

### A.7 Must / Should / Avoid

**Must:**
- Maintain bilateral symmetry in all brand-first compositions (heroes, modals, splash)
- Use hardware-label positioning (above, left-aligned) for all control group labels
- Preserve minimum logo clear space in all contexts
- Apply optical centering corrections to play/transport icons

**Should:**
- Reference peak, arch, and taper motifs in structural elements
- Increase negative space proportionally to element importance
- Use module-bay segmentation in dense control surfaces
- Group no more than 5-7 related controls per module

**Avoid:**
- Diagonal or rotated compositions
- Decorative use of logo geometry (watermarks, background patterns)
- Filling negative space reflexively
- Mixing module-bay and editorial layout within the same panel
- Using peak/arch motifs more than once per viewport

### A.8 Designer Checklist: Logo-Derived Geometry Verification

- [ ] Is the composition's dominant axis symmetrical where appropriate?
- [ ] Does the layout feel like it was designed by the same hand as the logo?
- [ ] Are hardware-style labels positioned above their groups, left-aligned?
- [ ] Is the logo clear space maintained?
- [ ] Are optical centering corrections applied to icons inside buttons?
- [ ] Does the negative space feel intentional, not leftover?
- [ ] Are modules clearly bounded with consistent inter-module spacing?
- [ ] Is the page flow following the correct scan pattern (F for marketing, Z for app)?
- [ ] Are no more than 3 hierarchy levels visible in any single module?
- [ ] Are peak/arch/taper motifs used structurally, not decoratively?

---

## B. Visual Hierarchy Rules

### Core Principle

Hierarchy is the difference between a professional mix and noise. Antiphon's type system provides a deliberate scale from display headlines to micro labels. The rules below govern when to use each level and how to combine them without introducing new sizes.

### B.1 Maximum Hierarchy Levels

| Context | Max Levels | Typical Stack |
|---|---|---|
| Marketing hero section | 3 | Display headline → body text → CTA label |
| App module / card | 3 | Module title → body/value → metadata/caption |
| Inspector panel | 3 | Panel header → group label → parameter label |
| DAW plugin window | 3 | Plugin name → section label → parameter label |
| Modal dialog | 2 | Dialog title → body text |
| Tooltip | 1 | Caption text only |

**Rule:** If you need more than 3 hierarchy levels in a single module, the module is too complex. Split it.

### B.2 Title / Subtitle / Body / Metadata Behavior

**Title (display or heading sizes):**
- Use for the single most prominent text element in a section or page.
- Only one title per visible section at a time.
- If the title is a display size, it belongs to marketing or hero contexts only.

**Subtitle (one step below title):**
- Use for supporting context beneath a title.
- Always secondary text color.
- If no subtitle is needed, omit it entirely — never use a subtitle as padding.

**Body (default UI and body sizes):**
- Use for all readable content: descriptions, paragraphs, list items, dialog messages.
- Primary text color for active content, secondary for supporting content.

**Metadata (caption and micro sizes):**
- Use for timestamps, version numbers, file sizes, status indicators, hardware labels.
- Always muted or secondary text color.
- Must not compete with body text for attention.

### B.3 Emphasis System

Emphasis is achieved through a strict toolkit. **Do not introduce new sizes to create emphasis.**

| Emphasis Method | When to Use | Constraint |
|---|---|---|
| Weight change (semibold) | Active states, selected items, primary labels | Never use bold + caps together |
| Case change (uppercase) | Hardware labels, section group headers, status badges | Always pair with wide tracking |
| Tracking change (wider) | Hardware labels, brand text, button labels | Only with uppercase or micro sizes |
| Separator/divider | Between major sections only | Use border tokens, never arbitrary lines |
| Accent color | Active/selected states, links, primary actions only | Never more than one accent-colored text element per module |
| Inset background | Callouts, code blocks, embedded controls | Use inset background token only |

**Prohibited combinations:**
- Bold + uppercase + accent color (too many signals)
- Italic text (not part of the Antiphon voice)
- Underlined text except for links in body copy
- Colored backgrounds behind text for emphasis (use inset panels instead)

### B.4 Density Modes

Antiphon operates at two density modes. Both use the existing spacing scale — the difference is which end of the scale dominates.

**"Studio Hardware Dense" (app, plugin, editor):**
- Use the compact end of the spacing scale for intra-module padding.
- Controls are tightly grouped with minimal vertical space between them.
- Labels are micro-sized, uppercase, wide-tracked.
- Every pixel earns its keep.

**"Marketing Spacious" (website, documentation, onboarding):**
- Use the generous end of the spacing scale for section padding and inter-element gaps.
- Reading rhythm is relaxed with ample vertical space between paragraphs.
- Headings breathe with large top margins.
- Content maxes out at a comfortable reading width.

**Decision table:**

| If the screen is... | Pick density... |
|---|---|
| DAW plugin UI | Dense: smallest spacing between controls, micro labels |
| App editor (piano roll, timeline) | Dense: tight grid, compact toolbars |
| App sidebar or inspector | Dense-to-medium: compact controls with readable labels |
| Dashboard | Medium: balanced module padding, standard body text |
| Marketing page | Spacious: generous section margins, display typography |
| Documentation page | Spacious: comfortable reading width, relaxed line height |
| Modal dialog | Medium: standard padding, readable body text |
| Settings / preferences | Medium: form-field spacing with clear group separation |

### B.5 Long-Form Readability

For documentation, changelogs, and marketing body copy:

- **Heading cadence:** A heading should appear every 3-5 paragraphs. Never stack two headings without intervening body text.
- **Paragraph width:** Constrain body text to a comfortable measure (roughly 60-75 characters per line). Use the content container's max-width, not viewport width.
- **Lists:** Use bulleted lists for unordered items, numbered for sequential steps. Never nest more than two levels.
- **Callouts:** Use inset-background panels with a left accent border for warnings, tips, and notes.
- **Code blocks:** Use monospace font on an inset background. Inline code uses the same font at the current body size.
- **Tables:** Use the subtle border for cell separation. Header rows use hardware-label styling. Numeric columns right-align.
- **Captions:** Always the smallest text size, muted color, positioned directly below the element they describe.

### B.6 Hierarchy Sanity Checklist

- [ ] Are there 3 or fewer hierarchy levels per module?
- [ ] Is there exactly one title per visible section?
- [ ] Are subtitles only present when they add information (not as filler)?
- [ ] Is emphasis achieved through one method at a time (not stacked)?
- [ ] Is the density mode appropriate for the surface?
- [ ] Does body text stay within a comfortable reading width?
- [ ] Are hardware-label styles reserved for group headers and metadata, never for body text?
- [ ] Is accent-colored text limited to one instance per module?
- [ ] Are no new font sizes introduced?

---

## C. Grid and Responsive Composition

### Core Principle

Antiphon's grid system is not a single column count — it's a set of behavioral rules that adapt to viewport, surface, and content type. The spacing scale defines the gutter sizes; the grid defines how content flows and reflows.

### C.1 Container Strategy

**All surfaces use a maximum content width** for readability and visual comfort on large screens. Content is centered horizontally within the viewport.

- Marketing pages: Wide container for hero sections, narrower for body text.
- App shells: Full viewport width with fixed sidebars consuming a defined column width.
- Plugin windows: No container constraint — the plugin fills its window entirely.
- Documentation: Narrow container optimized for reading.

**Breakpoint behavior is conceptual, not pixel-defined:**
- **Compact:** Single-column, stacked layout. Sidebars collapse to bottom sheets or drawers. Toolbars move to bottom.
- **Regular:** Two-column layouts emerge. Sidebars become visible. Grid content flows in 2-3 columns.
- **Expanded:** Full multi-column layout. Inspectors and sidebars both visible. Grids use 3-4+ columns.

### C.2 Column / Grid Behaviors by Surface

| Surface | Layout Behavior |
|---|---|
| **Marketing hero** | Single column, full bleed, centered content |
| **Marketing feature rows** | Alternating 2-column (image + text), stacks on compact |
| **Marketing pricing** | 3-column card grid, stacks to single on compact |
| **App sidebar** | Fixed-width, non-responsive (collapses entirely on compact) |
| **App main workspace** | Fluid, fills remaining viewport after sidebar |
| **Piano roll / timeline** | Full workspace width, horizontal scroll, no column grid |
| **Dashboard** | Auto-fit grid: modules fill available columns (2-4 depending on viewport) |
| **Inspector panel** | Single column, fixed width, vertical scroll |
| **Plugin window** | Fixed aspect ratio or size, internal grid is self-contained |
| **Hub tile grid** | Auto-fit grid: tiles fill available columns with consistent gaps |

### C.3 Responsive Rules

**Collapsing navigation:**
- If the viewport drops below the regular breakpoint, sidebars collapse to an overlay drawer triggered by a menu icon.
- Bottom navigation replaces sidebar on compact viewports for app surfaces.
- Marketing navigation collapses to a hamburger menu.

**Stacking vs. reflowing:**
- Two-column layouts **stack** (not shrink) on compact viewports.
- Grid items **reflow** to fewer columns, maintaining their internal proportions.
- Never shrink a module below its minimum readable size — remove lower-priority modules instead.

**Priority-based hiding:**
- Define primary, secondary, and tertiary content for every module.
- On compact viewports, tertiary content is hidden first (metadata, secondary actions).
- Secondary content is collapsed behind a "more" interaction.
- Primary content is always visible.

| If viewport/surface is... | Favor layout... |
|---|---|
| Compact marketing | Single column, stacked sections, hidden nav |
| Compact app | Bottom tab bar, single pane visible, drawers for panels |
| Regular marketing | Two-column feature rows, visible nav |
| Regular app | Sidebar + workspace, inspector as overlay |
| Expanded app | Sidebar + workspace + inspector, all visible |
| Plugin window (fixed) | No responsive behavior — design for the fixed size |

### C.4 Layout Primitives

Antiphon uses three layout primitives, described as behaviors:

**Stack:** Vertical arrangement of elements with consistent spacing. Use for forms, lists, sequential content. The default layout for most modules.

**Cluster:** Horizontal arrangement that wraps when space runs out. Use for button groups, tag sets, badge rows. Items maintain consistent inline spacing and wrap to new lines as needed.

**Grid:** Two-dimensional arrangement with defined columns and rows. Use for card grids, dashboards, color swatches, icon galleries. Columns auto-fit to available space.

**Rules:**
- **Must** use Stack as the default layout within any module.
- **Should** use Cluster for groups of peer elements (buttons, badges, tags).
- **Should** use Grid for collections of cards or tiles.
- **Avoid** using Grid for sequential form fields (use Stack).
- **Avoid** nesting Grids more than one level deep.

---

## D. Iconography and Illustration Rules

### Core Principle

Antiphon icons are engineering drawings, not illustrations. They share the logo's precision: sharp intersections, deliberate geometry, and restrained detail. Every icon should feel machined, not drawn.

### D.1 Stroke Philosophy

- **Monoline stroke** is the default. All icons use a single, consistent stroke weight.
- **Square line caps and miter joins** — matching the logo's precision. No rounded caps or joins.
- **Optical corrections:** Circular and diagonal strokes may be optically adjusted to appear the same weight as horizontal/vertical strokes, but the nominal stroke width is constant.
- **Corner treatment:** Corners are sharp (mitered) by default. Rounded corners are used only when the icon depicts a rounded object (e.g., a knob, a speaker cone).

### D.2 Outline vs. Filled

| State | Style | Example |
|---|---|---|
| Default / inactive | Outline (stroked) | A transport play button at rest |
| Active / selected | Filled or partially filled | A record button while recording |
| Decorative / brand | Outline only | Icons in marketing hero sections |

**Rules:**
- **Must** default to outline style for all interactive icons.
- **Should** use filled variants only to indicate active/engaged states.
- **Avoid** mixing outline and filled icons at the same hierarchy level in the same view (except to indicate state).

### D.3 Geometry Constraints from Logo

- Icons should use angles derived from the logo where possible — the peak angle, the wing taper, the crossbar horizontal.
- Icons with internal counter-shapes (negative space within the glyph) should echo the arched counter of the "A."
- Symmetrical icons are preferred. Asymmetrical icons are allowed only when the depicted object is inherently asymmetrical.
- Icons should resolve to a consistent optical grid. Align key vertices to the grid; do not let detail exceed the grid's resolution.

### D.4 Icon Sizing and Alignment

- Icons exist at relative sizes tied to context, not absolute dimensions. An icon in a toolbar is sized relative to the toolbar. An icon in body text is sized relative to the text line-height.
- Icons in buttons are vertically centered with the button label text, optically adjusted.
- Standalone icons in toolbars have consistent hit areas regardless of visual size.
- Icon-only buttons must include accessible labels (aria-label or sr-only text).

### D.5 Illustration and Photography Treatment

**Acceptable illustration styles:**
- Product renders: 3D renders of Antiphon software on dark backgrounds, dramatic lighting, shallow depth of field.
- Hardware macro photography: Close-up shots of studio equipment (knobs, faders, patch cables) as ambient texture.
- Minimal technical diagrams: Signal flow charts, architecture diagrams, waveform illustrations using brand colors on dark backgrounds.
- Abstract audio visualizations: Waveforms, frequency spectra, and particle systems using accent colors.

**Unacceptable styles:**
- Cartoon or playful illustration styles
- Flat-design "tech company" vector illustrations with people
- Stock photography with bright, saturated environments
- Noisy, high-frequency patterns or busy textures
- Illustrations with more than 3 colors

### D.6 Data Visualization Rules

- **Chart density:** Charts should feel like oscilloscope readouts — clean, precise, with minimal decoration.
- **Labeling:** Use hardware-label styling for axis labels. Use monospace/telemetry styling for data values.
- **Gridlines:** Subtle border color, never primary. Reduce gridline density to the minimum needed for readability.
- **Emphasis:** Use accent color for the primary data series. Use muted colors for reference/comparison data.
- **Background:** Charts sit on inset backgrounds, never directly on the page background.

### D.7 Must / Should / Avoid

**Must:**
- Use monoline stroke with square caps and miter joins for all icons
- Default to outline (stroked) style
- Maintain consistent optical grid alignment across all icons

**Should:**
- Reference logo angles and counter-shapes in icon geometry
- Use filled variants only for active/selected states
- Size icons relative to their context, not at absolute dimensions

**Avoid:**
- Rounded line caps or joins (unless depicting a rounded object)
- Decorative or illustrative icon styles
- Mixing outline and filled icons at the same hierarchy level
- Using more than 3 colors in any illustration
- Playful, cartoon, or high-saturation photography

### D.8 Checklist

- [ ] Do all icons use monoline stroke with square caps and miter joins?
- [ ] Are outline/filled states used correctly (outline = default, filled = active)?
- [ ] Do icon angles reference logo geometry where possible?
- [ ] Are icons sized relative to their context?
- [ ] Do data visualizations use hardware-label and telemetry text styles?
- [ ] Are chart gridlines using the subtle border color?
- [ ] Are illustrations dark, restrained, and within the 3-color limit?

---

## E. Depth, Surface, and Material Behavior

### Core Principle

Antiphon surfaces behave like matte-finish metal panels: they absorb light rather than reflecting it, they have weight and physicality, and their layering follows the logic of a hardware rack — front panels, recessed displays, raised buttons, inset meters.

### E.1 When to Use Each Elevation

The design system defines four depth levels. Here is when each is appropriate:

| Depth Level | When to Use | Examples |
|---|---|---|
| **Flat** (no shadow) | Default for all content areas and inline elements | Page backgrounds, sidebars, list items, toolbars |
| **Raised** (subtle elevation) | Elements that sit above the page and can be interacted with as a unit | Cards, buttons on hover, dropdown triggers, floating toolbars |
| **Inset** (recessed) | Input controls and display areas that receive content | Text inputs, meters, waveform displays, inset panels, code blocks |
| **Overlay** (pronounced elevation) | Temporary surfaces that demand attention and obscure content below | Modals, dropdown menus, tooltips, context menus, toast notifications |

### E.2 Hardware Realism Constraints

Antiphon references hardware without recreating it. The line between "premium material feel" and "skeuomorphic excess" is defined here:

**Allowed:**
- Bevel shadows on buttons and toggle controls to suggest physical depth (one pixel, low opacity)
- Inset shadows on input fields and meter displays to suggest recessed surfaces
- Subtle edge highlights (top edge lighter, bottom edge darker) on raised surfaces
- Background tier differentiation to create panel hierarchy

**Prohibited:**
- Texture overlays (brushed metal, carbon fiber, leather, wood grain)
- Noise or grain filters on surfaces
- Reflections, gloss, or shine effects
- Photorealistic hardware renderings as UI elements
- Skeuomorphic screws, rivets, or panel seams
- Gradients that simulate curvature on flat panels

**Subtlety threshold:** If a depth effect is visible at arm's length on a high-DPI display, it's too strong. Depth cues should be felt, not seen.

### E.3 Layering Rules

Layers stack in a strict priority order. Higher layers always obscure lower ones. No exceptions.

| Priority (highest to lowest) | Surface |
|---|---|
| 1 | System-level alerts (connection loss, critical errors) |
| 2 | Modal dialogs and confirmation prompts |
| 3 | Dropdown menus and context menus |
| 4 | Tooltips and popovers |
| 5 | Toast notifications (positioned to avoid obscuring modals) |
| 6 | Floating toolbars and action bars |
| 7 | Inspector panels and sidebars |
| 8 | Primary workspace content |
| 9 | Page background |

**Rules:**
- **Must** use a scrim (semi-transparent dark overlay) behind modals.
- **Must** dismiss lower-priority overlays when a higher-priority overlay opens (e.g., close tooltip when modal opens).
- **Should** limit simultaneous overlay layers to 2 (e.g., modal + its dropdown).
- **Avoid** stacking more than 2 overlay layers at any time.

### E.4 Edge Treatment

The system provides three methods for defining edges between surfaces. Use the lightest touch appropriate.

| Method | When to Use |
|---|---|
| **Negative space only** | Between sections of the same surface tier (e.g., list items) |
| **Subtle border** | Between adjacent panels of different tiers (e.g., sidebar and main content) |
| **Strong border** | Around focused, selected, or interactive elements; around modals |

**Rules:**
- **Must** use borders (not shadows alone) to separate adjacent panels.
- **Should** prefer negative space over borders within a single module.
- **Avoid** using both a border and a shadow on the same edge.
- **Avoid** colored borders except for focus states and error states.

### E.5 Focus and Interaction Visibility

Interactive elements must communicate their state without relying solely on color:

- **Focus:** A visible ring around the element, offset from its edge. Must be discernible on all background tiers.
- **Hover:** A subtle overlay that lightens the element's surface. Must be visible but not distracting.
- **Active / Pressed:** An inset appearance (shadow direction reversal or surface darkening).
- **Selected:** A tinted overlay using the accent overlay token, plus a border or background change.
- **Disabled:** Reduced opacity and muted surface. Must still be visible, not invisible.

### E.6 Must / Should / Avoid

**Must:**
- Use the correct depth level for every surface (flat, raised, inset, overlay)
- Apply scrim behind modals
- Maintain strict layering priority order
- Ensure focus states are visible on all background tiers

**Should:**
- Use bevel shadows only on controls that benefit from physical depth cues
- Prefer negative space over borders for intra-module separation
- Limit overlay stacking to 2 layers

**Avoid:**
- Texture, noise, grain, or gloss effects on any surface
- Photorealistic hardware elements as UI
- Both border and shadow on the same edge
- Stacking more than 2 overlay layers
- Gradients that simulate surface curvature

### E.7 Checklist

- [ ] Does every surface use the correct elevation token?
- [ ] Are modals using a scrim overlay?
- [ ] Is layering priority respected (no tooltip over modal)?
- [ ] Are edge treatments using the lightest appropriate method?
- [ ] Are focus rings visible on all background tiers?
- [ ] Is the hardware realism within the subtlety threshold?
- [ ] Are no textures, noise, or skeuomorphic elements present?
- [ ] Are disabled states visible (not invisible)?

---

## F. Motion and Interaction Rules

### Core Principle

Antiphon motion feels like a precision mechanism: damped, direct, and purposeful. Think of a high-end rotary encoder clicking into detents, or a fader reaching its destination without overshoot. Motion serves confirmation, not entertainment.

### F.1 Timing and Easing Philosophy

**Core characteristics:**
- **Damped:** Motion decelerates smoothly into its final position. No bounce, no elastic overshoot.
- **Brief:** Transitions resolve quickly. The user should never wait for an animation to finish before they can interact.
- **Purposeful:** Every animation answers the question "what just changed?" If it doesn't answer that question, remove it.

**Easing curve hierarchy:**
1. **Fast transitions** for small state changes (hover, focus, toggle): the shortest duration with a standard ease-out.
2. **Base transitions** for medium changes (panel expansion, tab switch, content reveal): moderate duration with ease-out.
3. **Slow transitions** for large layout changes (sidebar collapse, modal entrance, page transition): longer duration with ease-out.
4. **Damped transitions** for physics-referencing controls (knobs, faders, meters): the damped easing curve for a hardware feel.

**Prohibited easing behaviors:**
- Spring/elastic easing (bouncing)
- Linear easing on UI transitions (feels mechanical in a bad way)
- Easing curves with multiple oscillations
- Staggered entrance animations on list items (too playful)

### F.2 State Transitions

Every interactive element follows this state chain. Each transition uses the appropriate timing.

```
rest → hover → active/pressed → rest (or selected)
                                    ↓
                                 selected → hover → active/pressed → selected
                                    ↓
                                 disabled (no transitions, immediate)
                                    ↓
                                 loading (use pulsing indicator)
```

**Rules:**
- Hover states use the fast transition.
- Active/pressed states are immediate (no transition delay).
- Selected states use the base transition when entering, fast transition when toggling.
- Disabled states apply immediately with no animation.
- Loading states use a slow, looping opacity pulse — never a spinner unless the operation is network-bound.

### F.3 Micro-Interactions

| Element | Motion Behavior |
|---|---|
| **Toggle switch** | Thumb slides with damped easing. Background color transitions at base speed. |
| **Rotary knob** | Follows pointer with damped response. Value readout updates in real-time with no animation. |
| **Fader / slider** | Thumb tracks pointer directly with damped easing on release (settles into final position). |
| **Meter (level, gain reduction)** | Attack is immediate (no easing). Decay uses a slow ease-out to simulate ballistic response. |
| **Tooltip** | Appears after a brief delay. Fades in at fast speed. Disappears immediately on mouse-out. |
| **Toast notification** | Slides in from the edge at base speed. Auto-dismisses with a fade at slow speed. |
| **Dropdown menu** | Opens at base speed with a subtle vertical scale (95% → 100%). Closes at fast speed. |
| **Modal** | Fades in with a slight upward translation. Scrim fades in simultaneously. Closes at fast speed. |
| **Tab panel** | Content cross-fades at base speed. No sliding. |

### F.4 Animation Constraints

**When motion is prohibited:**
- During audio playback/recording when the screen is a performance-critical surface. Meters and playhead may animate; UI chrome must not.
- On canvas-rendered elements (waveform, spectrum analyzer) — animation is handled by requestAnimationFrame, not CSS transitions.
- When the user has enabled reduced motion preferences.

**Reduced motion guidance:**
- When `prefers-reduced-motion: reduce` is active, replace all transitions with immediate state changes (duration: 0).
- Meters and analyzers may continue to animate (they convey essential information) but should use reduced frame rates.
- Scrolling and panning remain smooth (they are user-initiated).

### F.5 Audio-Specific Motion

These rules apply to real-time audio visualization elements:

**Meters (level, gain reduction):**
- Attack time: immediate (within one animation frame).
- Release time: slow, with a logarithmic decay curve. The meter should "fall" at a rate that allows the user to read peak values.
- Peak hold: a peak indicator holds for a defined duration, then releases.

**Spectrum analyzers:**
- Update at a consistent frame rate, synchronized with the audio buffer.
- Use linear interpolation between frames to prevent visual stutter.
- Never drop below a minimum frame rate even if the audio engine is busy.

**Playhead / cursor:**
- Moves at a constant rate determined by tempo and zoom.
- Must not jitter, stutter, or drift from the audio position.
- Scrolling follows the playhead with damped easing (the view catches up to the playhead, not the other way around).

**Piano roll note drawing:**
- Note creation is immediate (no entrance animation).
- Note dragging/resizing tracks the pointer with no easing.
- Quantize snapping is immediate.

### F.6 Must / Should / Avoid

**Must:**
- Use damped easing for all physics-referencing controls (knobs, faders)
- Respect `prefers-reduced-motion` by eliminating decorative animations
- Ensure meters have immediate attack and slow release
- Keep playhead motion jitter-free and frame-accurate

**Should:**
- Use fast transitions for hover/focus state changes
- Use base transitions for content reveals and panel changes
- Use slow transitions only for large layout changes
- Provide a brief delay before showing tooltips

**Avoid:**
- Spring, bounce, or elastic easing on any element
- Staggered entrance animations for list items
- Decorative motion on audio-critical screens
- CSS transitions on canvas-rendered elements
- Spinners for non-network operations

### F.7 Checklist

- [ ] Do all transitions use the correct timing and easing tokens?
- [ ] Is damped easing applied to knobs, faders, and physical-feel controls?
- [ ] Are hover states using the fast transition?
- [ ] Are meter attacks immediate and releases slow?
- [ ] Is the playhead motion smooth and jitter-free?
- [ ] Is `prefers-reduced-motion` respected?
- [ ] Are there no bounce or elastic easing curves anywhere?
- [ ] Are audio-critical screens free of decorative animation?
- [ ] Do tooltips have an appearance delay?

---

## G. Content, Voice, and UI Copy Layout Rules

### Core Principle

Antiphon's voice is that of a senior audio engineer: precise, economical, and confident without being arrogant. Copy is a control — it has a label, a value, and a position. Words earn their place the same way pixels do.

### G.1 Labels, Helper Text, and Error Text

**Label placement:**
- Labels are positioned **above** their associated control, left-aligned with the control's left edge.
- Labels use the hardware-label style for dense control surfaces, standard body style for forms and settings.
- Labels are never positioned inline with or inside the control (no floating labels).

**Helper text:**
- Positioned **below** the control, left-aligned.
- Uses muted text color and a smaller size than the label.
- Provides format guidance, constraints, or context ("44.1–192 kHz", "Must be unique").
- Must not duplicate information already visible in the label.

**Error text:**
- Positioned **below** the control, replacing helper text when an error is active.
- Uses danger text color.
- Is specific and actionable: "Sample rate must be between 44.1 and 192 kHz" — not "Invalid value."
- Appears immediately on validation failure, not on form submission.

**Layout order (top to bottom):**
1. Label
2. Control
3. Helper text OR error text (never both simultaneously)

### G.2 Units and Telemetry Formatting

Audio software communicates in numbers. Formatting those numbers is a brand act.

**Decimal precision:**
- Frequency: one decimal place (44.1 kHz)
- Gain / level: one decimal place (-12.4 dB)
- Time: context-dependent (1:24:03 for long durations, 0.452s for short)
- BPM: integer unless subdivisions matter (120, or 120.00 for sync-critical displays)
- Percentage: integer (75%)

**Abbreviations:**
- Always use standard SI and audio abbreviations: Hz, kHz, dB, ms, s, BPM, MIDI
- No periods in abbreviations (dB, not d.B.)
- Space between value and unit (48 kHz, not 48kHz)

**Numeric column alignment:**
- Numeric values in columns or tables must right-align.
- Use monospace / telemetry styling for all numeric readouts.
- Decimal points must vertically align in columnar displays.

**Monospace usage:**
- All numeric readouts (meters, timecodes, BPM, sample rates)
- File paths and technical identifiers
- Code blocks and CLI commands
- Version numbers

### G.3 Icon + Label Pairing and Truncation

**Pairing rules:**
- Icons precede their label (icon left, label right) in LTR layouts.
- Icons and labels are vertically centered on the same baseline.
- Icons do not replace labels — they supplement them. An icon-only button must have an accessible text label.
- The spacing between icon and label is consistent within a component and across the system.

**Truncation behavior:**
- Labels truncate with an ellipsis when they exceed their container width.
- Truncation point is never within a word — truncate at word boundaries where possible.
- Truncated labels must reveal the full text on hover (tooltip).
- Critical labels (file names, preset names, project names) must provide a mechanism to see the full text.
- Numeric values and units are **never** truncated. If the space is too small for the value, the container must grow.

### G.4 Empty States and First-Run Layouts

Empty states are the first impression. They must feel like an intentional design, not an error.

**What must be present:**
- A clear, concise headline explaining the empty state ("No projects yet")
- A single primary action to resolve the empty state ("Create Project" button)
- Enough negative space to make the empty state feel calm, not broken

**What should be present:**
- A subtle illustration or icon (outline style, muted color) that references the content type
- A one-sentence description if the action needs context

**What must not be present:**
- Multiple competing CTAs
- Marketing language or upselling
- Placeholder or lorem ipsum content
- Animation or attention-seeking elements
- Error-like language ("Nothing here!", "Oops!")

### G.5 Must / Should / Avoid

**Must:**
- Position labels above controls, left-aligned
- Show error text immediately on validation failure, replacing helper text
- Right-align numeric values in columns and use monospace styling
- Include a space between value and unit
- Never truncate numeric values or units

**Should:**
- Use hardware-label styling for labels in dense control surfaces
- Provide tooltips for truncated text
- Format decimals consistently per data type
- Include one primary action in every empty state

**Avoid:**
- Floating labels or labels inside controls
- Duplicate information between label and helper text
- Generic error messages ("Invalid value")
- Multiple CTAs in empty states
- Italic text, marketing language, or exclamation points in UI copy

### G.6 Checklist

- [ ] Are labels above controls, left-aligned?
- [ ] Does error text replace helper text (not stack with it)?
- [ ] Are error messages specific and actionable?
- [ ] Are numeric readouts using monospace/telemetry styling?
- [ ] Do values have a space before their unit abbreviation?
- [ ] Are numeric columns right-aligned with aligned decimal points?
- [ ] Do truncated labels have tooltips?
- [ ] Are empty states calm, with one clear CTA?
- [ ] Are icon+label pairs consistently spaced and baseline-aligned?

---

## H. Platform-Specific Application Rules

### H.1 Marketing Site

The marketing site is the showroom. It must feel like entering a high-end audio showroom: dark, dramatic, precise, and quiet.

**Hero composition:**
- Full-viewport-height hero with centered content (bilateral symmetry).
- Display-size headline, one line of supporting body text, one primary CTA.
- Background: solid dark or a subtle product render. No video auto-play.
- Logo mark visible but not competing with the headline.

**Feature rows:**
- Alternating two-column layout: product screenshot/render on one side, text on the other.
- Image side fills its column; text side is vertically centered.
- Each feature row has: heading, 2-3 sentences of body copy, and optionally one secondary action.
- No more than 5 feature rows per page before a break (testimonial, CTA band, or footer).

**Pricing tables:**
- 2-3 tier columns, equally weighted, centered on the page.
- Current/recommended tier is visually distinguished with an accent border (not a background change).
- Feature lists use consistent check/dash indicators.
- Pricing uses display-size numbers with muted-color billing period text below.

**Testimonials:**
- Inset card, centered text, minimal visual treatment.
- Attribution line uses muted text with the person's name in primary text color.
- No photos of people unless they are known industry figures (and then, only dark/dramatic treatments).

**Documentation pages:**
- Narrow content container, left-aligned.
- Sidebar navigation for doc structure.
- Code blocks on inset backgrounds with monospace font.
- Headings follow the hierarchy rules in Section B.

### H.2 Web / Desktop App

The app is the workstation. It must feel like sitting down at a properly set up studio console.

**App shell:**
- Left sidebar for primary navigation (fixed width, collapsible on compact viewports).
- Top bar for context-specific actions, breadcrumbs, and global controls.
- Main workspace fills remaining space.
- Inspector panel on the right (fixed width, toggleable visibility).

**Sidebars:**
- Navigation sidebar: hardware-labeled section groups, icon + label items, single-level nesting only.
- Active item uses accent background, all others use transparent background with hover overlay.
- Bottom-pinned section for user profile and settings.
- Sidebar width accommodates the longest reasonable navigation label without truncation.

**Inspectors:**
- Single-column layout with vertically stacked control groups.
- Each group has a hardware label and a collapsible content area.
- Parameters within a group use consistent label-above-control layout.
- The inspector scrolls independently from the main workspace.

**Resizable split panes:**
- Dividers use the strong border color and a drag handle (6-dot grip pattern).
- Minimum pane widths must prevent controls from becoming unusable.
- Collapsed panes are fully hidden (no sliver or partial content).

**Toolbars:**
- Horizontal, single row, grouped into clusters of related actions.
- Groups are separated by a subtle vertical divider or negative space.
- Icon-only buttons in toolbars. Text labels appear in tooltips.
- Active/toggled tool states use accent overlay background.

### H.3 DAW Plugin UI

Plugin UIs are the most constrained surface — limited window size, no responsive flexibility, and a requirement for immediate parameter legibility.

**Compact header:**
- Plugin name (heading-small size) left-aligned.
- Preset selector adjacent to the name (dropdown).
- A/B comparison toggle, bypass toggle, and resize handle right-aligned.
- Header is visually separated from the parameter area with a subtle border.

**Preset browser:**
- Dropdown or expandable panel from the header.
- Categories as collapsible groups with hardware labels.
- Search field at the top.
- Current preset is visually highlighted with accent overlay.

**A/B and Bypass:**
- A/B toggle is a two-segment control. The active segment uses accent styling.
- Bypass button dims the entire plugin surface when engaged (overlay the entire plugin body with a muted, low-opacity scrim).
- Bypass state must be immediately visible at a glance.

**Meters:**
- Vertical orientation for level meters, horizontal for gain reduction.
- Peak hold indicators use accent color.
- Meter backgrounds are inset.
- Labels (dB scale markings) use micro-size monospace text.

**Parameter groups:**
- Related parameters are contained in visually bounded modules.
- Each module has a hardware-style label.
- Knobs and sliders within a module are laid out on a consistent grid.
- Value readouts appear directly below each knob/fader in telemetry styling.

**The Parameter Legibility Law:**
Every user-facing parameter must satisfy ALL of the following:
1. **Name:** A clear, concise label is always visible (not hidden behind hover).
2. **Value:** The current numeric value is always displayed, in monospace, with its unit.
3. **Unit:** The unit abbreviation is always present and standard.
4. **Range:** The min/max range is discoverable (via tooltip or visual endpoint labels).
5. **Default:** A mechanism to reset to default exists (double-click, right-click menu, or dedicated control).
6. **Grouping:** The parameter belongs to a clearly labeled group of related parameters.

### H.4 Hub / Plugin Manager

The Hub is a storefront and system manager. It must feel organized, trustworthy, and efficient.

**Tiles vs. List view:**
- Provide both view options with a toggle in the toolbar.
- Tile view: product image, name, version, and status badge in a grid layout.
- List view: name, version, status, file size, and actions in a table row.
- Default to tile view for browsing, list view for management.

| If the user is... | Default to... |
|---|---|
| Browsing available products | Tile view with large product imagery |
| Managing installed products | List view with sortable columns |
| Checking for updates | List view filtered to "updates available" |

**Status hierarchy:**
Displayed as badges with the appropriate semantic color:

| Status | Visual Treatment |
|---|---|
| Update Available | Warning badge |
| Installed / Up to Date | Success badge |
| Not Installed | Neutral / muted badge |
| Installing / Updating | Accent badge with progress indicator |
| Error / Failed | Danger badge |
| License Expired | Danger badge |

**Update / Install flows:**
- Install/update actions are primary buttons, one per product.
- Batch actions ("Update All") are placed in the toolbar, not on individual tiles.
- Progress is shown inline (progress bar replacing the action button during download/install).
- Success confirmation is a transient toast, not a modal.
- Failure shows an inline error message with a "Retry" action.

**License panels:**
- License status is displayed in the product detail view or a dedicated tab.
- Active licenses show expiration date in muted text.
- Expired licenses use danger text and provide a clear renewal CTA.
- License key display uses monospace text with a copy-to-clipboard action.

**Notifications:**
- System notifications appear as toasts (bottom-right corner).
- Persistent notifications (license expiry, critical updates) appear as a banner at the top of the main content area.
- Notification badges on the sidebar navigation icon show unread count.

---

## I. Quality Gates and Brand Linting

### Core Principle

Brand consistency degrades incrementally. These checklists catch drift before it compounds. Run them at design review, PR review, and release QA.

### I.1 Hierarchy Sanity Checks

| Check | Pass | Fail |
|---|---|---|
| Hierarchy levels per module | 3 or fewer | 4+ levels visible simultaneously |
| Primary action clarity | One obvious primary action per view | Multiple competing primary buttons, or no primary action |
| Title uniqueness | One title per section | Multiple elements competing for title status |
| Emphasis stacking | One emphasis method per text element | Bold + caps + accent color on same text |
| Display type usage | Marketing/hero only | Display sizes in app UI or plugin |
| Hardware label usage | Section headers and metadata only | Hardware labels used as body text or titles |

### I.2 Density Checks

| Check | Pass | Fail |
|---|---|---|
| Intra-module spacing | Consistent within each module | Mixed spacing values within a single module |
| Inter-module spacing | Consistent between peer modules | Uneven gaps between cards/panels |
| Control group density | 5-7 controls per module max | 8+ controls in a single bounded module |
| Marketing section spacing | Generous, using larger spacing tokens | Marketing pages using app-density spacing |
| Plugin parameter density | Tight but readable, all values visible | Parameters overlapping or values truncated |

### I.3 Module Segmentation Checks

| Check | Pass | Fail |
|---|---|---|
| Module boundaries | Every control group has a clear visual boundary | Controls floating without group association |
| Module labeling | Every bounded module has a hardware-style label | Unlabeled modules, or labels that don't match content |
| Module consistency | Peer modules use the same visual treatment | Mixed card variants at the same hierarchy level |
| Nesting depth | Max 1 level of module nesting | Modules inside modules inside modules |

### I.4 Interaction Clarity Checks

| Check | Pass | Fail |
|---|---|---|
| Hover feedback | All interactive elements show hover state | Clickable elements with no hover feedback |
| Focus visibility | Focus ring visible on all backgrounds | Focus ring invisible on dark or accent backgrounds |
| Selected vs. focused | Selected and focused states are visually distinct | Selected and focused look identical |
| Disabled appearance | Disabled elements are visible but clearly non-interactive | Disabled elements are invisible, or look interactive |
| Active / pressed | Active state is visually distinct from hover | No visual change between hover and click |
| Loading indication | All async operations show loading state | Actions with no feedback during loading |

### I.5 Accessibility Gates

| Check | Pass | Fail |
|---|---|---|
| Text contrast | Primary text on all backgrounds meets WCAG AA (4.5:1) | Text below contrast ratio on any background tier |
| Interactive contrast | Interactive elements meet WCAG AA for non-text (3:1) | Controls that blend into their background |
| Focus indication | Focus ring is a 2px solid outline with offset, visible on all backgrounds | No focus indication, or focus only visible on some backgrounds |
| Keyboard navigation | All interactive elements are reachable and operable via keyboard | Keyboard traps, unreachable controls, or non-operable elements |
| Reduced motion | `prefers-reduced-motion` removes all decorative animation | Animations persist despite user preference |
| Screen reader labels | All icon-only buttons have `aria-label` or `sr-only` text | Icon-only buttons with no accessible name |
| Color independence | Information is not conveyed by color alone (shape, text, or position supplement) | Status communicated only through color (no badge text, no icon) |
| Touch targets | Interactive elements meet minimum touch target guidelines | Tiny buttons or closely packed interactive elements |

### I.6 Brand Consistency Gates

| Check | Pass | Fail |
|---|---|---|
| Logo clear space | Minimum clear space maintained around logo | Elements crowding the logo mark |
| Color usage | Only defined color tokens used, accent used sparingly | Custom colors, accent overuse, or undefined values |
| Typography | Only defined type scale used, no custom sizes | Custom font sizes, weights, or families |
| Border radii | Only defined radius tokens used | Custom border radius values |
| Shadows | Only defined shadow tokens used | Custom shadows or non-token elevation |
| Spacing | Only defined spacing scale used | Arbitrary spacing values |
| Icon style | All icons use monoline, square cap, miter join | Rounded-cap icons, filled-by-default icons, mixed styles |
| Voice and tone | Copy is precise, economical, and professional | Playful, casual, or marketing-heavy language in UI |

### I.7 Complete Review Checklist

Use this master checklist at every design review and release QA milestone:

**Layout and Composition:**
- [ ] Symmetry applied correctly for the surface type
- [ ] Correct scan pattern (F for marketing, Z for app)
- [ ] Module-bay layout used for control surfaces, editorial for content
- [ ] Logo clear space maintained
- [ ] No more than 3 hierarchy levels per module

**Visual Treatment:**
- [ ] All surfaces use correct elevation tokens
- [ ] Edge treatments use the lightest appropriate method
- [ ] No textures, noise, gloss, or skeuomorphic elements
- [ ] Hardware realism is within the subtlety threshold
- [ ] Data visualizations follow chart density rules

**Typography and Content:**
- [ ] Only defined type scale sizes used
- [ ] Labels above controls, left-aligned
- [ ] Numeric readouts in monospace with units
- [ ] Error messages are specific and actionable
- [ ] Empty states have one clear CTA

**Interaction:**
- [ ] All interactive elements have hover, focus, active, and disabled states
- [ ] Focus ring visible on all background tiers
- [ ] Damped easing on physical-feel controls
- [ ] No bounce or elastic animations
- [ ] `prefers-reduced-motion` respected

**Accessibility:**
- [ ] Contrast ratios meet WCAG AA
- [ ] All icon-only buttons have accessible labels
- [ ] Keyboard navigation reaches all interactive elements
- [ ] Color is not the sole indicator of state or status
- [ ] Touch targets meet minimum size guidelines

**Platform Compliance:**
- [ ] Marketing pages use spacious density with display typography
- [ ] App surfaces use hardware-dense layout with proper inspector/sidebar patterns
- [ ] Plugin UIs satisfy the Parameter Legibility Law
- [ ] Hub surfaces provide both tile and list views with correct status badges

---

*These guidelines are a living document. As the Antiphon design system evolves, update this document to reflect new patterns and deprecate old ones. Every rule exists for a reason — if a rule doesn't serve the product, challenge it with evidence and update it through the design review process.*

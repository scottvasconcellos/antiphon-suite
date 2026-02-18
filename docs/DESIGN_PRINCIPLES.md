# Antiphon Design Principles — Layout, Hierarchy & Visual Consistency

**Design captain reference.** When you are told to "design based on our design principles" or to keep UIs "visually consistent with Antiphon," use this document and the linked resources. It defines layout patterns, typography roles, and hierarchy so all apps and web surfaces feel like one product.

**Canonical layout reference:** The Antiphon mock website (`New Branding/antiphon_mock_website.html`) is the visual target: dark theme, modular cards, clear hierarchy, restrained motion. This doc codifies what that mock does so agents and developers can replicate it without the HTML in hand.

---

## Quick reference for agents

**When building a new page or app that should look like Antiphon:**

1. **Theme:** Dark by default. Use tokens: `--color-bg-page` / `--color-bg-surface` for backgrounds; `--color-text-primary` / `--color-text-secondary` / `--color-text-muted` for text; `--color-accent-warning` (gold/amber) for primary actions; `--color-accent-primary` (blue) and `--color-accent-success` (green) for data/charts.
2. **Layout:** One topbar (logo + nav + optional pill), then vertical sections. Each section has one section title (H2), optional subtitle (muted), then content in a grid or stack. Use cards for modules; put smaller cards inside a section card when you need "cards inside a card."
3. **Hierarchy:** Max 3 levels per module. One title per section. Primary button = one per view for the main action; secondary = border-only for secondary actions.
4. **Typography:** H1 = hero/page title only (large). H2 = section title. H3 = card title. Body = descriptions. Muted = timestamps, labels, hints. Use the design system type scale; no custom sizes.
5. **Logo:** Place the Antiphon logo in the **top-left of the header** (see [Logo placement](#logo-placement) below). Asset path: `packages/design-system/src/assets/` (e.g. `logo.svg` or `logo.png`).
6. **Full rules:** For depth, motion, accessibility, and voice, see `packages/design-system/src/guidelines/Guidelines.md`.

---

## Layout patterns (from the mock)

### Page structure

- **Topbar (header):** Full width. Left: **logo + brand wordmark**. Center/right: **nav links** (e.g. Platform, Workflow, Pricing, Docs). Far right: optional **pill/badge** (e.g. "Mock v1 - Website Concept") — subtle border, muted background, rounded-full.
- **Hero:** Optional. Two-column grid: **hero copy** (eyebrow badge, H1, paragraph, primary + secondary buttons, optional motion chips) and **hero panel** (e.g. "Live Session Insight" with chart + stat cards). Both in rounded cards with subtle border and gradient surface.
- **Sections:** Repeated pattern:
  - **Section title** (H2, one per section).
  - Optional **subtitle** (muted, one line).
  - **Content:** grid or stack of cards/modules.
- **Cards inside a card:** For "Platform Snapshot" style: one outer card (section container) with border and padding; inside it, a grid with e.g. a **timeline** (list with time + event) and a **stack** of small **stack-cards** (title + progress bar + muted caption). Use inner cards with same border/radius language but slightly lighter or inset background so hierarchy is clear.
- **Pricing:** Three-column grid of **plan cards**. One plan can be **featured** (accent border, warm gradient background). Each: plan name (muted), big price, feature list.
- **CTA band:** Full-width card with gradient background, headline, short copy, and one primary button (e.g. "Request Build Sprint").
- **Footer:** One row, muted text, optional left/right copy (e.g. tagline and "Design direction: dark, restrained, weighted motion.").

### Spacing and containment

- **Page:** Constrain main content to a max width (e.g. 1440px or 1200px), center, with horizontal padding (e.g. 24px–32px). Vertical rhythm: generous space between sections (e.g. 32px–48px).
- **Cards:** Consistent border radius (e.g. 14px–20px for section cards, 12px–16px for inner cards). Border: 1px solid `--color-border-subtle`. Background: surface or gradient (dark, low saturation).
- **Gaps:** Use a spacing scale (e.g. 8, 12, 16, 24, 32). Between cards in a grid: 14–16px. Inside cards: 14–22px padding.

---

## Typography roles

| Role | Use for | Token / class | Notes |
|------|--------|----------------|-------|
| **Page title (H1)** | Hero headline, single main title per page | Display / large heading | One per page; white, bold, tight letter-spacing |
| **Section title (H2)** | "Built For…", "Platform Snapshot", "Simple Pricing…" | Section title, ~30px | White, bold; one per section |
| **Card title (H3)** | Feature card titles, stack-card titles, plan names | Heading medium, ~18–20px | White for titles; muted for plan name label above price |
| **Eyebrow** | Category label above hero title (e.g. "SOUND-FIRST PRODUCT SUITE") | Small, uppercase, letter-spacing, pill-style | Accent border + muted or gold text; rounded-full |
| **Body** | Paragraphs, list items, descriptions | Body, primary or secondary color | Max width for readability (~60–75 chars) in long copy |
| **Muted** | Timestamps, captions, "Target band: 80–92%", helper text | Small, `--color-text-muted` | Never for primary info |
| **Pill / badge** | Context badge in header, motion chips | Small, rounded, border, muted bg | e.g. "Mock v1", "Card Enter: 300ms spring" |
| **Stat value** | Big numbers in stat cards (e.g. "98.4%", "146ms") | Large, bold, white | Label below in muted |

Use only the design system type scale and tokens; do not introduce custom font sizes or weights.

---

## Buttons and badges

- **Primary button:** Solid background (gold/amber gradient or `--color-accent-warning`), dark text (`--color-text-inverse`). Rounded (e.g. 10px). One primary CTA per view when possible.
- **Secondary button:** Transparent or very subtle background, border (`--color-border` or `--color-border-strong`), white/muted text. Same radius as primary.
- **Eyebrow badge:** Uppercase, small, letter-spacing; border with accent tint; rounded-full; above H1.
- **Pill (header):** Small rounded-full pill, subtle border, muted background, secondary text — for status or context, not primary nav.

---

## Badges, alerts, and banners

Design and behavior for status badges, inline alerts, persistent banners, and toasts. Use these so messaging is consistent across Hub and apps.

### Status badges

- **Component:** `@antiphon/design-system` → `Badge`. Variants: `default` (muted), `success`, `warning`, `danger`, `info`. Sizes: `small` (10px, tight padding), `default` (xs, px-2 py-1). Style: inline-flex, rounded-sm, border, font-medium, uppercase, tracking-wider; variant uses semantic background tint + border + text color (e.g. success = accent-success/10 bg, accent-success text).
- **When to use:** Status on tiles/cards (e.g. install state, update available), list rows, or nav (e.g. unread count). Never rely on color alone — badge must have text or icon so meaning is clear (accessibility).
- **Hub status mapping** (from Guidelines):
  | Status | Badge variant |
  |--------|----------------|
  | Update Available | `warning` |
  | Installed / Up to Date | `success` |
  | Not Installed | `default` (muted) |
  | Installing / Updating | `info` (accent) + progress indicator |
  | Error / Failed | `danger` |
  | License Expired | `danger` |

### Inline alerts

- **Component:** `@antiphon/design-system` → `Alert`, `AlertTitle`, `AlertDescription`. Variants: `default`, `destructive`. Use for inline callouts (e.g. validation message, warning or error in a form or section). Optional leading icon; layout supports icon + title + description.
- **Behavior:** Static block in the layout; `role="alert"` for screen readers. Use for content that must be read immediately (errors, critical notices). Not auto-dismissing.

### Banners (persistent)

- **When to use:** Persistent, high-visibility messages at the **top of the main content area** (e.g. license expiry, critical update, connection loss). One banner at a time; full-width or contained in content column.
- **Behavior:** Stays until the user dismisses or the condition is resolved. Use strong border or background (e.g. danger for critical, warning for expiry). Include a short message and one primary action (e.g. "Renew", "Refresh"). Do not stack multiple banners; prioritize the most critical.

### Toasts (transient notifications)

- **Component:** `@antiphon/design-system` → `Toast` (and/or Sonner `Toaster`). Types: `success`, `warning`, `error`, `info`. Optional link; optional persistent (no auto-dismiss); `autoFadeMs` (default 4000).
- **Placement:** **Bottom-right** corner of the viewport (or app content area). Layer below modals (toasts do not obscure dialogs).
- **Motion:** Slide in from the edge (e.g. translateX 20px → 0), 200ms ease-out. On dismiss: fade/slide out, ~200ms ease-in. Guidelines: "Slides in from the edge at base speed. Auto-dismisses with a fade at slow speed."
- **Behavior:** Success/install confirmations = transient toast (auto-dismiss). Errors = persist until dismissed (`persistent` or treat `type === 'error'` as persistent). One-line message; optional action link. Do not use for critical blocking issues — use a modal or banner instead.

### Quick reference

| Pattern | Where | Behavior |
|--------|--------|----------|
| Status badge | On cards, rows, nav | Semantic variant + text/icon; no auto-dismiss |
| Pill (header) | Topbar right | Context label only (e.g. "Mock v1") |
| Inline alert | In form or section | Static, role=alert; default or destructive |
| Banner | Top of main content | Persistent until dismiss; one at a time |
| Toast | Bottom-right | Transient (or persistent for errors); slide in/out |

---

## Cards and modules

- **Section card:** Wraps a whole section (e.g. platform snapshot). Border, rounded (16–20px), padding 22–28px, gradient or surface background.
- **Feature card:** Title (H3) + body paragraph. Same border/radius language; padding ~18px. Use in a 3-column grid for "Built For…" style.
- **Stack card:** Small card inside a section: title (H3) + progress bar or key metric + muted caption. Stack vertically with gap ~10px.
- **Stat card:** Big number + muted label. Inset border, rounded, used in a row (e.g. 3 columns) inside a hero panel.
- **Plan card:** Plan name (muted), price (large bold), feature list. Featured plan: accent border + warm gradient background.

Cards inside a card: inner cards use same radius (or slightly smaller), subtle border, and a slightly lighter or inset background so the nesting is clear.

---

## Data visualization

- **Bars / meters:** Use `--color-accent-primary` to `--color-accent-success` gradient for fills. Background: subtle (e.g. rgba white 0.04–0.08). Rounded ends (e.g. border-radius 999px for bars).
- **Charts:** Minimal decoration; hardware-label style for axis labels; telemetry/monospace for values. Inset background behind chart area.

---

## Logo placement

- **Where:** **Top-left of the header (topbar)**. Logo appears first, then the wordmark "ANTIPHON" (or app title) with consistent spacing (e.g. 12px gap).
- **Asset:** Place the Antiphon logo file in **`packages/design-system/src/assets/`** (e.g. `logo.svg` or `logo.png`). Use this asset in the header of the Hub, marketing pages, and any app shell that shows the Antiphon brand.
- **Fallback:** If no logo asset is present, the mock uses a **gradient dot** (gold-to-blue circle, 14px) next to the wordmark. You can keep this as fallback for development or until the final logo is in place.
- **Clear space:** Maintain minimum clear space around the logo (at least the height of the logo’s crossbar or equivalent on all sides). See `packages/design-system/src/guidelines/Guidelines.md` (Logo clear space).

---

## Token mapping (mock → design system)

Use the design system tokens so all apps stay consistent. Prefer these over the mock’s local variable names where applicable:

| Mock (concept) | Design system token / usage |
|----------------|-----------------------------|
| Dark page background | `--color-bg-page`, `--color-bg-app-shell` |
| Card/surface background | `--color-bg-surface`, `--color-bg-surface-elevated` |
| Inset / input areas | `--color-bg-inset` |
| Primary text | `--color-text-primary` |
| Secondary text | `--color-text-secondary` |
| Muted / tertiary | `--color-text-muted` |
| Borders | `--color-border-subtle`, `--color-border-strong` |
| Primary CTA / gold accent | `--color-accent-warning` |
| Data / links / accent | `--color-accent-primary`, `--color-accent-success` |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Shadows | `--shadow-raised`, `--shadow-overlay`, `--shadow-inset` |

Full token set: `ANTIPHON_COLOR_TYPE_STYLE_GUIDE/palette.json`, `packages/design-system` (tokens, CSS variables, Tailwind config).

---

## Motion (restrained, weighted)

- **Direction:** Dark, restrained, weighted motion. No bounce or playful spring; damped, purposeful transitions.
- **Hints in mock:** "Card Enter: 300ms spring(120/20)", "Button Press: 80ms sharp", "Modal Enter: 350ms easeOut" — use short, deliberate timings; prefer ease-out over elastic.
- **Full motion rules:** See `packages/design-system/src/guidelines/Guidelines.md` (Section F). Respect `prefers-reduced-motion`.

---

## Accessibility

- **Contrast:** WCAG AA for text and interactive elements. Use the defined palette; avoid custom colors that reduce contrast.
- **Focus:** Visible focus outline on all interactive elements (e.g. `--color-border-focus`).
- **Reduced motion:** Honor `prefers-reduced-motion: reduce` for decorative animations.

---

## Where to find more

| Need | Location |
|------|----------|
| **This doc (layout, hierarchy, quick ref)** | `docs/DESIGN_PRINCIPLES.md` |
| **Full brand and behavior rules** | `packages/design-system/src/guidelines/Guidelines.md` |
| **Components and tokens in code** | `packages/design-system` (Storybook: `pnpm storybook` from repo root) |
| **Visual layout reference** | `New Branding/antiphon_mock_website.html` (outside repo: Antiphon-Suite/New Branding) |
| **Color/radius/shadow tokens** | `ANTIPHON_COLOR_TYPE_STYLE_GUIDE/` (palette.json, radius.json, shadows.json) |

When in doubt: keep hierarchy to 3 levels, one primary action per view, dark theme with our tokens, and logo in the top-left. Then align with the mock and the full Guidelines for depth, motion, and voice.

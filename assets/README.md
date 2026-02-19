# Shared assets

**Canonical location for Antiphon Studios brand and other shared assets.** All apps in the monorepo should pull from here so one source of truth is used everywhere.

## Brand logos (`brand/`)

Transparent PNGs, legible on both dark and bright backgrounds (aligned with the Antiphon color palette):

| File | Use when |
|------|----------|
| `brand/logo-for-dark-bg.png` | Dark UI (e.g. Hub shell, dark theme) |
| `brand/logo-for-bright-bg.png` | Light UI (e.g. light theme, print) |
| `brand/logo-mark-only.png` | Icon-only / favicon / compact spaces (no wordmark) |

Use the variant that matches your background for best contrast and legibility.

## Adding more assets

This folder is the starting point for more PNG (or other) assets. Add new subfolders as needed (e.g. `brand/`, `icons/`, `illustrations/`) and keep this README updated. Apps can reference assets by path relative to the monorepo root (`assets/...`) or copy into their `public/` / build output at build time.

## How apps use these

- **Web (Vite, etc.):** Copy `assets/brand/*` into your app’s `public/` (e.g. `public/brand/`) so they are served at `/brand/...`, or configure your bundler to expose the monorepo `assets` directory.
- **Electron / native:** Reference the repo path to `assets/` at build or runtime.
- **Design system / docs:** Import or link to `assets/brand/` so components and storybook use the same files.

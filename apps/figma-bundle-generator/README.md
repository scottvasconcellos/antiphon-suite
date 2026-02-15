# Figma Bundle Generator

Lightweight local utility that turns a **Figma-exported design system ZIP** (Vite/React/TSX) into a **Cursor-ingestible Design system bundle**. No Figma API, no manual cleanup.

## One icon, double-click

- **From repo**: Run `pnpm dev:figma-bundle` from the monorepo root, then open http://localhost:5173
- **Double-click launcher**: Open `Launch Figma Bundle Generator.command` (in this folder) in Finder and double-click it. A terminal will start the app and open the browser.

## Usage

1. Double-click the app (or run `pnpm dev:figma-bundle` and open the URL).
2. Drop a Figma export ZIP onto the drop zone, or double-click/click to choose a file.
3. The app validates the export (needs `package.json` and `src/`), then builds the Design system bundle and downloads it as a ZIP.

## Output bundle (per spec)

- **INPUT/** — Your original ZIP (preserved).
- **MANIFEST/** — `manifest.json` (inventory: components, styles, tokens, assets, docs), `fingerprint.json` (hashes, identity).
- **DIFF/** — `diff.json` and `diff.md` (vs prior import; first run = initial).
- **DOCS/** — Guideline docs from the export (unchanged).
- **CURSOR/** — Playbook and first-time setup so Cursor can apply the design system without custom prompts.
- **START_HERE.md** — Human-oriented intro.

Drop the generated bundle into your Cursor-opened repo and use the `CURSOR/` playbook to apply the latest design system (last import wins, one active version).

## Desktop app and delivery (.dmg / .exe)

The app can run as a small desktop window (Electron). To run it locally after building: `pnpm build && pnpm electron`. If Electron fails to start, run `pnpm approve-builds` then `pnpm install` so the Electron binary can be downloaded.

**Build installers:**

- **macOS (.dmg):** From this folder run `pnpm dist:mac`. The `.dmg` is written to `release/`.
- **Windows (.exe):** On Windows run `pnpm dist:win`. The NSIS installer is in `release/`. Building the Windows target on macOS is possible but building on Windows is most reliable.

Output filenames use the convention `DesignSystem-{exportName}-{YYYY-MM-DD}.zip`.

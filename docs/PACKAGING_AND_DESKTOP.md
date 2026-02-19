# Packaging and Desktop App (Ship Readiness)

This doc outlines how to get the Hub to ship as a native desktop app with installers and the UX you want.

## Current state

- **Hub** is a Vite + React web app. It builds to static assets (`apps/layer0-hub/dist/`) and is typically run in a browser or served by a static host.
- **Authority** is a Node server (entitlements, auth). It is separate from the Hub; the Hub talks to it via configurable URLs.
- There is **no desktop shell yet**: no .app bundle, .dmg, or .exe. To get “borderless window”, “launch at login”, and “helper icon”, the Hub needs to run inside a **desktop runtime**.

## Two installer paths

### 1. Mac: .app + .dmg

- **Option A – Electron:** Wrap the Hub (and optionally a minimal in-process or local Authority) in Electron. One codebase; different packaging.
  - **.app:** Build with `electron-builder` (or similar); output is `Antiphon Manager.app`.
  - **.dmg:** Use the same tool to produce a .dmg from the .app for distribution.
- **Option B – Tauri:** Same idea but with Tauri (Rust + webview). Lighter binaries; more setup for native APIs.
- **Window:** Use the framework’s window API for a **borderless** window with **rounded corners**. Put **traffic-light buttons** (close / minimize / maximize) in the top-left, **inside** the window chrome (like your reference), not in the OS title bar.
- **Launch at login:** Use Electron’s `app.setLoginItemSettings({ openAtLogin: true })` or Tauri’s equivalent so the app (or a small launcher) starts at login.
- **Helper / menu bar:** A small “helper” process or **menu bar extra** that:
  - Keeps the user “logged in” (e.g. holds a session or token).
  - Periodically **checks for updates** (and optionally **auto-installs** if the user has the toggle on).
  - Can open the main Hub window when clicked.
- **Auto-install updates:** Implement an in-app **toggle** (e.g. in Preferences). When on, after the helper (or main app) detects an update, it downloads and applies it (e.g. quit, replace .app, relaunch) using the same installer/updater the framework provides.

### 2. Windows: .exe + startup

- **Same desktop runtime:** Electron or Tauri so you have one codebase for UI and window behavior.
- **.exe:** Build with electron-builder (or Tauri) to produce a Windows installer (.exe or MSI).
- **Startup:** Use the framework’s API to add a **startup entry** (e.g. registry or startup folder) so the app (or launcher) runs at logon, with user consent or an in-app toggle.
- **Background / helper:** Same idea as Mac: a small background process or system tray icon that stays running, checks for updates, and can open the main window. Optionally use a **Windows service** for update checks only if you need to run without a user session; usually a tray app is enough.
- **Prompts:** On first run (or in Settings), **prompt** the user: “Start Antiphon Manager when I log in?” and “Run in background to check for updates?” with toggles and clear “Turn on / Turn off” so they can align with OS settings (e.g. Windows “Startup” in Task Manager).

## Borderless “rounded module” look

- **Goal:** No OS title bar; window is just a rounded rectangle; traffic lights (Mac) or close/minimize/maximize (Windows) are **inside** the window, top-left, matching your card/module style.
- **Implementation:** In Electron: `BrowserWindow` with `frame: false`, `transparent: false`, and a custom draggable region; draw the buttons in HTML/CSS or a native overlay. In Tauri: frameless window + same idea. Use your existing design tokens and rounded corners so the window matches the rest of the UI.
- **One size (Mac):** You can default to a single window size and skip “dots” (e.g. fullscreen control) if you prefer; the maximize button can still fullscreen or maximize as needed.

## Alignment with “layer zero”

- **Ship:** Foundation smoke (build, typecheck, control-plane, structure, Hub test, Authority contracts) is the current “debug for the whole app” run; it passed and is the baseline for a green build.
- **.dmg and .exe** are **two different processes** (Mac vs Windows) but can share one **desktop wrapper** (Electron or Tauri) and one **packaging pipeline** (e.g. electron-builder with targets `dmg` and `nsis`/`exe`).
- **Next steps:** (1) Add an Electron or Tauri shell around the Hub (and optionally a bundled Authority or config to point to a hosted one). (2) Implement borderless window + in-window buttons. (3) Add launch-at-login + helper (Mac) and startup + tray (Windows). (4) Add auto-update + in-app toggle. (5) Wire build to produce .app/.dmg and .exe and run foundation smoke (and any new desktop tests) before each release.

## Update feed (electron-updater)

The desktop app uses `electron-updater`. It runs only when the app is **packaged** (not in dev). To enable updates you must publish installers to a URL and configure the build:

- In `apps/layer0-hub/package.json` under `"build"`, add a `"publish"` entry, e.g. `"publish": { "provider": "generic", "url": "https://your-cdn.com/releases" }`. Without this, no update check is performed.
- Preferences → Desktop app: **Automatically install updates** (default off). When on, updates are downloaded in the background and applied on quit, or the user can click **Restart to update** when an update is ready.

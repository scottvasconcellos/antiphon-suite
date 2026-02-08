# Antiphon Hub – Manager App Specification

**Version 1.0 | February 2026**  
**Complete Technical & Design Specification**

---

## Executive Summary

The **Antiphon Hub** is the central manager app for the Antiphon music production suite. It handles:

1. **Authentication** – Single sign-on for all Antiphon apps
2. **Installation** – Download and install apps from central repository
3. **Updates** – Auto-update system for all installed apps
4. **Licensing** – Perpetual license validation and management
5. **Launcher** – Single place to launch all installed apps

**Platform:** Desktop (macOS, Windows)  
**Tech Stack:** React + Vite + Tauri (Rust backend)  
**Architecture:** Monorepo, shared SDK, modular services

Think of it as **iZotope Product Portal** or **Native Access** but for Antiphon tools.

---

## Table of Contents

1. [Product Definition (Layer 0)](#product-definition-layer-0)
2. [Technical Foundation (Layer 1)](#technical-foundation-layer-1)
3. [Architecture (Layer 2)](#architecture-layer-2)
4. [Data Models (Layer 3)](#data-models-layer-3)
5. [User Interface Flows (Layer 4)](#user-interface-flows-layer-4)
6. [Integration Points (Layer 5)](#integration-points-layer-5)
7. [Design Specifications (Layer 6)](#design-specifications-layer-6)
8. [API Reference](#api-reference)
9. [Registry Schema](#registry-schema)
10. [Security & Licensing](#security-licensing)

---

## Product Definition (Layer 0)

### Point of the App

**One-sentence description:**
> "Antiphon Hub manages installation, updates, and licensing for all Antiphon music tools—users authenticate once, see owned products, and install/launch apps from one central location."

### User Outcome

**What the user achieves:**
> "A music producer downloads Antiphon Hub, logs in with their account, sees their purchased apps, clicks 'Install All,' and launches tools directly from the Hub—no hunting for installers or license keys."

### Non-Negotiables

**Technical constraints:**
- Must work offline (after initial auth)
- Must support perpetual licenses (no subscription required)
- Must handle auto-updates without breaking workflow
- Must integrate with Tauri-based apps (no Electron apps)
- Must store licenses securely (encrypted local storage)

**Business constraints:**
- Single app manages entire suite (not per-app installers)
- Must prevent piracy (license validation)
- Must support future apps without Hub changes (registry-based discovery)

### MVP Scope

**Must ship:**
- Authentication (login/logout)
- App discovery (see available + owned apps)
- Install/uninstall apps
- Launch installed apps
- Update all apps
- License validation

**Later scope:**
- Settings (themes, update preferences)
- Analytics dashboard (usage stats)
- Plugin marketplace (paid add-ons)
- Community features (presets, tutorials)

### Kill List (What We Are NOT Building)

❌ NOT a DAW or audio editor  
❌ NOT a preset manager or content library  
❌ NOT a cloud storage system  
❌ NOT a social network or forum  
❌ NOT a web app or mobile app  
❌ NOT a subscription service (perpetual licenses only)  

---

## Technical Foundation (Layer 1)

### Technology Stack

**Frontend:**
- React 18+ (UI framework)
- Vite 5+ (build tool)
- TypeScript (type safety)
- Framer Motion (animations)
- TanStack Query (data fetching)

**Backend:**
- Tauri 2.x (Rust + WebView)
- `tauri-plugin-fs` (filesystem access)
- `tauri-plugin-http` (network requests)
- `tauri-plugin-store` (encrypted local storage)
- `tauri-plugin-shell` (launch apps)

**Styling:**
- CSS Modules (scoped styles)
- Design tokens (shared variables)
- Antiphon Design System (see `ANTIPHON_DESIGN_ANIMATION_SYSTEM.md`)

### Repository Structure

**Monorepo layout:**

```
antiphon-suite/
├── packages/
│   ├── hub/                    # Hub manager app
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── services/       # API, filesystem, auth
│   │   │   ├── domain/         # Business logic
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── App.tsx         # Root component
│   │   ├── src-tauri/          # Rust backend
│   │   │   ├── src/
│   │   │   │   ├── main.rs     # Entry point
│   │   │   │   └── commands/   # Tauri commands
│   │   │   └── Cargo.toml
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── sdk/                    # Shared client SDK
│   │   └── src/
│   │       ├── auth.ts         # Auth utilities
│   │       ├── registry.ts     # Registry API
│   │       └── index.ts
│   └── ui-components/          # Shared React components
│       └── src/
│           ├── Button.tsx
│           ├── Card.tsx
│           └── Modal.tsx
├── shared/
│   ├── types/                  # Shared TypeScript types
│   │   ├── App.ts
│   │   ├── User.ts
│   │   └── License.ts
│   └── constants/              # Shared constants
│       ├── api.ts              # API endpoints
│       └── config.ts
├── docs/
│   ├── ANTIPHON_OS_BUILD_PYRAMID.md
│   ├── ANTIPHON_DESIGN_ANIMATION_SYSTEM.md
│   └── ANTIPHON_HUB_SPEC.md (this file)
└── package.json                # Root workspace config
```

### Build System

**Commands:**

```bash
# Install dependencies
pnpm install

# Run Hub in dev mode
pnpm --filter @antiphon/hub dev

# Build Hub for production
pnpm --filter @antiphon/hub build

# Run tests
pnpm --filter @antiphon/hub test

# Lint
pnpm lint

# Format
pnpm format
```

### Environment Setup

**Required:**
- Node.js 18+
- pnpm 8+
- Rust 1.70+ (for Tauri)
- Xcode Command Line Tools (macOS)
- Visual Studio Build Tools (Windows)

**Environment variables:**

```bash
# .env
VITE_API_BASE_URL=https://api.antiphonrecords.com
VITE_CDN_BASE_URL=https://cdn.antiphonrecords.com
VITE_APP_VERSION=1.0.0
```

### Packaging

**macOS:**
- Bundle as `.dmg`
- Code sign with Developer ID
- Notarize via Apple

**Windows:**
- Bundle as `.exe` installer
- Code sign with valid certificate
- Optional: Microsoft Store submission

**Release artifacts:**
- `Antiphon-Hub-macOS-x64-1.0.0.dmg`
- `Antiphon-Hub-macOS-arm64-1.0.0.dmg`
- `Antiphon-Hub-Windows-x64-1.0.0.exe`

---

## Architecture (Layer 2)

### Three-Layer Pattern

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
│  - AuthService (login, logout)      │
│  - RegistryService (fetch apps)     │
│  - InstallService (download, install)│
│  - LaunchService (open apps)        │
│  - UpdateService (check, download)  │
└──────────────┬──────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────┐
│       Domain Layer                  │
│  - License validation               │
│  - App state management             │
│  - Version comparison               │
│  - Registry parsing                 │
└─────────────────────────────────────┘
```

### Domain Layer

**Pure business logic (no framework dependencies):**

**Files:**
- `domain/license.ts` – License validation logic
- `domain/version.ts` – Semantic version comparison
- `domain/registry.ts` – Registry schema validation
- `domain/app.ts` – App state machine

**Example:**

```typescript
// domain/license.ts
export interface License {
  key: string;
  appId: string;
  userId: string;
  expiresAt?: Date; // Optional (perpetual if absent)
}

export function validateLicense(license: License): boolean {
  // Pure validation logic
  if (!license.key || !license.appId) return false;
  if (license.expiresAt && license.expiresAt < new Date()) return false;
  return true;
}
```

### Services Layer

**Bridge between domain and outside world:**

**Files:**
- `services/authService.ts` – Authentication
- `services/registryService.ts` – Fetch app catalog
- `services/installService.ts` – Download and install
- `services/launchService.ts` – Launch apps
- `services/updateService.ts` – Check and install updates
- `services/storageService.ts` – Local storage (encrypted)

**Example:**

```typescript
// services/authService.ts
import { invoke } from '@tauri-apps/api/core';

export class AuthService {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const data = await response.json();
    await this.storeToken(data.token);
    return data.user;
  }
  
  async storeToken(token: string): Promise<void> {
    // Store encrypted in local storage
    await invoke('store_token', { token });
  }
  
  async getToken(): Promise<string | null> {
    return await invoke('get_token');
  }
  
  async logout(): Promise<void> {
    await invoke('clear_token');
  }
}
```

### UI Layer

**React components (presentation only):**

**Files:**
- `components/AppCard.tsx` – Display app card
- `components/AppList.tsx` – List of apps
- `components/LoginForm.tsx` – Login screen
- `components/InstallButton.tsx` – Install/launch button
- `pages/Home.tsx` – Main screen
- `pages/Settings.tsx` – Settings screen

**Example:**

```typescript
// components/AppCard.tsx
import { motion } from 'framer-motion';
import { cardVariant } from '@/motion/presets';
import { App } from '@/types/App';

interface AppCardProps {
  app: App;
  onInstall: (appId: string) => void;
  onLaunch: (appId: string) => void;
}

export function AppCard({ app, onInstall, onLaunch }: AppCardProps) {
  const isInstalled = app.status === 'installed';
  
  return (
    <motion.div
      className="app-card"
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
    >
      <img src={app.iconUrl} alt={app.name} className="app-icon" />
      <h3>{app.name}</h3>
      <p>{app.description}</p>
      <p className="version">v{app.version}</p>
      
      {isInstalled ? (
        <button onClick={() => onLaunch(app.id)}>Launch</button>
      ) : (
        <button onClick={() => onInstall(app.id)}>Install</button>
      )}
    </motion.div>
  );
}
```

---

## Data Models (Layer 3)

### Core Types

**User:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  ownedApps: string[];  // Array of app IDs
  licenses: License[];
}
```

**App:**

```typescript
interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  iconUrl: string;
  downloadUrl: string;
  size: number;         // Bytes
  status: AppStatus;
  releaseDate: string;
  changelog: string;
  requiresLicense: boolean;
}

type AppStatus = 'available' | 'installing' | 'installed' | 'updating' | 'error';
```

**License:**

```typescript
interface License {
  key: string;
  appId: string;
  userId: string;
  expiresAt?: Date;     // Optional (perpetual if absent)
  createdAt: Date;
}
```

**Registry:**

```typescript
interface Registry {
  version: string;
  apps: App[];
  updatedAt: string;
}
```

**Install Progress:**

```typescript
interface InstallProgress {
  appId: string;
  stage: 'downloading' | 'extracting' | 'installing' | 'complete';
  progress: number;     // 0-100
  bytesDownloaded: number;
  totalBytes: number;
}
```

### State Machine

**App states:**

```
available → installing → installed
                ↓            ↓
              error      updating → installed
                              ↓
                           error
```

**Transitions:**

- `available` → `installing` (user clicks Install)
- `installing` → `installed` (install complete)
- `installing` → `error` (install failed)
- `installed` → `updating` (update available, user accepts)
- `updating` → `installed` (update complete)
- `updating` → `error` (update failed)

### Persistence

**Local storage (encrypted):**

**Files:**
- `~/.antiphon/config.json` – User preferences
- `~/.antiphon/registry.json` – Cached app catalog
- `~/.antiphon/licenses.json` – Encrypted licenses
- `~/.antiphon/auth.json` – Encrypted auth token

**Example:**

```typescript
// storageService.ts
export class StorageService {
  private configPath = '~/.antiphon/config.json';
  
  async saveConfig(config: AppConfig): Promise<void> {
    await invoke('write_file', {
      path: this.configPath,
      contents: JSON.stringify(config, null, 2)
    });
  }
  
  async loadConfig(): Promise<AppConfig | null> {
    try {
      const contents = await invoke('read_file', { path: this.configPath });
      return JSON.parse(contents);
    } catch {
      return null;
    }
  }
}
```

---

## User Interface Flows (Layer 4)

### Primary Flows

#### 1. First Launch (Onboarding)

**Steps:**
1. User opens Antiphon Hub for first time
2. Sees welcome screen
3. Clicks "Log In"
4. Enters email + password
5. Authenticates with backend
6. Sees owned apps
7. Clicks "Install All" or selects individual apps
8. Apps download and install
9. Can launch apps from Hub

**Screens:**
- Welcome screen
- Login screen
- Home screen (app list)
- Install progress screen

#### 2. Launch Installed App

**Steps:**
1. User opens Hub
2. Sees list of installed apps
3. Clicks "Launch" on app card
4. App opens in new window
5. Hub remains open in background

**Screens:**
- Home screen

#### 3. Install New App

**Steps:**
1. User sees new app in catalog (after update)
2. Clicks "Install"
3. Progress bar shows download
4. App installs automatically
5. Status changes to "Installed"
6. User can launch immediately

**Screens:**
- Home screen (app list)
- Install progress overlay

#### 4. Update Apps

**Steps:**
1. Hub checks for updates on startup
2. Shows notification badge (e.g., "3 updates available")
3. User clicks "Update All"
4. Progress bar shows each app updating
5. Apps update in background
6. Notification shows "All apps up to date"

**Screens:**
- Home screen (with update notification)
- Update progress overlay

#### 5. Logout

**Steps:**
1. User clicks profile icon
2. Clicks "Log Out"
3. Confirms logout
4. Returns to login screen
5. Local cache cleared (except installed apps)

**Screens:**
- Settings menu
- Logout confirmation

### Navigation Structure

```
Login Screen
    ↓ (after auth)
Home Screen
    ├─ All Apps (tab)
    ├─ Installed (tab)
    └─ Updates (tab)
    
Settings (gear icon)
    ├─ Account
    ├─ Preferences
    └─ About
```

### Screen Wireframes

**Home Screen:**

```
┌─────────────────────────────────────────┐
│  [Logo]  Antiphon Hub       [Profile ▼] │
├─────────────────────────────────────────┤
│  [ All Apps ] [ Installed ] [ Updates ] │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌──────────┐            │
│  │ [Icon]   │  │ [Icon]   │            │
│  │ App Name │  │ App Name │            │
│  │ v1.2.3   │  │ v2.0.1   │            │
│  │ [Launch] │  │ [Install]│            │
│  └──────────┘  └──────────┘            │
│                                          │
│  ┌──────────┐  ┌──────────┐            │
│  │ [Icon]   │  │ [Icon]   │            │
│  │ App Name │  │ App Name │            │
│  │ v3.1.0   │  │ v1.0.0   │            │
│  │ [Update] │  │ [Launch] │            │
│  └──────────┘  └──────────┘            │
│                                          │
└─────────────────────────────────────────┘
```

**Login Screen:**

```
┌─────────────────────────────────────────┐
│                                          │
│            [Antiphon Logo]              │
│                                          │
│       Welcome to Antiphon Hub          │
│                                          │
│       ┌──────────────────────┐         │
│       │ Email                │         │
│       └──────────────────────┘         │
│                                          │
│       ┌──────────────────────┐         │
│       │ Password             │         │
│       └──────────────────────┘         │
│                                          │
│          [   Log In   ]                │
│                                          │
│       Forgot password? | Sign Up       │
│                                          │
└─────────────────────────────────────────┘
```

---

## Integration Points (Layer 5)

### Hub API (Backend)

**Base URL:** `https://api.antiphonrecords.com`

#### Authentication

**POST `/auth/login`**

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "ownedApps": ["app_1", "app_2"],
    "licenses": [...]
  }
}
```

**POST `/auth/logout`**

Request:
```json
{
  "token": "jwt_token_here"
}
```

Response:
```json
{
  "success": true
}
```

#### Registry

**GET `/registry`**

Response:
```json
{
  "version": "1.0.0",
  "apps": [
    {
      "id": "melody-engine",
      "name": "Melody Engine",
      "description": "AI-powered melody generator",
      "version": "1.2.3",
      "iconUrl": "https://cdn.antiphonrecords.com/icons/melody-engine.png",
      "downloadUrl": "https://cdn.antiphonrecords.com/apps/melody-engine-1.2.3.zip",
      "size": 52428800,
      "releaseDate": "2026-02-01",
      "changelog": "Bug fixes and performance improvements",
      "requiresLicense": true
    }
  ],
  "updatedAt": "2026-02-08T12:00:00Z"
}
```

#### Updates

**GET `/updates?installedApps=app1,app2,app3`**

Response:
```json
{
  "updates": [
    {
      "appId": "app1",
      "currentVersion": "1.0.0",
      "latestVersion": "1.2.0",
      "downloadUrl": "...",
      "changelog": "..."
    }
  ]
}
```

#### Licensing

**POST `/licenses/validate`**

Request:
```json
{
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "appId": "melody-engine",
  "userId": "user_123"
}
```

Response:
```json
{
  "valid": true,
  "license": {
    "key": "XXXXX-XXXXX-XXXXX-XXXXX",
    "appId": "melody-engine",
    "userId": "user_123",
    "expiresAt": null,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

### App Registration API

**Apps call Hub to register themselves:**

**POST `http://localhost:3000/register`** (Hub listens locally)

Request:
```json
{
  "appId": "melody-engine",
  "version": "1.2.3",
  "port": 3001
}
```

Response:
```json
{
  "success": true,
  "token": "app_session_token"
}
```

### Launch Service

**Hub launches apps via shell command:**

```typescript
// services/launchService.ts
import { Command } from '@tauri-apps/plugin-shell';

export class LaunchService {
  async launchApp(appPath: string): Promise<void> {
    const command = Command.sidecar('open', ['-a', appPath]);
    await command.execute();
  }
}
```

**macOS:**
```bash
open -a "/Applications/Melody Engine.app"
```

**Windows:**
```bash
start "" "C:\Program Files\Antiphon\Melody Engine\MelodyEngine.exe"
```

---

## Design Specifications (Layer 6)

### Visual Design

**Follows Antiphon Design System** (see `ANTIPHON_DESIGN_ANIMATION_SYSTEM.md`)

**Colors:**
- Background: `#000000` (pure black)
- Cards: `#1a1a1a` (dark gray)
- Text: `#ffffff` (white), `#b3b3b3` (secondary)
- Borders: `#666666`
- Accents: Minimal color (reserved for musical content)

**Typography:**
- Font: Inter (variable)
- Headings: Semibold (600)
- Body: Regular (400)

**Spacing:**
- 8pt grid system
- Card padding: 16px
- Gap between cards: 16px

**Shadows:**
- Cards: `0 4px 8px rgba(0,0,0,0.2)`
- Cards (hover): `0 12px 30px rgba(0,0,0,0.4)`

### Components

**AppCard:**
- 200px × 250px
- Icon: 64px × 64px (centered)
- Name: 18px semibold
- Version: 14px secondary text
- Button: Primary or secondary style

**Button:**
- Primary: White text on black, inverts on hover
- Secondary: Black text on gray, lightens on hover
- Height: 36px (medium), 48px (large)

**Modal:**
- Max width: 600px
- Padding: 32px
- Background: `#1a1a1a`
- Overlay: `rgba(0,0,0,0.8)`

### Animations

**Card entrance:**
- Opacity: 0 → 1
- Scale: 0.8 → 1.0
- Duration: 300ms
- Easing: Spring (stiffness 120, damping 20)

**Button press:**
- Scale: 1.0 → 0.98
- Duration: 80ms

**Modal entrance:**
- Opacity: 0 → 1
- Scale: 0.95 → 1.0
- Duration: 350ms
- Easing: easeOut

---

## API Reference

### Registry Service

```typescript
interface RegistryService {
  fetchRegistry(): Promise<Registry>;
  getApp(appId: string): Promise<App | null>;
  checkUpdates(installedApps: App[]): Promise<Update[]>;
}
```

### Auth Service

```typescript
interface AuthService {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getToken(): Promise<string | null>;
  storeToken(token: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

### Install Service

```typescript
interface InstallService {
  installApp(appId: string): Promise<void>;
  uninstallApp(appId: string): Promise<void>;
  onProgress(callback: (progress: InstallProgress) => void): void;
}
```

### Launch Service

```typescript
interface LaunchService {
  launchApp(appId: string): Promise<void>;
  isAppRunning(appId: string): Promise<boolean>;
  closeApp(appId: string): Promise<void>;
}
```

### Update Service

```typescript
interface UpdateService {
  checkForUpdates(): Promise<Update[]>;
  updateApp(appId: string): Promise<void>;
  updateAllApps(): Promise<void>;
  onUpdateProgress(callback: (progress: InstallProgress) => void): void;
}
```

---

## Registry Schema

**Central catalog of all apps:**

**File:** `https://cdn.antiphonrecords.com/registry.json`

```json
{
  "version": "1.0.0",
  "apps": [
    {
      "id": "melody-engine",
      "name": "Melody Engine",
      "description": "AI-powered melody generator with chord-aware harmonization",
      "version": "1.2.3",
      "iconUrl": "https://cdn.antiphonrecords.com/icons/melody-engine.png",
      "downloadUrl": "https://cdn.antiphonrecords.com/apps/melody-engine-1.2.3-macos-x64.dmg",
      "downloadUrlArm64": "https://cdn.antiphonrecords.com/apps/melody-engine-1.2.3-macos-arm64.dmg",
      "downloadUrlWindows": "https://cdn.antiphonrecords.com/apps/melody-engine-1.2.3-windows-x64.exe",
      "size": 52428800,
      "sizeArm64": 48234496,
      "sizeWindows": 55574528,
      "releaseDate": "2026-02-01T00:00:00Z",
      "changelog": "- Added scale detection\n- Improved chord recognition\n- Bug fixes",
      "requiresLicense": true,
      "minHubVersion": "1.0.0",
      "dependencies": []
    },
    {
      "id": "chord-analyzer",
      "name": "Chord Analyzer",
      "description": "Analyze MIDI files for chord progressions and harmonic structure",
      "version": "2.0.1",
      "iconUrl": "https://cdn.antiphonrecords.com/icons/chord-analyzer.png",
      "downloadUrl": "https://cdn.antiphonrecords.com/apps/chord-analyzer-2.0.1-macos-x64.dmg",
      "size": 41943040,
      "releaseDate": "2026-01-15T00:00:00Z",
      "changelog": "- Major UI overhaul\n- Added export to MIDI\n- Performance improvements",
      "requiresLicense": true,
      "minHubVersion": "1.0.0",
      "dependencies": []
    }
  ],
  "updatedAt": "2026-02-08T12:00:00Z"
}
```

**Schema validation:**

```typescript
// domain/registry.ts
import { z } from 'zod';

const AppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  iconUrl: z.string().url(),
  downloadUrl: z.string().url(),
  size: z.number().positive(),
  releaseDate: z.string().datetime(),
  changelog: z.string(),
  requiresLicense: z.boolean(),
  minHubVersion: z.string().optional(),
  dependencies: z.array(z.string()).default([])
});

const RegistrySchema = z.object({
  version: z.string(),
  apps: z.array(AppSchema),
  updatedAt: z.string().datetime()
});

export function validateRegistry(data: unknown): Registry {
  return RegistrySchema.parse(data);
}
```

---

## Security & Licensing

### License Validation

**Local validation (offline-first):**

```typescript
// domain/license.ts
export function validateLicense(license: License, app: App): boolean {
  // 1. Check license key format
  if (!isValidLicenseKeyFormat(license.key)) return false;
  
  // 2. Check if license matches app
  if (license.appId !== app.id) return false;
  
  // 3. Check expiration (if not perpetual)
  if (license.expiresAt && license.expiresAt < new Date()) return false;
  
  // 4. Verify signature (cryptographic check)
  if (!verifyLicenseSignature(license)) return false;
  
  return true;
}

function isValidLicenseKeyFormat(key: string): boolean {
  // Format: XXXXX-XXXXX-XXXXX-XXXXX (5 groups of 5 chars)
  return /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(key);
}

function verifyLicenseSignature(license: License): boolean {
  // Use asymmetric cryptography (public key verification)
  // TODO: Implement RSA signature check
  return true; // Placeholder
}
```

**Server validation (online check):**

```typescript
// services/licenseService.ts
export class LicenseService {
  async validateLicense(license: License): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: license.key,
        appId: license.appId,
        userId: license.userId
      })
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.valid;
  }
}
```

### Encrypted Storage

**Store sensitive data encrypted:**

```rust
// src-tauri/src/commands/storage.rs
use tauri::command;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};

#[command]
pub async fn store_token(token: String) -> Result<(), String> {
    let key = Key::<Aes256Gcm>::from_slice(b"an example very very secret key.");
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(b"unique nonce");
    
    let encrypted = cipher.encrypt(nonce, token.as_bytes())
        .map_err(|e| e.to_string())?;
    
    // Write to file
    std::fs::write(get_token_path(), encrypted)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub async fn get_token() -> Result<String, String> {
    let encrypted = std::fs::read(get_token_path())
        .map_err(|e| e.to_string())?;
    
    let key = Key::<Aes256Gcm>::from_slice(b"an example very very secret key.");
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(b"unique nonce");
    
    let decrypted = cipher.decrypt(nonce, encrypted.as_ref())
        .map_err(|e| e.to_string())?;
    
    String::from_utf8(decrypted).map_err(|e| e.to_string())
}
```

### Anti-Piracy Measures

**Strategies:**
1. **Server-side validation** – License keys verified against database
2. **Hardware fingerprinting** – Tie license to machine (limit activations)
3. **Code obfuscation** – Make reverse engineering harder
4. **Update gating** – Updates require valid license
5. **Graceful degradation** – Don't break existing functionality, just disable updates

**NOT implementing:**
- ❌ Always-online DRM (offline must work)
- ❌ Kernel-level anti-cheat (intrusive)
- ❌ Breaking existing installs remotely

---

## Release Checklist

**Before shipping Hub:**

- [ ] All Layer 0-8 checklists complete
- [ ] Authentication works (login/logout)
- [ ] Registry fetches app catalog
- [ ] Install/uninstall works on clean machines
- [ ] Launch apps successfully
- [ ] Update system works
- [ ] License validation works (online + offline)
- [ ] Encrypted storage tested
- [ ] Code signed (macOS + Windows)
- [ ] Notarization passes (macOS)
- [ ] Installers tested on clean VMs
- [ ] Error states display correctly
- [ ] Performance budget met (<1s app list load)
- [ ] Accessibility tested (keyboard nav, screen reader)
- [ ] Documentation complete

---

## Summary

The **Antiphon Hub** is the central nervous system of the Antiphon suite.

**It must:**
- Be rock-solid reliable (production-grade from day 1)
- Work offline (after initial auth)
- Handle updates gracefully (no broken workflows)
- Validate licenses securely (prevent piracy)
- Launch apps seamlessly (single click)

**Architecture priorities:**
1. Separation of concerns (Domain / Services / UI)
2. Testability (80%+ coverage for domain logic)
3. Offline-first (local cache, encrypted storage)
4. Performance (fast startup, responsive UI)

**Next steps:**
1. Set up monorepo with Hub + SDK packages
2. Implement Domain Layer (license validation, version comparison)
3. Build Services Layer (auth, registry, install, launch)
4. Create UI skeleton (ugly but functional)
5. Add design system (Layer 6)
6. Polish motion (Layer 7)
7. Package and release (Layer 8)

**Follow the pyramid. Foundation → Structure → Skin.**

---

**END OF ANTIPHON HUB SPECIFICATION**
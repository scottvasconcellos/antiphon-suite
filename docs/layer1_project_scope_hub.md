# layer1_project_scope_hub.md

## Product Scope Agent: Antiphon Hub

## Scope Intent
Layer 1 converts Layer 0 philosophy into executable delivery boundaries for the first production-ready Hub milestone.

## In Scope for MVP
- Authentication spine with identity-based sign-in and session persistence.
- Entitlement authority that resolves owned Antiphon apps for the active identity.
- Install authority for trusted app installation and manual reinstall.
- Manual update channel with explicit update apply action.
- Offline license cache state with validation timestamp and expiry window.
- Operational telemetry only: install/update/licensing/crash events.

## Out of Scope for MVP
- Native in-Hub checkout and any payment processing.
- Third-party app distribution.
- Behavioral analytics, recommendation engines, or user profiling.
- Plugin hosting/runtime container responsibilities.
- Collaboration/workspace/social features.

## Epics
1. Identity and Session Foundation
2. Entitlement Resolution and Local Caching
3. Install/Update Pipeline Shell
4. Offline Resilience and Policy Enforcement
5. Operational Telemetry and Error Surfacing

## User Stories (first execution set)
1. As an authenticated user, I can see all owned Antiphon apps in one list.
2. As an authenticated user, I can install an owned app from one trusted action path.
3. As an authenticated user, I can apply manual updates to installed owned apps.
4. As a user with weak or no internet, I can still run installed entitled apps through a local cache window.
5. As an operator, I can observe installation and entitlement failures without invasive tracking.

## Non-Negotiable Acceptance Criteria
- No product keys, activation slots, or visible authorization ceilings.
- Authentication success must establish or refresh offline cache validity.
- Install state transitions must be deterministic (`not-installed`, `installing`, `installed`, `error`).
- The UI must avoid storefront behavior and remain utility-focused.
- Entitlement checks must fail clearly and recover cleanly without user anxiety patterns.
- No implicit mock fallback in runtime flows; if backend is not configured, surface a configuration error.

## Current Implementation Status
- Baseline workspace scaffold: complete.
- Layer 0 functional shell in `apps/layer0-hub`: complete.
- Domain/services/UI separation baseline: complete.
- HTTP gateway interface for auth/entitlements/updates: complete.
- Runtime mock fallback: removed (configuration is explicit via `VITE_ANTIPHON_API_URL`).
- Real backend implementation: pending.
- Native process installer orchestration: pending.
- Telemetry pipeline and policy controls: pending.

## Immediate Next Build Steps
1. Implement backend endpoints expected by the Hub gateway (`/auth/session`, `/entitlements`, `/installs/:id`, `/updates/:id`, `/offline-cache/status`).
2. Add install transaction log and recoverable error states.
3. Add cache encryption + OS keychain integration for local entitlement material.
4. Introduce desktop shell bridge (Electron/Tauri) for native install execution.

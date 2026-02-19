# Hub UI pressure test report

Summary of checks and findings after implementing footer centering, logo, sign-in flow, grid/list, profile, shared legal docs, and copy removal.

## What was tested

- **Build & typecheck** — `pnpm --filter @antiphon/layer0-hub run typecheck` and `build` succeed.
- **Smoke** — `pnpm run smoke` (control-plane + foundation) passes.
- **CSS** — Renamed `.mb-2.5` to `.mb-2_5` to avoid minifier warning on the class name.
- **Code paths** — Sign-in (Firebase + stub), Settings (with and without Firebase user), AppCatalog (tile vs list), legal links.

## Strengths

1. **Single sign-in flow** — No tabs; email/password first, then “or sign in with” and two white Google/Apple buttons with logos. Clear hierarchy.
2. **Grid vs list** — Grid uses taller cards (min-height 200px); list is a single row per app with icon, name, tagline, version, badge, and action buttons inline (no expand).
3. **Shared legal** — `docs/legal/` is the single source for Privacy Policy and EULA; EULA includes “By using this software you agree to this EULA.” Hub’s `public/` copies stay in sync; other apps can copy or link to `docs/legal/`.
4. **Profile (Firebase)** — When Firebase is configured and user is signed in: profile photo upload (with alignment via displayed image), display name edit + Save, and “Change email linked to this account” with verification flow. Re-auth message shown when Firebase returns `requires-recent-login`.
5. **Footer** — Centered branding, logo, social, newsletter, copyright; logo SVG used instead of gradient dot.
6. **Copy** — “Sign in to see account, licenses, and billing.” removed from preferences when signed out.
7. **Type safety** — No new TypeScript or lint issues; optional `onSessionUpdate` prop on SettingsView for future use.

## Weaknesses / follow-ups (addressed)

1. **Profile photo alignment** — Upload replaces photo URL; there is no in-app crop/align UI. For real alignment control you’d add a small crop/position step (e.g. canvas or a library) before calling `updateProfilePhotoURL`.
2. **Change phone** — Only “change email” is implemented. Changing phone would require Firebase Phone Auth (e.g. `updatePhoneNumber` + re-auth); not implemented; UI says “Change email linked to this account” only.
3. **Session sync after profile update** — Display name/photo are updated in Firebase only; Hub’s `session` from the backend is not refetched, so the topbar/other views may still show old display name until next full sign-in or a refresh. Optional: call a session-refresh API or refetch after `updateProfile` if the backend exposes it.
4. **Large bundle** — Vite reports main chunk >500 kB; consider code-splitting (e.g. lazy routes or heavy libs) for faster initial load.
5. **Firebase config** — Profile features require Firebase configured and user signed in via Firebase. If Hub is used with email-only (stub) auth, profile edit and photo/email change are not shown; that’s intentional but worth documenting for operators.
6. **Legal back link** — Privacy/EULA pages use “← Back” (to `/`). When opened from another app, “Back” goes to that app’s root; fine for shared content.

## What you may need to provide

- **Firebase** — For profile photo, display name, and change-email to work: Firebase project, Auth enabled (Email/Password, Google, Apple if desired), and Hub env (e.g. `VITE_FIREBASE_*`) set. Re-auth may be required for email change; the UI tells the user to sign out and sign in again when Firebase returns `requires-recent-login`.

---

**Update (weaknesses addressed):** Profile photo now has an in-app align step (vertical position slider + 256×256 crop). Change-phone flow added (Firebase Phone Auth + reCAPTCHA). Session refreshes in UI after profile updates via `onSessionUpdate`; Firebase auth state is subscribed so profile section appears when signed in with Google/Apple (including after refresh). Code-splitting added: views are lazy-loaded; main chunk ~500 kB.

*Report generated after implementation of footer, logo, sign-in reorder, grid/list, profile, shared legal, and pressure test.*

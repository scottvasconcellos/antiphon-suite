# Phase 4 Firebase Sign-in — TL;DR

**You have 3 things to do.** The rest is already wired.

---

## 1. Paste your Firebase config into the Hub (1 minute)

Copy **`apps/layer0-hub/.env.example`** to **`apps/layer0-hub/.env`** (if you don’t already have a local `.env`). Then set these from your Firebase web app config:

- `VITE_FIREBASE_API_KEY` → your `apiKey`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` → your `messagingSenderId`
- `VITE_FIREBASE_APP_ID` → your `appId`

Uncomment and fill in the other Firebase vars as needed. **Never commit `.env`** — it is gitignored; only `.env.example` (with placeholders) is in the repo.

---

## 2. Turn on sign-in methods in Firebase (once)

In [Firebase Console](https://console.firebase.google.com/) → your project **antiphon-sso** → **Authentication** → **Sign-in method**:

- **Google** → Enable.
- **Email/Password** → Enable.
- **Apple** → Enable only if you want Apple (needs Apple Developer setup).

Under **Authentication → Settings → Authorized domains**, ensure **localhost** is listed.

---

## 3. Run and try it

**Open Terminal and go to the monorepo first** (the folder that contains `apps/`, `docs/`, `package.json`). For example:
```bash
cd /path/to/antiphon-suite-monorepo
```

Then, in **Terminal 1:**
```bash
cd apps/layer0-authority && pnpm dev
```

In **Terminal 2** (new window/tab, same repo folder):
```bash
cd apps/layer0-hub && pnpm dev
```

Open http://localhost:5173 (or the port Vite prints). Sign in with Google or email+password. You should see the app catalog after sign-in.

---

**That’s it.** Authority `.env` is already set (project ID, port). If something fails, see `docs/HUB_RUNBOOK.md` (Auth section and common failures).

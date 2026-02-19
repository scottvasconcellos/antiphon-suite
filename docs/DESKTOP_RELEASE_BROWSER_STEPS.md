# Desktop release — what you do in the browser

Everything that can be automated in this repo is done (workflow, notarize script, entitlements, `build:mac`/`build:win`, repo variable `ENABLE_WINDOWS_BUILD=false`). The steps below are the **only** ones you must do yourself (in the browser and one terminal command).

---

## 1. Add GitHub Actions secrets

1. Open: **https://github.com/scottvasconcellos/antiphon-suite/settings/secrets/actions**
2. Click **New repository secret** and add each of these:

| Name | Value |
|------|--------|
| `APPLE_ID` | Your Apple ID email (e.g. `you@icloud.com`) |
| `APPLE_APP_SPECIFIC_PASSWORD` | From [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords → Generate (e.g. label: `Electron Notarization`) |
| `APPLE_TEAM_ID` | From [developer.apple.com/account](https://developer.apple.com/account) → Membership → 10-character Team ID |
| `APPLE_SIGNING_IDENTITY` | From your Mac terminal (see step 2 below) |

*(Skip `CSC_LINK` and `CSC_KEY_PASSWORD` until you have a Windows code-signing cert.)*

---

## 2. Get your Apple signing identity string

After you have created and installed your **Developer ID Application** certificate:

1. On your Mac, open Terminal.
2. Run:
   ```bash
   security find-identity -v -p codesigning
   ```
3. Copy the full line that says **Developer ID Application: Your Name (XXXXXXXXXX)**.
4. Paste that exact string as the value for the **`APPLE_SIGNING_IDENTITY`** secret in GitHub (step 1).

---

## 3. Apple Developer setup (if not done yet)

- **Sign in:** [developer.apple.com/account](https://developer.apple.com/account)  
- **Create Developer ID Application cert:** Certificates, Identifiers & Profiles → Certificates → **+** → Developer ID Application → create CSR in Keychain Access → upload CSR → download `.cer` → double-click to install in Keychain.  
- **App-specific password:** [account.apple.com](https://account.apple.com) → Sign-In and Security → App-Specific Passwords → Generate (label e.g. `Electron Notarization`).  
- **Team ID:** developer.apple.com → Membership (top of page).

---

## 4. Trigger a release

After the four secrets are set:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

The workflow runs on any `v*` tag: it builds, signs, notarizes, and creates a GitHub Release with macOS artifacts.

---

## 5. (Later) Windows build

When you have a Windows code-signing certificate:

1. Add secrets: `CSC_LINK` (base64 of your `.p12` file), `CSC_KEY_PASSWORD` (password for the `.p12`).
2. In GitHub: Settings → Secrets and variables → **Variables** → set **`ENABLE_WINDOWS_BUILD`** to **`true`**.
3. In `.github/workflows/release-desktop.yml`, change `needs: [build-mac]` to `needs: [build-mac, build-win]` in the `release` job and add a step to download and publish the Windows artifact.

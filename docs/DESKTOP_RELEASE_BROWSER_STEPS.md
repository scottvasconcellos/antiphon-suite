# Desktop release — what you do in the browser

**Canonical docs:** [DESKTOP_INSTALL_INSTRUCTIONS.md](DESKTOP_INSTALL_INSTRUCTIONS.md) (customer copy + what you still do) · [PACKAGING_AND_DESKTOP.md](PACKAGING_AND_DESKTOP.md) (current state).

Everything that can be automated is done: workflow builds **both** Mac and Windows on every `v*` tag and publishes both to the GitHub Release. The steps below are only for when you add **signing** (Apple/Windows secrets).

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

With or without signing secrets, tag and push:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

The workflow runs on any `v*` tag: it builds **Mac and Windows** and creates a GitHub Release with both installers. If Apple secrets are missing, Mac build still succeeds (notarization skipped). If Windows cert is missing, Windows build still produces an unsigned installer.

---

## 5. (Later) Windows code signing

When you have a Windows code-signing certificate (or Azure Trusted Signing):

1. Add secrets: `CSC_LINK` + `CSC_KEY_PASSWORD`, or the Azure secrets (see [DESKTOP_RELEASE_STEP_BY_STEP.md](DESKTOP_RELEASE_STEP_BY_STEP.md)).
2. No repo variable needed — the Windows job already runs on every `v*` tag.

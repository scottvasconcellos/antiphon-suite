# Desktop release — step-by-step (plain English)

Use this when you’re in the browser or terminal. Do the **browser steps** first; I can run the **terminal** parts for you when you’re ready.

**See also:** [DESKTOP_INSTALL_INSTRUCTIONS.md](DESKTOP_INSTALL_INSTRUCTIONS.md) (customer copy) · [PACKAGING_AND_DESKTOP.md](PACKAGING_AND_DESKTOP.md) (current state).

---

## Recommendation: Windows code signing (cheap vs free)

- **Azure Trusted Signing** — about **$9.99/month** (~$120/year). No USB dongle, works in GitHub Actions with env vars. Good if you ship often and want low hassle. New Azure accounts sometimes get free credits.
- **OV code signing cert** (e.g. SSL.com) — about **$65/year**. Cheaper per year, but you get SmartScreen warnings until enough users install and trust builds. No Azure setup.
- **EV cert** — ~$250/year. No warnings from day one; usually requires a USB dongle and is overkill unless you need instant trust.

**Practical choice:** Start with **Azure Trusted Signing** if you’re okay with ~$10/month (or have Azure credits). If you prefer a single yearly fee and can accept temporary SmartScreen warnings, use an **OV cert** and add `CSC_LINK` + `CSC_KEY_PASSWORD` later.

---

## Part A: Apple (required for macOS releases)

### A1. GitHub — add the first secret (APPLE_ID)

1. Open: **https://github.com/scottvasconcellos/antiphon-suite/settings/secrets/actions**
2. Click **“New repository secret”**.
3. **Name (exactly):** `APPLE_ID`
4. **Secret (value):** Your Apple ID **email** (the one you use for developer.apple.com), e.g. `you@icloud.com` or `you@gmail.com`.
5. Click **“Add secret”**.

---

### A2. GitHub — second secret (APPLE_APP_SPECIFIC_PASSWORD)

1. Get the password:
   - Go to **https://account.apple.com**
   - Sign in → **Sign-In and Security** → **App-Specific Passwords**
   - Click **“Generate an app-specific password”**
   - **Label:** e.g. `Electron Notarization` (any label is fine)
   - Click **Generate** and **copy** the password (format like `xxxx-xxxx-xxxx-xxxx`). You won’t see it again.
2. In GitHub: **New repository secret**
3. **Name:** `APPLE_APP_SPECIFIC_PASSWORD`
4. **Secret:** Paste the app-specific password (no spaces).
5. Click **“Add secret”**.

---

### A3. GitHub — third secret (APPLE_TEAM_ID)

1. Get the Team ID:
   - Go to **https://developer.apple.com/account**
   - Sign in → **Membership** (in the sidebar or top).
   - Find **Team ID** — a 10-character string (letters and numbers).
2. In GitHub: **New repository secret**
3. **Name:** `APPLE_TEAM_ID`
4. **Secret:** Paste the 10-character Team ID only (no spaces or labels).
5. Click **“Add secret”**.

---

### A4. Terminal — get your signing identity (then add fourth secret)

**I can run this for you.** When you’re ready, say “run the signing identity command” and I’ll run on your machine:

```bash
security find-identity -v -p codesigning
```

You’ll see a line like:

`1) ABC123... "Developer ID Application: Your Name (XXXXXXXXXX)"`

**You:** Copy the full quoted part only:  
`Developer ID Application: Your Name (XXXXXXXXXX)`  
(include the text, your name, and the parentheses with the ID).

Then in GitHub:

1. **New repository secret**
2. **Name:** `APPLE_SIGNING_IDENTITY`
3. **Secret:** Paste that full string.
4. Click **“Add secret”**.

---

After A1–A4 you can trigger a **macOS** release (tag and push). Windows is separate below.

---

## Part B: Windows — Azure Trusted Signing (optional, ~$10/month)

Use this path if you chose Azure. Naming below matches what the repo and workflow expect.

### B1. Azure — create resources

1. **Trusted Signing account**
   - Follow: https://learn.microsoft.com/en-us/azure/trusted-signing/quickstart
   - Create a **Trusted Signing** resource and a **certificate profile**. Note the **account name** and **certificate profile name** (you’ll put these in GitHub secrets).
2. **App registration**
   - https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
   - Create an app registration. From its **Overview** page, copy:
     - **Application (client) ID** → later: `AZURE_CLIENT_ID`
     - **Directory (tenant) ID** → later: `AZURE_TENANT_ID`
   - **Certificates & secrets** → New client secret → copy the **Value** (not the Secret ID) → later: `AZURE_CLIENT_SECRET`
   - Assign the app the role **“Trusted Signing Certificate Profile Signer”** for your Trusted Signing account (search by the app name in the role assignment UI).
3. **Publisher name**
   - When you created the certificate profile, you set a **subject name** or **Common Name (CN)**. That value is your **publisher name** and must match exactly in the config.

---

### B2. GitHub — Azure secrets (exact names)

Add these as **repository secrets** (Settings → Secrets and variables → Actions → New repository secret). Use the **exact** names below.

| Secret name (copy exactly) | What to put |
|----------------------------|-------------|
| `AZURE_TENANT_ID` | Directory (tenant) ID from App registration → Overview |
| `AZURE_CLIENT_ID` | Application (client) ID from App registration → Overview |
| `AZURE_CLIENT_SECRET` | The **value** of the client secret (Certificates & secrets), not the Secret ID |
| `AZURE_CODE_SIGNING_ACCOUNT_NAME` | Your Trusted Signing **account** name (the resource name in Azure) |
| `AZURE_CERT_PROFILE_NAME` | The **certificate profile** name you created in that account |
| `AZURE_PUBLISHER_NAME` | The Common Name (CN) / subject of the certificate (must match exactly) |
| `AZURE_ENDPOINT` | The endpoint URL you chose when creating the certificate (Azure portal shows it; if unsure, try `https://localhost` for testing and fix later) |

---

### B3. Release job

The workflow already runs both Mac and Windows on every `v*` tag and attaches both installers to the GitHub Release. No change needed.

---

## Part C: Trigger a release (after Apple secrets are in)

**I can run these in your repo when you’re ready.** Say “tag and push release” and I’ll run:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

(We can use a different version/tag if you want.)

---

## Quick reference — secret names

**Apple (4 secrets):**  
`APPLE_ID` · `APPLE_APP_SPECIFIC_PASSWORD` · `APPLE_TEAM_ID` · `APPLE_SIGNING_IDENTITY`

**Windows with Azure (7 secrets):**  
`AZURE_TENANT_ID` · `AZURE_CLIENT_ID` · `AZURE_CLIENT_SECRET` · `AZURE_CODE_SIGNING_ACCOUNT_NAME` · `AZURE_CERT_PROFILE_NAME` · `AZURE_PUBLISHER_NAME` · `AZURE_ENDPOINT`

---

When you’re ready, say:
- **“Run the signing identity command”** — I’ll run `security find-identity -v -p codesigning` and tell you what to copy.
- **“Tag and push release”** — I’ll create and push a release tag.

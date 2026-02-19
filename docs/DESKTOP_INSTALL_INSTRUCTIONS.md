# Desktop install instructions (purchase page & email copy)

Copy the content below onto your purchase page and into your download email so customers know how to run and uninstall the app.

---

## Intro (use at the top)

We don't pay for Apple or Windows signing certificates. We're a small team keeping overhead low until there's proven demand, so we don't use paid signing yet. Our installers are safe — the OS may show a one-time warning. Here's how to run the app and how to uninstall.

---

## Mac

1. Download the .dmg.
2. Open it, drag Antiphon Manager to Applications, then open the app.
3. If you see "unknown developer," use Control + right-click → Open, or System Settings → Privacy & Security → Open Anyway.
4. Uninstall: drag to Trash. Optional cleanup: delete `~/Library/Application Support/Antiphon Manager`.

---

## Windows

1. Download the .exe.
2. If SmartScreen blocks it, click "More info" → "Run anyway."
3. Run the installer and choose a folder (default is fine).
4. Uninstall: Settings → Apps → Antiphon Manager → Uninstall.

---

## Where the copy lives (for maintainers)

- **Mac (in the DMG):** [apps/layer0-hub/build/First-run.txt](../apps/layer0-hub/build/First-run.txt)
- **Windows (shipped with release):** [apps/layer0-hub/build/First-run-Windows.txt](../apps/layer0-hub/build/First-run-Windows.txt)
- **DMG background image:** [apps/layer0-hub/build/dmg-background.png](../apps/layer0-hub/build/dmg-background.png) (540×380, replace if you change the layout)

---

## What you still do

- **Purchase page and email:** Paste the Intro + Mac + Windows sections above (or link to this doc).
- **Signed Mac later:** Add GitHub secrets `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `APPLE_SIGNING_IDENTITY`; push a `v*` tag; notarization will run automatically.
- **Signed Windows later:** Add cert (e.g. Azure Trusted Signing secrets or `CSC_LINK` + `CSC_KEY_PASSWORD`); workflow already supports both.
- **Trigger a release:** `git tag -a v0.1.0 -m "Release v0.1.0"` then `git push origin v0.1.0`. Both Mac and Windows installers (and READMEs) will be in the GitHub Release.

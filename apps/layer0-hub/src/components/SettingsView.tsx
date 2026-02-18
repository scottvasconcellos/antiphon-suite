import { useState, useCallback, useEffect } from "react";
import { Card, CardHeader, Input, Button } from "@antiphon/design-system/components";
import type { HubSession } from "../domain/types";

const STORAGE_KEY_PREFIX = "antiphon.manager.paths.";
const DEFAULT_DOWNLOAD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? "/Users/Shared/Downloads"
  : typeof navigator !== "undefined" && /Win/.test(navigator.userAgent)
    ? "Downloads"
    : "~/Downloads";
const DEFAULT_APP = "~/.antiphon/apps";
const DEFAULT_CONTENT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? "/Users/Shared"
  : typeof navigator !== "undefined" && /Win/.test(navigator.userAgent)
    ? "Music"
    : "~/Music";

function loadPath(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function savePath(key: string, value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, value);
  } catch {
    /* ignore */
  }
}

type SettingsViewProps = {
  session: HubSession | null;
  onSignOut: () => void;
};

export function SettingsView({ session, onSignOut }: SettingsViewProps) {
  const [downloadPath, setDownloadPath] = useState(() => loadPath("download", DEFAULT_DOWNLOAD));
  const [appPath, setAppPath] = useState(() => loadPath("app", DEFAULT_APP));
  const [contentPath, setContentPath] = useState(() => loadPath("content", DEFAULT_CONTENT));
  useEffect(() => {
    savePath("download", downloadPath);
  }, [downloadPath]);
  useEffect(() => {
    savePath("app", appPath);
  }, [appPath]);
  useEffect(() => {
    savePath("content", contentPath);
  }, [contentPath]);

  const handleBrowse = useCallback(async (field: "download" | "app" | "content") => {
    try {
      if ("showDirectoryPicker" in window) {
        const dir = await (window as Window & { showDirectoryPicker?: () => Promise<{ name: string }> }).showDirectoryPicker?.();
        const name = dir?.name ?? "";
        if (name) {
          if (field === "download") setDownloadPath(name);
          else if (field === "app") setAppPath(name);
          else setContentPath(name);
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        (input as HTMLInputElement & { webkitdirectory?: boolean }).webkitdirectory = true;
        input.onchange = () => {
          const first = input.files?.[0];
          const rel = first?.webkitRelativePath ?? "";
          const path = rel ? rel.split("/")[0] ?? "" : "";
          if (path) {
            if (field === "download") setDownloadPath(path);
            else if (field === "app") setAppPath(path);
            else setContentPath(path);
          }
        };
        input.click();
      }
    } catch {
      /* User cancelled or API not available; path remains editable */
    }
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setDownloadPath(DEFAULT_DOWNLOAD);
    setAppPath(DEFAULT_APP);
    setContentPath(DEFAULT_CONTENT);
  }, []);

  return (
    <div className="settings-grid">
      <Card variant="raised" padding="default">
        <CardHeader
          title="My Account"
          subtitle="Your Antiphon account details."
        />
        <div className="settings-field">
          {session ? (
            <div className="settings-account">
              <div className="settings-account-row">
                <div className="settings-account-avatar" aria-hidden="true">
                  {session.displayName?.slice(0, 2).toUpperCase() ?? session.email?.slice(0, 2).toUpperCase() ?? "?"}
                </div>
                <div className="settings-account-info">
                  <p className="settings-value">{session.displayName || session.email}</p>
                  <p className="settings-muted">{session.email}</p>
                  <a href="#" className="settings-link">Manage account</a>
                </div>
              </div>
              <div className="settings-account-actions">
                <Button variant="secondary" size="compact" onClick={onSignOut}>
                  Log out
                </Button>
              </div>
            </div>
          ) : (
            <p className="settings-muted">Sign in to see account info.</p>
          )}
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader
          title="File management"
          subtitle="Where files are stored on this machine."
        />
        <div className="settings-field settings-file-locations">
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="download-path">Download location</label>
            <div className="settings-path-input-row">
              <Input
                id="download-path"
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("download")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="app-path">Application location</label>
            <div className="settings-path-input-row">
              <Input
                id="app-path"
                type="text"
                value={appPath}
                onChange={(e) => setAppPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("app")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="content-path">Content location</label>
            <div className="settings-path-input-row">
              <Input
                id="content-path"
                type="text"
                value={contentPath}
                onChange={(e) => setContentPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("content")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-form-actions">
            <Button variant="secondary" size="compact" type="button" onClick={handleRestoreDefaults}>
              Restore defaults
            </Button>
            <a href="#" className="settings-link">Learn more</a>
          </div>
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader
          title="Billing"
          subtitle="Manage your orders and payment methods."
        />
        <p className="settings-muted">
          All purchases are processed securely. No subscriptions.
        </p>
        <div className="settings-form-actions">
          <a
            href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL || "https://billing.stripe.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="settings-link"
          >
            Manage billing and orders
          </a>
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="General" subtitle="Application preferences." />
        <p className="settings-muted">Launch at login and other options coming in a future update.</p>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Appearance" subtitle="Theme and display." />
        <p className="settings-muted">Light, dark, or system preference. Coming soon.</p>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Usage data" subtitle="Anonymous analytics." />
        <p className="settings-muted">
          We never track for marketing or personally. We only collect anonymous usage data to improve our products.
        </p>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Privacy & legal" subtitle="Policies and terms." />
        <p className="settings-muted">
          <a href="#" className="settings-link">Privacy Policy</a> · <a href="#" className="settings-link">EULA</a>
        </p>
      </Card>
    </div>
  );
}

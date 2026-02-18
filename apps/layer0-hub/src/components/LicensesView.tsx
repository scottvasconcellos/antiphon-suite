import { useCallback } from "react";
import type { EntitledApp } from "../domain/types";
import type { HubSession } from "../domain/types";
import { Card } from "@antiphon/design-system/components";
import { APP_METADATA } from "../data/appMetadata";

/**
 * Derive a display license ID for UI (no backend serial yet).
 * Format: Antiphon-{shortId}-{userIdSuffix}
 */
function deriveLicenseId(appId: string, userId: string): string {
  const shortId = appId.replace(/^antiphon\.layer\./, "").replace(/^hub-/, "") || appId.slice(0, 12);
  const suffix = userId.slice(-8);
  return `Antiphon-${shortId}-${suffix}`;
}

type LicensesViewProps = {
  entitlements: EntitledApp[];
  session: HubSession | null;
};

export function LicensesView({ entitlements, session }: LicensesViewProps) {
  const owned = entitlements.filter((e) => e.owned);

  if (!session) {
    return (
      <div className="licenses-empty">
        <h2 className="section-title">Your licenses</h2>
        <p className="section-subtitle">Sign in to view serial numbers and license details for your Antiphon products.</p>
        <p className="note-text">Sign in above to see your licenses.</p>
      </div>
    );
  }

  if (owned.length === 0) {
    return (
      <div className="licenses-empty">
        <h2 className="section-title">Your licenses</h2>
        <p className="section-subtitle">Serial numbers and license details for your Antiphon products.</p>
        <p className="note-text">No owned products. Your licenses will appear here after purchase or redemption.</p>
      </div>
    );
  }

  return (
    <div className="licenses-view">
      <h2 className="section-title">Your licenses</h2>
      <p className="section-subtitle">Serial numbers and license details for your Antiphon products.</p>
      <div className="licenses-list">
        {owned.map((app) => (
          <LicenseCard key={app.id} app={app} userId={session.userId} />
        ))}
      </div>
    </div>
  );
}

function LicenseCard({ app, userId }: { app: EntitledApp; userId: string }) {
  const meta = APP_METADATA[app.id];
  const tagline = meta?.tagline ?? "";
  const licenseId = deriveLicenseId(app.id, userId);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(licenseId);
  }, [licenseId]);

  return (
    <Card variant="raised" padding="default" className="license-card">
      <div className="license-card-main">
        <div className="license-card-info">
          <h3 className="license-card-title">{app.name}</h3>
          {tagline && <p className="license-card-tagline">{tagline}</p>}
          <p className="license-card-version">Version {app.version}</p>
        </div>
        <div className="license-card-id-row">
          <span className="hardware-label">License ID</span>
          <code className="license-id">{licenseId}</code>
          <button type="button" className="license-copy" onClick={handleCopy}>
            Copy
          </button>
        </div>
      </div>
    </Card>
  );
}

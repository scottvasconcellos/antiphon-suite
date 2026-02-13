import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "./components/SectionCard";
import { mockHubService } from "./domain/mockHubService";
import { type EntitledApp, type HubSnapshot } from "./domain/types";

const INITIAL_EMAIL = "producer@antiphon.audio";

function formatDate(value: string | null): string {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

function installActionLabel(app: EntitledApp): string {
  if (app.installState === "installing") {
    return "Installing...";
  }
  if (app.installedVersion) {
    return app.updateAvailable ? "Apply update" : "Reinstall";
  }
  return "Install";
}

export default function App() {
  const [snapshot, setSnapshot] = useState<HubSnapshot | null>(null);
  const [emailInput, setEmailInput] = useState(INITIAL_EMAIL);
  const [busyState, setBusyState] = useState<string | null>(null);

  useEffect(() => {
    void mockHubService.load().then(setSnapshot);
  }, []);

  const status = useMemo(() => {
    if (!snapshot) {
      return "Booting entitlement spine...";
    }
    if (!snapshot.session) {
      return "Signed out: offline cache remains available for existing installs.";
    }
    return "Signed in: ownership state synced and ready for install authority actions.";
  }, [snapshot]);

  async function runAction(actionId: string, task: () => Promise<HubSnapshot>) {
    setBusyState(actionId);
    try {
      const next = await task();
      setSnapshot(next);
    } finally {
      setBusyState(null);
    }
  }

  if (!snapshot) {
    return <div className="page-shell">Loading Layer 0 Hub...</div>;
  }

  const installedCount = snapshot.entitlements.filter((app) => app.installedVersion).length;

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Antiphon Hub</p>
          <h1>Layer 0: Silent Entitlement + Install Authority</h1>
          <p className="hero-copy">
            Infrastructure-first launcher focused on ownership certainty, trusted installs, manual updates,
            and offline-resilient entitlement.
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric">
            <span>Identity</span>
            <strong>{snapshot.session ? "Authenticated" : "Not signed in"}</strong>
          </div>
          <div className="metric">
            <span>Owned apps</span>
            <strong>{snapshot.entitlements.filter((app) => app.owned).length}</strong>
          </div>
          <div className="metric">
            <span>Installed</span>
            <strong>{installedCount}</strong>
          </div>
        </div>
      </header>

      <p className="status-line">{status}</p>

      <section className="grid-layout">
        <SectionCard
          title="Authentication Spine"
          subtitle="Identity-based ownership recognition. No product keys or activation slots."
        >
          <label className="field-label" htmlFor="email-input">
            Account email
          </label>
          <input
            id="email-input"
            className="text-input"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="producer@antiphon.audio"
            disabled={busyState !== null}
          />
          <div className="button-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => runAction("sign-in", () => mockHubService.signIn(emailInput))}
              disabled={busyState !== null || emailInput.trim().length < 5}
            >
              {busyState === "sign-in" ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => runAction("sign-out", () => mockHubService.signOut())}
              disabled={busyState !== null || !snapshot.session}
            >
              Sign out
            </button>
          </div>
          <p className="note-text">
            Current identity: {snapshot.session ? `${snapshot.session.displayName} (${snapshot.session.email})` : "none"}
          </p>
        </SectionCard>

        <SectionCard
          title="Entitlement Authority"
          subtitle="Ownership list is authoritative and ties directly to install rights."
        >
          <div className="entitlement-list">
            {snapshot.entitlements.map((app) => {
              const actionId = `app-${app.id}`;
              return (
                <article key={app.id} className="entitlement-item">
                  <div>
                    <h3>{app.name}</h3>
                    <p>
                      Latest {app.version} | Installed {app.installedVersion ?? "none"}
                    </p>
                  </div>
                  <div className="item-actions">
                    <span className={`pill ${app.owned ? "pill-owned" : "pill-unowned"}`}>
                      {app.owned ? "Owned" : "Unowned"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-small"
                      disabled={busyState !== null || !snapshot.session || !app.owned || app.installState === "installing"}
                      onClick={() =>
                        runAction(actionId, () =>
                          app.updateAvailable
                            ? mockHubService.applyUpdate(app.id)
                            : mockHubService.installApp(app.id)
                        )
                      }
                    >
                      {busyState === actionId ? "Working..." : installActionLabel(app)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Update Channel"
          subtitle="Manual update flow keeps operational control explicit during MVP."
        >
          <p className="note-text">
            Updates pending: {snapshot.entitlements.filter((app) => app.updateAvailable).length}
          </p>
          <p className="note-text">
            Install channel policy: trusted packages only, no floating builds, Antiphon-only distribution.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => runAction("refresh", () => mockHubService.refreshEntitlements())}
            disabled={busyState !== null || !snapshot.session}
          >
            {busyState === "refresh" ? "Refreshing..." : "Refresh entitlements"}
          </button>
        </SectionCard>

        <SectionCard
          title="Offline License Cache"
          subtitle="Creative sessions stay unblocked after authentication and validation."
        >
          <div className="cache-grid">
            <div>
              <span>Cache state</span>
              <strong>{snapshot.offlineCache.cacheState}</strong>
            </div>
            <div>
              <span>Last validated</span>
              <strong>{formatDate(snapshot.offlineCache.lastValidatedAt)}</strong>
            </div>
            <div>
              <span>Offline window</span>
              <strong>{snapshot.offlineCache.maxOfflineDays} days</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{snapshot.offlineCache.offlineDaysRemaining} days</strong>
            </div>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

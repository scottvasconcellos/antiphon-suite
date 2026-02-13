import { useEffect, useState } from "react";
import { SectionCard } from "./components/SectionCard";
import { type HubState } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { runHubTask } from "./services/hubRuntime";
import {
  toDisplayDate,
  toHubViewModel,
  toInstallActionLabel,
  toTransactionLabel
} from "./services/hubViewModel";
import { toControlPlaneViewModel } from "./services/controlPlaneViewModel";
import { toControlPlaneOperations } from "./services/controlPlaneOperationsViewModel";

const INITIAL_EMAIL = "producer@antiphon.audio";
const built = buildHubEngine();

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);
  const [emailInput, setEmailInput] = useState(INITIAL_EMAIL);
  const [busyState, setBusyState] = useState<string | null>(null);

  useEffect(() => {
    if (!built.engine) {
      return;
    }
    void built.engine.bootstrap().then(setHubState);
  }, []);

  const vm = toHubViewModel(hubState);
  const controlPlaneVm = toControlPlaneViewModel(hubState);
  const opsVm = toControlPlaneOperations(hubState.snapshot);

  async function runAction(actionId: string, task: () => Promise<HubState>) {
    setBusyState(actionId);
    try {
      const next = await runHubTask(built.engine, task, () => hubState);
      setHubState(next);
    } finally {
      setBusyState(null);
    }
  }

  const snapshot = hubState.snapshot;

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
            <strong>{vm.ownedCount}</strong>
          </div>
          <div className="metric">
            <span>Installed</span>
            <strong>{vm.installedCount}</strong>
          </div>
        </div>
      </header>

      <p className="status-line">{vm.statusLine}</p>
      <p className="status-line">Entitlement: {controlPlaneVm.entitlement.outcome} ({controlPlaneVm.entitlement.reason})</p>
      <p className="status-line">Install/Update: {controlPlaneVm.installUpdate.state} ({controlPlaneVm.installUpdate.reasonCode})</p>
      <p className="status-line">Launch token: {controlPlaneVm.launchToken.status} ({controlPlaneVm.launchToken.reason})</p>
      <p className="status-line">Cache schema: {controlPlaneVm.persistedCache.schema}@v{controlPlaneVm.persistedCache.version} restorable={String(controlPlaneVm.persistedCache.restorable)}</p>
      <p className="status-line">
        Launch readiness:{" "}
        {controlPlaneVm.launchReadiness.length === 0
          ? "none"
          : controlPlaneVm.launchReadiness.map((entry) => `${entry.appId}:${entry.reason}`).join(", ")}
      </p>
      <p className="status-line">Recent ops: {opsVm.length === 0 ? "none" : opsVm.map((op) => `${op.id}:${op.status}`).join(", ")}</p>

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
              onClick={() => built.engine && runAction("sign-in", () => built.engine!.signIn(emailInput))}
              disabled={busyState !== null || emailInput.trim().length < 5 || !built.engine}
            >
              {busyState === "sign-in" ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => built.engine && runAction("sign-out", () => built.engine!.signOut())}
              disabled={busyState !== null || !snapshot.session || !built.engine}
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
                      disabled={
                        busyState !== null ||
                        !snapshot.session ||
                        !app.owned ||
                        app.installState === "installing" ||
                        !built.engine
                      }
                      onClick={() =>
                        built.engine &&
                        runAction(actionId, () =>
                          app.updateAvailable
                            ? built.engine!.applyUpdate(app.id)
                            : built.engine!.installApp(app.id)
                        )
                      }
                    >
                      {busyState === actionId ? "Working..." : toInstallActionLabel(app)}
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
            Updates pending: {vm.pendingUpdates}
          </p>
          <p className="note-text">
            Install channel policy: trusted packages only, no floating builds, Antiphon-only distribution.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="btn"
              onClick={() => built.engine && runAction("refresh", () => built.engine!.refreshEntitlements())}
              disabled={busyState !== null || !snapshot.session || !built.engine}
            >
              {busyState === "refresh" ? "Refreshing..." : "Refresh entitlements"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => built.engine && runAction("sync-transactions", () => built.engine!.syncTransactions())}
              disabled={busyState !== null || !snapshot.session || !built.engine}
            >
              {busyState === "sync-transactions" ? "Syncing..." : "Sync transaction log"}
            </button>
          </div>
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
              <strong>{toDisplayDate(snapshot.offlineCache.lastValidatedAt)}</strong>
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

        <SectionCard
          title="Install Transaction Log"
          subtitle="Every install/update attempt is recorded with result + recoverable failure context."
        >
          <div className="entitlement-list">
            {snapshot.transactions.length === 0 ? (
              <p className="note-text">No transactions recorded yet.</p>
            ) : (
              snapshot.transactions.slice(0, 6).map((tx) => (
                <article key={tx.id} className="entitlement-item">
                  <div>
                    <h3>{tx.appName}</h3>
                    <p>
                      {tx.message} | {toDisplayDate(tx.occurredAt)}
                    </p>
                  </div>
                  <div className="item-actions">
                    <span className={`pill ${tx.status === "succeeded" ? "pill-owned" : "pill-unowned"}`}>
                      {toTransactionLabel(tx)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

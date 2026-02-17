import { useCallback, useEffect, useState } from "react";
import { type HubState } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { toHubViewModel } from "./services/hubViewModel";
import { toControlPlaneViewModel } from "./services/controlPlaneViewModel";
import { toControlPlaneOperations } from "./services/controlPlaneOperationsViewModel";
import { toControlPlaneUiContract } from "./services/controlPlaneUiContract";
import { AppCatalog } from "./components/AppCatalog";

const built = buildHubEngine();

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);

  useEffect(() => {
    if (!built.engine) return;
    void built.engine.bootstrap().then(setHubState);
  }, []);

  const handleInstall = useCallback(
    async (appId: string) => {
      if (!built.engine) return;
      setBusyAppId(appId);
      try {
        const next = await built.engine.installApp(appId);
        setHubState(next);
      } finally {
        setBusyAppId(null);
      }
    },
    []
  );

  const handleUpdate = useCallback(
    async (appId: string) => {
      if (!built.engine) return;
      setBusyAppId(appId);
      try {
        const next = await built.engine.applyUpdate(appId);
        setHubState(next);
      } finally {
        setBusyAppId(null);
      }
    },
    []
  );

  const uiContract = toControlPlaneUiContract(
    toHubViewModel(hubState),
    toControlPlaneViewModel(hubState),
    toControlPlaneOperations(hubState.snapshot)
  );

  const orderedLines = [
    uiContract.cacheLine,
    uiContract.identityLine,
    uiContract.entitlementLine,
    uiContract.installUpdateLine,
    uiContract.launchReadinessLine,
    uiContract.launchTokenLine,
    uiContract.recentOpsLine,
    uiContract.statusLine
  ];

  const engineReady = built.engine !== null && hubState.status.mode === "ready";

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Antiphon Hub</p>
        <h1>Layer 1 Control-Plane</h1>
      </header>
      <section className="grid-layout" aria-label="App catalog">
        <AppCatalog
          entitlements={hubState.snapshot.entitlements}
          onInstall={handleInstall}
          onUpdate={handleUpdate}
          engineReady={engineReady}
          busyAppId={busyAppId}
        />
      </section>
      <section aria-label="Status" className="status-section">
        {orderedLines.map((line, i) => (
          <p key={`status-${i}`} className="status-line">
            {line}
          </p>
        ))}
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { type HubState } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { toHubViewModel } from "./services/hubViewModel";
import { toControlPlaneViewModel } from "./services/controlPlaneViewModel";
import { toControlPlaneOperations } from "./services/controlPlaneOperationsViewModel";
import { toControlPlaneUiContract } from "./services/controlPlaneUiContract";

const built = buildHubEngine();

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);

  useEffect(() => {
    if (!built.engine) {
      return;
    }
    void built.engine.bootstrap().then(setHubState);
  }, []);

  const uiContract = toControlPlaneUiContract(
    toHubViewModel(hubState),
    toControlPlaneViewModel(hubState),
    toControlPlaneOperations(hubState.snapshot)
  );

  const orderedLines = [
    uiContract.cacheLine,
    uiContract.entitlementLine,
    uiContract.installUpdateLine,
    uiContract.launchReadinessLine,
    uiContract.launchTokenLine,
    uiContract.recentOpsLine,
    uiContract.statusLine
  ];

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Antiphon Hub</p>
        <h1>Layer 1 Control-Plane</h1>
      </header>
      {orderedLines.map((line) => (
        <p key={line} className="status-line">
          {line}
        </p>
      ))}
    </main>
  );
}

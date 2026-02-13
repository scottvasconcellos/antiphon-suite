import { HubEngine } from "../domain/hubEngine";
import { type HubState } from "../domain/types";
import { HttpHubGateway } from "./httpHubGateway";
import { LocalSnapshotStore } from "./localSnapshotStore";

function missingConfigState(message: string): HubState {
  return {
    snapshot: {
      session: null,
      entitlements: [],
      offlineCache: {
        lastValidatedAt: null,
        maxOfflineDays: 21,
        offlineDaysRemaining: 0,
        cacheState: "empty"
      },
      transactions: []
    },
    status: {
      mode: "configuration-error",
      message
    }
  };
}

export function buildHubEngine(): { engine: HubEngine | null; initialState: HubState } {
  const apiBaseUrl = import.meta.env.VITE_ANTIPHON_API_URL;
  if (!apiBaseUrl) {
    return {
      engine: null,
      initialState: missingConfigState("Set VITE_ANTIPHON_API_URL to connect Layer 0 Hub to entitlement authority.")
    };
  }

  const engine = new HubEngine(new HttpHubGateway({ apiBaseUrl }), new LocalSnapshotStore());
  return {
    engine,
    initialState: missingConfigState("Booting...")
  };
}

import { DEFAULT_HUB_SNAPSHOT } from "../domain/defaults";
import { type HubStore } from "../domain/ports";
import { type HubSnapshot } from "../domain/types";

const STORAGE_KEY = "antiphon.layer0.snapshot";

export class LocalSnapshotStore implements HubStore {
  load(): HubSnapshot {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_HUB_SNAPSHOT;
    }

    try {
      return JSON.parse(raw) as HubSnapshot;
    } catch {
      return DEFAULT_HUB_SNAPSHOT;
    }
  }

  save(snapshot: HubSnapshot): HubSnapshot {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }
}

import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { type HubGateway, type HubStore } from "./ports";
import { type EntitledApp, type HubState } from "./types";

function upsertApp(entitlements: EntitledApp[], app: EntitledApp): EntitledApp[] {
  const index = entitlements.findIndex((candidate) => candidate.id === app.id);
  if (index === -1) {
    return [...entitlements, app];
  }
  const copy = [...entitlements];
  copy[index] = app;
  return copy;
}

export class HubEngine {
  constructor(
    private readonly gateway: HubGateway,
    private readonly store: HubStore
  ) {}

  async bootstrap(): Promise<HubState> {
    const base = this.store.load();

    try {
      const [entitlements, offlineCache] = await Promise.all([
        this.gateway.fetchEntitlements(),
        this.gateway.getOfflineCacheState()
      ]);

      const snapshot = this.store.save({
        ...base,
        entitlements,
        offlineCache
      });

      return {
        snapshot,
        status: {
          mode: "ready",
          message: "Hub connected to entitlement authority."
        }
      };
    } catch (error) {
      return {
        snapshot: base,
        status: {
          mode: "runtime-error",
          message: error instanceof Error ? error.message : "Unable to reach entitlement authority."
        }
      };
    }
  }

  async signIn(email: string): Promise<HubState> {
    const current = this.store.load();
    const session = await this.gateway.signIn(email);
    const entitlements = await this.gateway.fetchEntitlements();
    const offlineCache = await this.gateway.refreshEntitlements();

    const snapshot = this.store.save({
      ...current,
      session,
      entitlements,
      offlineCache
    });

    return {
      snapshot,
      status: {
        mode: "ready",
        message: "Identity authenticated and ownership refreshed."
      }
    };
  }

  async signOut(): Promise<HubState> {
    const current = this.store.load();
    await this.gateway.signOut();

    const snapshot = this.store.save({
      ...current,
      session: null
    });

    return {
      snapshot,
      status: {
        mode: "ready",
        message: "Signed out. Existing offline cache remains available."
      }
    };
  }

  async refreshEntitlements(): Promise<HubState> {
    const current = this.store.load();
    const [entitlements, offlineCache] = await Promise.all([
      this.gateway.fetchEntitlements(),
      this.gateway.refreshEntitlements()
    ]);

    const snapshot = this.store.save({
      ...current,
      entitlements,
      offlineCache
    });

    return {
      snapshot,
      status: {
        mode: "ready",
        message: "Entitlements refreshed."
      }
    };
  }

  async installApp(appId: string): Promise<HubState> {
    const current = this.store.load();
    const nextApp = await this.gateway.installApp(appId);

    const snapshot = this.store.save({
      ...current,
      entitlements: upsertApp(current.entitlements, nextApp)
    });

    return {
      snapshot,
      status: {
        mode: "ready",
        message: `Install transaction completed for ${nextApp.name}.`
      }
    };
  }

  async applyUpdate(appId: string): Promise<HubState> {
    const current = this.store.load();
    const nextApp = await this.gateway.applyUpdate(appId);

    const snapshot = this.store.save({
      ...current,
      entitlements: upsertApp(current.entitlements, nextApp)
    });

    return {
      snapshot,
      status: {
        mode: "ready",
        message: `Update transaction completed for ${nextApp.name}.`
      }
    };
  }

  reset(): HubState {
    const snapshot = this.store.save(DEFAULT_HUB_SNAPSHOT);
    return {
      snapshot,
      status: {
        mode: "configuration-error",
        message: "Hub reset. Configure VITE_ANTIPHON_API_URL to continue."
      }
    };
  }
}

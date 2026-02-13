import { type HubEngineContract } from "../domain/engineContract";
import { DEFAULT_HUB_SNAPSHOT } from "../domain/defaults";
import { applyHubEvent } from "../domain/hubEngineCore";
import { runMusicPipeline } from "../domain/hubMusicOrchestrator";
import { selectMusicEngine } from "../domain/musicEngineRegistry";
import { type EntitledApp, type HubSnapshot, type HubState } from "../domain/types";
import { UiMusicProjectionAdapter } from "../domain/uiMusicProjectionAdapter";

const STUB_APPS: EntitledApp[] = [
  {
    id: "antiphon.hub.stub",
    name: "Antiphon Stub App",
    version: "1.0.0",
    installedVersion: null,
    owned: true,
    installState: "not-installed",
    updateAvailable: false
  }
];

const STUB_OFFLINE_CACHE: HubSnapshot["offlineCache"] = {
  lastValidatedAt: "2026-02-13T00:00:00.000Z",
  maxOfflineDays: 21,
  offlineDaysRemaining: 21,
  cacheState: "valid"
};

export class StubHubEngine implements HubEngineContract {
  constructor(private readonly options: { musicEngineId?: string } = {}) {}

  private snapshot: HubSnapshot = structuredClone(DEFAULT_HUB_SNAPSHOT);

  async bootstrap(): Promise<HubState> {
    const next = applyHubEvent(this.snapshot, {
      type: "BOOTSTRAP_SYNCED",
      entitlements: STUB_APPS,
      offlineCache: STUB_OFFLINE_CACHE,
      transactions: []
    });
    this.snapshot = next.snapshot;
    return next;
  }

  async signIn(email: string): Promise<HubState> {
    const next = applyHubEvent(this.snapshot, {
      type: "SIGNED_IN",
      session: {
        userId: "usr_stub",
        email,
        displayName: "Stub Producer",
        signedInAt: "2026-02-13T00:00:00.000Z"
      },
      entitlements: STUB_APPS,
      offlineCache: STUB_OFFLINE_CACHE,
      transactions: []
    });
    this.snapshot = next.snapshot;
    return next;
  }

  async signOut(): Promise<HubState> {
    const next = applyHubEvent(this.snapshot, { type: "SIGNED_OUT" });
    this.snapshot = next.snapshot;
    return next;
  }

  async refreshEntitlements(): Promise<HubState> {
    const next = applyHubEvent(this.snapshot, {
      type: "ENTITLEMENTS_REFRESHED",
      entitlements: STUB_APPS,
      offlineCache: STUB_OFFLINE_CACHE,
      transactions: []
    });
    this.snapshot = next.snapshot;
    return next;
  }

  async installApp(appId: string): Promise<HubState> {
    const current = this.snapshot.entitlements.find((app) => app.id === appId) ?? STUB_APPS[0];
    const next = applyHubEvent(this.snapshot, {
      type: "APP_INSTALLED",
      app: { ...current, installedVersion: current.version, installState: "installed", updateAvailable: false },
      transactions: []
    });
    this.snapshot = next.snapshot;
    return next;
  }

  async applyUpdate(appId: string): Promise<HubState> {
    const current = this.snapshot.entitlements.find((app) => app.id === appId) ?? STUB_APPS[0];
    const nextVersion = current.version;
    const next = applyHubEvent(this.snapshot, {
      type: "APP_UPDATED",
      app: { ...current, version: nextVersion, installedVersion: nextVersion, installState: "installed", updateAvailable: false },
      transactions: []
    });
    this.snapshot = next.snapshot;
    return next;
  }

  async syncTransactions(): Promise<HubState> {
    const next = applyHubEvent(this.snapshot, { type: "TRANSACTIONS_SYNCED", transactions: [] });
    this.snapshot = next.snapshot;
    return next;
  }

  runMusicIntelligence() {
    const selected = selectMusicEngine(this.snapshot, this.options.musicEngineId);
    return runMusicPipeline(this.snapshot, selected.engine, UiMusicProjectionAdapter);
  }

  reset(): HubState {
    const next = applyHubEvent(this.snapshot, { type: "RESET" });
    this.snapshot = next.snapshot;
    return next;
  }
}

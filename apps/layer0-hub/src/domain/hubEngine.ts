import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { type HubEngineContract } from "./engineContract";
import { runMusicPipeline } from "./hubMusicOrchestrator";
import { selectMusicEngine } from "./musicEngineRegistry";
import { type HubGateway, type HubStore } from "./ports";
import { UiMusicProjectionAdapter } from "./uiMusicProjectionAdapter";
import { applyHubEvent } from "./hubEngineCore";
import { type HubState } from "./types";

export class HubEngine implements HubEngineContract {
  constructor(
    private readonly gateway: HubGateway,
    private readonly store: HubStore,
    private readonly options: { musicEngineId?: string } = {}
  ) {}

  async bootstrap(): Promise<HubState> {
    const base = this.store.load();

    try {
      const [entitlements, offlineCache, transactions] = await Promise.all([
        this.gateway.fetchEntitlements(),
        this.gateway.getOfflineCacheState(),
        this.gateway.fetchTransactions()
      ]);

      const next = applyHubEvent(base, {
        type: "BOOTSTRAP_SYNCED",
        entitlements,
        offlineCache,
        transactions
      });
      return { ...next, snapshot: this.store.save(next.snapshot) };
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
    const [entitlements, offlineCache, transactions] = await Promise.all([
      this.gateway.fetchEntitlements(),
      this.gateway.refreshEntitlements(),
      this.gateway.fetchTransactions()
    ]);

    const next = applyHubEvent(current, {
      type: "SIGNED_IN",
      session,
      entitlements,
      offlineCache,
      transactions
    });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async signOut(): Promise<HubState> {
    const current = this.store.load();
    await this.gateway.signOut();

    const next = applyHubEvent(current, { type: "SIGNED_OUT" });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async refreshEntitlements(): Promise<HubState> {
    const current = this.store.load();
    const [entitlements, offlineCache, transactions] = await Promise.all([
      this.gateway.fetchEntitlements(),
      this.gateway.refreshEntitlements(),
      this.gateway.fetchTransactions()
    ]);

    const next = applyHubEvent(current, {
      type: "ENTITLEMENTS_REFRESHED",
      entitlements,
      offlineCache,
      transactions
    });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async installApp(appId: string): Promise<HubState> {
    const current = this.store.load();
    const nextApp = await this.gateway.installApp(appId);
    const transactions = await this.gateway.fetchTransactions();

    const next = applyHubEvent(current, { type: "APP_INSTALLED", app: nextApp, transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async applyUpdate(appId: string): Promise<HubState> {
    const current = this.store.load();
    const nextApp = await this.gateway.applyUpdate(appId);
    const transactions = await this.gateway.fetchTransactions();

    const next = applyHubEvent(current, { type: "APP_UPDATED", app: nextApp, transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async syncTransactions(): Promise<HubState> {
    const current = this.store.load();
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(current, { type: "TRANSACTIONS_SYNCED", transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  runMusicIntelligence() {
    const snapshot = this.store.load();
    const selected = selectMusicEngine(snapshot, this.options.musicEngineId);
    return runMusicPipeline(snapshot, selected, UiMusicProjectionAdapter);
  }

  reset(): HubState {
    const next = applyHubEvent(DEFAULT_HUB_SNAPSHOT, { type: "RESET" });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }
}

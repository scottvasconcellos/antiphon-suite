import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { type HubEngineContract } from "./engineContract";
import { type HubGateway, type HubStore } from "./ports";
import { applyHubEvent } from "./hubEngineCore";
import { type HubState } from "./types";
import { runInstallUpdateAuthority } from "../services/installUpdateAuthority";
import { resolveBootstrapFailure } from "../services/controlPlaneBootstrap";

export class HubEngine implements HubEngineContract {
  constructor(
    private readonly gateway: HubGateway,
    private readonly store: HubStore
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
      return resolveBootstrapFailure(base, error instanceof Error ? error.message : "Unable to reach entitlement authority.");
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
    const authority = await runInstallUpdateAuthority(current, "install", appId, async (_action, id) => {
      try {
        const app = await this.gateway.installApp(id);
        return { ok: true, app } as const;
      } catch {
        return { ok: false, reasonCode: "failed_gateway" } as const;
      }
    });
    if (!authority.result.ok) {
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Install authority blocked (${authority.result.reasonCode}).`,
          code: authority.result.reasonCode
        }
      };
    }
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(authority.snapshot, { type: "APP_INSTALLED", app: authority.snapshot.entitlements.find((app) => app.id === appId)!, transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async applyUpdate(appId: string): Promise<HubState> {
    const current = this.store.load();
    const authority = await runInstallUpdateAuthority(current, "update", appId, async (_action, id) => {
      try {
        const app = await this.gateway.applyUpdate(id);
        return { ok: true, app } as const;
      } catch {
        return { ok: false, reasonCode: "failed_gateway" } as const;
      }
    });
    if (!authority.result.ok) {
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Update authority blocked (${authority.result.reasonCode}).`,
          code: authority.result.reasonCode
        }
      };
    }
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(authority.snapshot, { type: "APP_UPDATED", app: authority.snapshot.entitlements.find((app) => app.id === appId)!, transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async syncTransactions(): Promise<HubState> {
    const current = this.store.load();
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(current, { type: "TRANSACTIONS_SYNCED", transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  reset(): HubState {
    const next = applyHubEvent(DEFAULT_HUB_SNAPSHOT, { type: "RESET" });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }
}

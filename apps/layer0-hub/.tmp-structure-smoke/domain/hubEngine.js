import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { applyHubEvent } from "./hubEngineCore";
export class HubEngine {
    gateway;
    store;
    constructor(gateway, store) {
        this.gateway = gateway;
        this.store = store;
    }
    async bootstrap() {
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
        }
        catch (error) {
            return {
                snapshot: base,
                status: {
                    mode: "runtime-error",
                    message: error instanceof Error ? error.message : "Unable to reach entitlement authority."
                }
            };
        }
    }
    async signIn(email) {
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
    async signOut() {
        const current = this.store.load();
        await this.gateway.signOut();
        const next = applyHubEvent(current, { type: "SIGNED_OUT" });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    async refreshEntitlements() {
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
    async installApp(appId) {
        const current = this.store.load();
        const nextApp = await this.gateway.installApp(appId);
        const transactions = await this.gateway.fetchTransactions();
        const next = applyHubEvent(current, { type: "APP_INSTALLED", app: nextApp, transactions });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    async applyUpdate(appId) {
        const current = this.store.load();
        const nextApp = await this.gateway.applyUpdate(appId);
        const transactions = await this.gateway.fetchTransactions();
        const next = applyHubEvent(current, { type: "APP_UPDATED", app: nextApp, transactions });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    async syncTransactions() {
        const current = this.store.load();
        const transactions = await this.gateway.fetchTransactions();
        const next = applyHubEvent(current, { type: "TRANSACTIONS_SYNCED", transactions });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    reset() {
        const next = applyHubEvent(DEFAULT_HUB_SNAPSHOT, { type: "RESET" });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
}

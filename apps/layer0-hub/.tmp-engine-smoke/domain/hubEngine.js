import { DEFAULT_HUB_SNAPSHOT } from "./defaults.js";
import { runMusicPipeline } from "./hubMusicOrchestrator.js";
import { selectMusicEngine } from "./musicEngineRegistry.js";
import { UiMusicProjectionAdapter } from "./uiMusicProjectionAdapter.js";
import { applyHubEvent } from "./hubEngineCore.js";
import { toAuthorityMusicTelemetryDto } from "../services/musicTelemetryDto.js";
import { runInstallUpdateAuthority } from "../services/installUpdateAuthority.js";
import { resolveBootstrapFailure } from "../services/controlPlaneBootstrap.js";
export class HubEngine {
    gateway;
    store;
    options;
    constructor(gateway, store, options = {}) {
        this.gateway = gateway;
        this.store = store;
        this.options = options;
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
            return resolveBootstrapFailure(base, error instanceof Error ? error.message : "Unable to reach entitlement authority.");
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
        const authority = await runInstallUpdateAuthority(current, "install", appId, async (_action, id) => {
            try {
                const app = await this.gateway.installApp(id);
                return { ok: true, app };
            }
            catch {
                return { ok: false, reasonCode: "failed_gateway" };
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
        const next = applyHubEvent(authority.snapshot, { type: "APP_INSTALLED", app: authority.snapshot.entitlements.find((app) => app.id === appId), transactions });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    async applyUpdate(appId) {
        const current = this.store.load();
        const authority = await runInstallUpdateAuthority(current, "update", appId, async (_action, id) => {
            try {
                const app = await this.gateway.applyUpdate(id);
                return { ok: true, app };
            }
            catch {
                return { ok: false, reasonCode: "failed_gateway" };
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
        const next = applyHubEvent(authority.snapshot, { type: "APP_UPDATED", app: authority.snapshot.entitlements.find((app) => app.id === appId), transactions });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
    async syncTransactions() {
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
    buildMusicTelemetry() {
        const snapshot = this.store.load();
        const intelligence = this.runMusicIntelligence();
        return toAuthorityMusicTelemetryDto(snapshot, intelligence);
    }
    reset() {
        const next = applyHubEvent(DEFAULT_HUB_SNAPSHOT, { type: "RESET" });
        return { ...next, snapshot: this.store.save(next.snapshot) };
    }
}

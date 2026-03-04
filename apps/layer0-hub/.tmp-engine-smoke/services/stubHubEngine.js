import { DEFAULT_HUB_SNAPSHOT } from "../domain/defaults.js";
import { applyHubEvent } from "../domain/hubEngineCore.js";
import { runMusicPipeline } from "../domain/hubMusicOrchestrator.js";
import { selectMusicEngine } from "../domain/musicEngineRegistry.js";
import { UiMusicProjectionAdapter } from "../domain/uiMusicProjectionAdapter.js";
import { toAuthorityMusicTelemetryDto } from "./musicTelemetryDto.js";
const STUB_APPS = [
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
const STUB_OFFLINE_CACHE = {
    lastValidatedAt: "2026-02-13T00:00:00.000Z",
    maxOfflineDays: 21,
    offlineDaysRemaining: 21,
    cacheState: "valid"
};
export class StubHubEngine {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    snapshot = structuredClone(DEFAULT_HUB_SNAPSHOT);
    async bootstrap() {
        const next = applyHubEvent(this.snapshot, {
            type: "BOOTSTRAP_SYNCED",
            entitlements: STUB_APPS,
            offlineCache: STUB_OFFLINE_CACHE,
            transactions: []
        });
        this.snapshot = next.snapshot;
        return next;
    }
    async signIn(email) {
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
    async signOut() {
        const next = applyHubEvent(this.snapshot, { type: "SIGNED_OUT" });
        this.snapshot = next.snapshot;
        return next;
    }
    async refreshEntitlements() {
        const next = applyHubEvent(this.snapshot, {
            type: "ENTITLEMENTS_REFRESHED",
            entitlements: STUB_APPS,
            offlineCache: STUB_OFFLINE_CACHE,
            transactions: []
        });
        this.snapshot = next.snapshot;
        return next;
    }
    async installApp(appId) {
        const current = this.snapshot.entitlements.find((app) => app.id === appId) ?? STUB_APPS[0];
        const next = applyHubEvent(this.snapshot, {
            type: "APP_INSTALLED",
            app: { ...current, installedVersion: current.version, installState: "installed", updateAvailable: false },
            transactions: []
        });
        this.snapshot = next.snapshot;
        return next;
    }
    async applyUpdate(appId) {
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
    async syncTransactions() {
        const next = applyHubEvent(this.snapshot, { type: "TRANSACTIONS_SYNCED", transactions: [] });
        this.snapshot = next.snapshot;
        return next;
    }
    runMusicIntelligence() {
        const selected = selectMusicEngine(this.snapshot, this.options.musicEngineId);
        return runMusicPipeline(this.snapshot, selected, UiMusicProjectionAdapter);
    }
    buildMusicTelemetry() {
        return toAuthorityMusicTelemetryDto(this.snapshot, this.runMusicIntelligence());
    }
    reset() {
        const next = applyHubEvent(this.snapshot, { type: "RESET" });
        this.snapshot = next.snapshot;
        return next;
    }
}

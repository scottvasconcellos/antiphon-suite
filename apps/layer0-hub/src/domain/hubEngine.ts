import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { type HubEngineContract } from "./engineContract";
import { type HubGateway, type HubStore } from "./ports";
import { applyHubEvent } from "./hubEngineCore";
import { type HubState } from "./types";
import { runInstallUpdateAuthority } from "../services/installUpdateAuthority";
import { resolveBootstrapFailure } from "../services/controlPlaneBootstrap";
import { issueLaunchToken } from "./launchTokenBoundary";
import { toEpochSeconds } from "../services/timeControl";

// Node-only modules: dynamically imported to avoid browser bundling errors
// These will only work in Node.js environments (tests, Electron, etc.)
const isBrowser = typeof window !== "undefined";

async function fetchArtifactFromFilesystemSafe(
  appId: string,
  version: string
): Promise<{ ok: true; manifestRaw: string; payloadFiles: Record<string, string> } | { ok: false; reasonCode: "artifact_not_found" | "artifact_missing_file" | "artifact_read_error" | "browser_environment" }> {
  if (isBrowser) {
    return { ok: false, reasonCode: "browser_environment" };
  }
  const { fetchArtifactFromFilesystem } = await import("../services/artifactFetcher");
  return fetchArtifactFromFilesystem(appId, version);
}

async function installArtifactToDiskSafe(
  appId: string,
  version: string,
  manifestRaw: string,
  payloadFiles: Record<string, string>
): Promise<{ ok: true; installedPath: string } | { ok: false; reasonCode: "artifact_digest_mismatch" | "artifact_write_error" | "artifact_parse_error" | "artifact_directory_error" | "browser_environment" }> {
  if (isBrowser) {
    return { ok: false, reasonCode: "browser_environment" };
  }
  const { installArtifactToDisk } = await import("../services/diskArtifactInstaller");
  return installArtifactToDisk(appId, version, manifestRaw, payloadFiles);
}

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

  async signInWithFirebase(idToken: string): Promise<HubState> {
    const current = this.store.load();
    const session = await this.gateway.signInWithFirebase(idToken);
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

    // 1. Authority approval
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
          message: `Install blocked (${authority.result.reasonCode}).`,
          code: authority.result.reasonCode
        }
      };
    }

    // 2. Fetch artifact
    const app = authority.snapshot.entitlements.find((a) => a.id === appId);
    if (!app) {
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: "App not found after authority approval.",
          code: "blocked_app_not_found"
        }
      };
    }

    const artifact = await fetchArtifactFromFilesystemSafe(appId, app.version);
    if (!artifact.ok) {
      if (artifact.reasonCode === "browser_environment") {
        // Authority already updated server; reflect in local state so UI updates without reload
        const saved = this.store.save(authority.snapshot);
        return {
          snapshot: saved,
          status: { mode: "ready", message: "Installed. Sync to disk on next desktop run.", code: "ok_browser_install" }
        };
      }
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Artifact fetch failed: ${artifact.reasonCode}`,
          code: artifact.reasonCode
        }
      };
    }

    // 3. Install to disk
    const installed = await installArtifactToDiskSafe(appId, app.version, artifact.manifestRaw, artifact.payloadFiles);
    if (!installed.ok) {
      if (installed.reasonCode === "browser_environment") {
        const saved = this.store.save(authority.snapshot);
        return {
          snapshot: saved,
          status: { mode: "ready", message: "Installed. Sync to disk on next desktop run.", code: "ok_browser_install" }
        };
      }
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Install failed: ${installed.reasonCode}`,
          code: installed.reasonCode
        }
      };
    }

    // 4. Update snapshot with installed version
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(authority.snapshot, {
      type: "APP_INSTALLED",
      app: { ...app, installedVersion: app.version, installState: "installed", updateAvailable: false },
      transactions
    });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async applyUpdate(appId: string): Promise<HubState> {
    const current = this.store.load();

    // 1. Authority approval
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
          message: `Update blocked (${authority.result.reasonCode}).`,
          code: authority.result.reasonCode
        }
      };
    }

    // 2. Fetch artifact
    const app = authority.snapshot.entitlements.find((a) => a.id === appId);
    if (!app) {
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: "App not found after authority approval.",
          code: "blocked_app_not_found"
        }
      };
    }

    const artifact = await fetchArtifactFromFilesystemSafe(appId, app.version);
    if (!artifact.ok) {
      if (artifact.reasonCode === "browser_environment") {
        const saved = this.store.save(authority.snapshot);
        return {
          snapshot: saved,
          status: { mode: "ready", message: "Updated. Sync to disk on next desktop run.", code: "ok_browser_update" }
        };
      }
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Artifact fetch failed: ${artifact.reasonCode}`,
          code: artifact.reasonCode
        }
      };
    }

    // 3. Install to disk
    const installed = await installArtifactToDiskSafe(appId, app.version, artifact.manifestRaw, artifact.payloadFiles);
    if (!installed.ok) {
      if (installed.reasonCode === "browser_environment") {
        const saved = this.store.save(authority.snapshot);
        return {
          snapshot: saved,
          status: { mode: "ready", message: "Updated. Sync to disk on next desktop run.", code: "ok_browser_update" }
        };
      }
      return {
        snapshot: current,
        status: {
          mode: "runtime-error",
          message: `Update failed: ${installed.reasonCode}`,
          code: installed.reasonCode
        }
      };
    }

    // 4. Update snapshot with new installed version
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(authority.snapshot, {
      type: "APP_UPDATED",
      app: { ...app, installedVersion: app.version, installState: "installed", updateAvailable: false },
      transactions
    });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async syncTransactions(): Promise<HubState> {
    const current = this.store.load();
    const transactions = await this.gateway.fetchTransactions();
    const next = applyHubEvent(current, { type: "TRANSACTIONS_SYNCED", transactions });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }

  async getLaunchToken(appId: string): Promise<string | null> {
    const current = this.store.load();
    const app = current.entitlements.find((a) => a.id === appId);

    // Check if app is owned and installed
    if (!app || !app.owned || !app.installedVersion) {
      return null;
    }

    // Generate launch token
    const TOKEN_SECRET = "antiphon.layer1.launch";
    const TOKEN_TTL_SECONDS = 3600;
    const issuedAt = toEpochSeconds(new Date().toISOString());

    const token = issueLaunchToken(
      {
        appId: app.id,
        userId: current.session?.userId ?? "offline-user",
        entitlementOutcome: current.session ? "Authorized" : "OfflineAuthorized",
        issuedAt,
        expiresAt: issuedAt + TOKEN_TTL_SECONDS
      },
      TOKEN_SECRET
    );

    return token;
  }

  async redeemSerial(serial: string): Promise<import("./engineContract").RedeemSerialResult> {
    const result = await this.gateway.redeemSerial(serial);
    if (result.success && result.entitlements) {
      // Update local state with new entitlements
      const current = this.store.load();
      const next = applyHubEvent(current, {
        type: "BOOTSTRAP_SYNCED",
        entitlements: result.entitlements,
        offlineCache: current.offlineCache,
        transactions: current.transactions
      });
      this.store.save(next.snapshot);
    }
    return result;
  }

  reset(): HubState {
    const next = applyHubEvent(DEFAULT_HUB_SNAPSHOT, { type: "RESET" });
    return { ...next, snapshot: this.store.save(next.snapshot) };
  }
}

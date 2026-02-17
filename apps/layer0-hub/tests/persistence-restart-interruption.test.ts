/**
 * Restart/interruption: verifies persistence and trust artifact handling under
 * "interrupt then reload" so recovery state is always legal and stable.
 * Phase B task 3: persistence and trust artifact handling under restart/interruption sequences.
 */
import assert from "node:assert";
import {
  parsePersistedControlPlaneStateWithReport,
  serializePersistedControlPlaneState,
  toPersistedControlPlaneState
} from "../src/services/controlPlanePersistence";
import {
  issueTrustArtifact,
  parseTrustArtifactWithReport,
  serializeTrustArtifact
} from "../src/services/controlPlaneTrustArtifact";
import { applyHubEvent } from "../src/domain/hubEngineCore";
import { DEFAULT_HUB_SNAPSHOT } from "../src/domain/defaults";
import type { EntitledApp } from "../src/domain/types";

const SAMPLE_OFFLINE_CACHE = {
  lastValidatedAt: "2026-02-13T00:00:00.000Z",
  maxOfflineDays: 21,
  offlineDaysRemaining: 21,
  cacheState: "valid" as const
};

const SAMPLE_ENTITLEMENTS: EntitledApp[] = [
  {
    id: "antiphon.layer.hello-world",
    name: "Hello World",
    version: "1.1.0",
    installedVersion: "1.1.0",
    owned: true,
    installState: "installed",
    updateAvailable: false
  }
];

async function run() {
  // --- Persistence: interrupt then reload ---
  // 1. Build a snapshot (e.g. post-bootstrap with one app installed)
  const snapshotAfterBootstrap = applyHubEvent(DEFAULT_HUB_SNAPSHOT, {
    type: "BOOTSTRAP_SYNCED",
    entitlements: SAMPLE_ENTITLEMENTS,
    offlineCache: SAMPLE_OFFLINE_CACHE,
    transactions: []
  }).snapshot;

  const snapshotAfterInstall = applyHubEvent(snapshotAfterBootstrap, {
    type: "APP_INSTALLED",
    app: SAMPLE_ENTITLEMENTS[0],
    transactions: []
  }).snapshot;

  // 2. Persist and serialize (what would be written to disk/cache)
  const persisted = toPersistedControlPlaneState(snapshotAfterInstall, null);
  const serialized = serializePersistedControlPlaneState(persisted);

  // 3. Simulate interrupt: we only keep the serialized string (process "restarted")
  const savedString = serialized;

  // 4. Reload: parse as if loading after restart
  const report = parsePersistedControlPlaneStateWithReport(savedString);
  assert.strictEqual(report.reasonCode, "ok_cache_loaded", `Expected ok_cache_loaded after reload, got ${report.reasonCode}`);
  assert(report.state !== null, "Expected non-null state after reload");
  assert.strictEqual(report.state?.schema, "antiphon.control-plane-cache");
  assert.strictEqual(report.state?.version, 1);
  assert(Array.isArray(report.state?.installState), "Restored state must have installState array");
  const installedApp = report.state?.installState?.find((e) => e.appId === "antiphon.layer.hello-world");
  assert(installedApp, "Restored state must contain hello-world install");
  assert.strictEqual(installedApp.installedVersion, "1.1.0");
  assert.strictEqual(installedApp.installState, "installed");

  // --- Trust artifact: interrupt then reload ---
  // 1. Issue trust artifact from same snapshot
  const trustArtifact = issueTrustArtifact(snapshotAfterInstall);
  const trustSerialized = serializeTrustArtifact(trustArtifact);

  // 2. Simulate restart: only the serialized trust artifact remains
  const savedTrustString = trustSerialized;

  // 3. Reload trust artifact
  const trustReport = parseTrustArtifactWithReport(savedTrustString);
  assert.strictEqual(
    trustReport.reasonCode,
    "ok_trust_artifact_loaded",
    `Expected ok_trust_artifact_loaded after reload, got ${trustReport.reasonCode}`
  );
  assert(trustReport.artifact !== null, "Expected non-null trust artifact after reload");
  assert.strictEqual(trustReport.artifact?.schema, "antiphon.trust-artifact");
  assert(trustReport.artifact?.appIds?.includes("antiphon.layer.hello-world"), "Trust artifact must list hello-world");
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});

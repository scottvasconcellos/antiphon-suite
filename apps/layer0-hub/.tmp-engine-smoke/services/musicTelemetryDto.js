import { AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION } from "../domain/musicTelemetryContracts.js";
function normalizePipeline(pipeline) {
    if (!pipeline) {
        return {
            status: "runtime-error",
            message: "Pipeline unavailable.",
            engineId: "none",
            engineName: "none",
            engineVersion: "0.0.0",
            selectionSource: "default",
            selectionReason: "No selection available.",
            selectedEngineId: "none",
            selectedCapabilitySummary: "none",
            matrixSnapshotRef: "apps/layer0-hub/fixtures/engine-capability-matrix-snapshots.json",
            projection: null
        };
    }
    if (!pipeline.engineId || !pipeline.engineName || !pipeline.engineVersion) {
        return {
            ...pipeline,
            status: "runtime-error",
            message: "Pipeline metadata invalid.",
            engineId: pipeline.engineId || "none",
            engineName: pipeline.engineName || "none",
            engineVersion: pipeline.engineVersion || "0.0.0",
            selectedEngineId: pipeline.selectedEngineId || "none",
            selectedCapabilitySummary: pipeline.selectedCapabilitySummary || "none",
            matrixSnapshotRef: pipeline.matrixSnapshotRef || "apps/layer0-hub/fixtures/engine-capability-matrix-snapshots.json",
            projection: null
        };
    }
    return pipeline;
}
export function toAuthorityMusicTelemetryDto(snapshot, pipeline) {
    const normalized = normalizePipeline(pipeline);
    return {
        schemaVersion: AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION,
        engine: {
            id: normalized.engineId,
            name: normalized.engineName,
            version: normalized.engineVersion,
            selectedEngineId: normalized.selectedEngineId,
            capabilitySummary: normalized.selectedCapabilitySummary,
            source: normalized.selectionSource,
            reason: normalized.selectionReason,
            matrixSnapshotRef: normalized.matrixSnapshotRef
        },
        decision: {
            status: normalized.status,
            lane: normalized.projection?.lane ?? "none",
            confidencePct: normalized.projection?.confidencePct ?? 0
        },
        context: {
            hasSession: Boolean(snapshot.session),
            ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
            installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
            offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
        }
    };
}

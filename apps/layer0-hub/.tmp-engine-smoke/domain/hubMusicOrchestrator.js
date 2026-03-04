import { toMusicIntelligenceInput } from "./musicEngineContracts.js";
function isValidOutput(output) {
    if (!output || typeof output !== "object" || Array.isArray(output)) {
        return false;
    }
    const record = output;
    return ((record.lane === "authenticate" || record.lane === "install" || record.lane === "create") &&
        typeof record.reason === "string" &&
        typeof record.confidence === "number" &&
        Number.isFinite(record.confidence));
}
export function runMusicPipeline(snapshot, selection, adapter) {
    const engine = selection.engine;
    try {
        const input = toMusicIntelligenceInput(snapshot);
        const output = engine.evaluate(input);
        if (!isValidOutput(output)) {
            return {
                status: "runtime-error",
                message: `Engine contract violation from ${engine.id}.`,
                engineId: engine.id,
                engineName: engine.name,
                engineVersion: engine.version,
                selectionSource: selection.source,
                selectionReason: selection.reason,
                selectedEngineId: selection.selectedEngineId,
                selectedCapabilitySummary: selection.selectedCapabilitySummary,
                matrixSnapshotRef: selection.matrixSnapshotRef,
                projection: null
            };
        }
        return {
            status: "ready",
            message: `Engine ${engine.id} evaluated.`,
            engineId: engine.id,
            engineName: engine.name,
            engineVersion: engine.version,
            selectionSource: selection.source,
            selectionReason: selection.reason,
            selectedEngineId: selection.selectedEngineId,
            selectedCapabilitySummary: selection.selectedCapabilitySummary,
            matrixSnapshotRef: selection.matrixSnapshotRef,
            projection: adapter.toProjection(output)
        };
    }
    catch (error) {
        return {
            status: "runtime-error",
            message: error instanceof Error ? error.message : "Unknown engine runtime failure.",
            engineId: engine.id,
            engineName: engine.name,
            engineVersion: engine.version,
            selectionSource: selection.source,
            selectionReason: selection.reason,
            selectedEngineId: selection.selectedEngineId,
            selectedCapabilitySummary: selection.selectedCapabilitySummary,
            matrixSnapshotRef: selection.matrixSnapshotRef,
            projection: null
        };
    }
}

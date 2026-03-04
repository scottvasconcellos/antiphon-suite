import { MinimalRealMusicIntelligenceEngine } from "./minimalRealMusicIntelligenceEngine.js";
import { StubMusicIntelligenceEngine } from "./musicIntelligenceEngine.js";
import { RuleBasedMusicIntelligenceEngine } from "./ruleBasedMusicIntelligenceEngine.js";
const ENGINE_REGISTRY = {
    [StubMusicIntelligenceEngine.id]: StubMusicIntelligenceEngine,
    [MinimalRealMusicIntelligenceEngine.id]: MinimalRealMusicIntelligenceEngine,
    [RuleBasedMusicIntelligenceEngine.id]: RuleBasedMusicIntelligenceEngine
};
export const ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF = "apps/layer0-hub/fixtures/engine-capability-matrix-snapshots.json";
const EMERGENCY_FALLBACK_ENGINE = {
    id: "emergency-fallback-music-intelligence-v1",
    name: "Emergency Fallback Music Intelligence",
    version: "1.0.0",
    capabilities: {
        domainScope: "global",
        determinismLevel: "strict",
        fallbackPriority: 999,
        latencyTier: "fast"
    },
    evaluate() {
        return {
            lane: "authenticate",
            reason: "No eligible engines available. Reconnect and retry.",
            confidence: 0.5
        };
    }
};
export function getRegisteredMusicEngineIds() {
    return Object.keys(ENGINE_REGISTRY).sort();
}
export function getMusicEngineManifest() {
    return getRegisteredMusicEngineIds().map((id) => {
        const engine = ENGINE_REGISTRY[id];
        return {
            id: engine.id,
            name: engine.name,
            version: engine.version,
            capabilitySummary: `${engine.capabilities.domainScope}|${engine.capabilities.determinismLevel}|p${engine.capabilities.fallbackPriority}|${engine.capabilities.latencyTier}`
        };
    });
}
function capabilitySummary(engine) {
    return `${engine.capabilities.domainScope}|${engine.capabilities.determinismLevel}|p${engine.capabilities.fallbackPriority}|${engine.capabilities.latencyTier}`;
}
function isEngineEligible(engine, snapshot) {
    if (engine.id === StubMusicIntelligenceEngine.id) {
        return snapshot.offlineCache.offlineDaysRemaining >= 0;
    }
    return Boolean(snapshot.session) && snapshot.offlineCache.offlineDaysRemaining > 0;
}
function selectDefaultEngine(snapshot) {
    const candidates = getRegisteredMusicEngineIds()
        .map((id) => ENGINE_REGISTRY[id])
        .filter((engine) => isEngineEligible(engine, snapshot))
        .sort((a, b) => {
        if (a.capabilities.fallbackPriority !== b.capabilities.fallbackPriority) {
            return a.capabilities.fallbackPriority - b.capabilities.fallbackPriority;
        }
        return a.id.localeCompare(b.id);
    });
    return candidates[0] ?? EMERGENCY_FALLBACK_ENGINE;
}
export function selectMusicEngine(snapshot, requestedEngineId) {
    if (requestedEngineId && ENGINE_REGISTRY[requestedEngineId] && isEngineEligible(ENGINE_REGISTRY[requestedEngineId], snapshot)) {
        const engine = ENGINE_REGISTRY[requestedEngineId];
        return {
            engine,
            source: "requested",
            reason: `Requested engine id '${requestedEngineId}' was found.`,
            selectedEngineId: engine.id,
            selectedCapabilitySummary: capabilitySummary(engine),
            matrixSnapshotRef: ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF
        };
    }
    const defaultEngine = selectDefaultEngine(snapshot);
    const fallbackReason = requestedEngineId && ENGINE_REGISTRY[requestedEngineId] && !isEngineEligible(ENGINE_REGISTRY[requestedEngineId], snapshot)
        ? `Requested engine id '${requestedEngineId}' is ineligible for current state; applying deterministic default policy.`
        : requestedEngineId
            ? `Requested engine id '${requestedEngineId}' not found; applying deterministic default policy.`
            : defaultEngine.id === EMERGENCY_FALLBACK_ENGINE.id
                ? "No eligible engines available; using emergency deterministic fallback."
                : snapshot.session
                    ? "Session present: use deterministic highest-priority eligible real engine."
                    : "No session: use stub engine.";
    return {
        engine: defaultEngine,
        source: "default",
        reason: fallbackReason,
        selectedEngineId: defaultEngine.id,
        selectedCapabilitySummary: capabilitySummary(defaultEngine),
        matrixSnapshotRef: ENGINE_CAPABILITY_MATRIX_SNAPSHOT_REF
    };
}

import { type HubSnapshot } from "./types";
import { MinimalRealMusicIntelligenceEngine } from "./minimalRealMusicIntelligenceEngine";
import { StubMusicIntelligenceEngine } from "./musicIntelligenceEngine";
import { type MusicEnginePlugin } from "./musicEngineContracts";

const ENGINE_REGISTRY: Record<string, MusicEnginePlugin> = {
  [StubMusicIntelligenceEngine.id]: StubMusicIntelligenceEngine,
  [MinimalRealMusicIntelligenceEngine.id]: MinimalRealMusicIntelligenceEngine
};

export type MusicEngineManifestEntry = {
  id: string;
  name: string;
  version: string;
};

export type MusicEngineSelection = {
  engine: MusicEnginePlugin;
  source: "requested" | "default";
  reason: string;
};

export function getRegisteredMusicEngineIds(): string[] {
  return Object.keys(ENGINE_REGISTRY).sort();
}

export function getMusicEngineManifest(): MusicEngineManifestEntry[] {
  return getRegisteredMusicEngineIds().map((id) => {
    const engine = ENGINE_REGISTRY[id];
    return {
      id: engine.id,
      name: engine.name,
      version: engine.version
    };
  });
}

export function selectMusicEngine(snapshot: HubSnapshot, requestedEngineId?: string): MusicEngineSelection {
  if (requestedEngineId && ENGINE_REGISTRY[requestedEngineId]) {
    return {
      engine: ENGINE_REGISTRY[requestedEngineId],
      source: "requested",
      reason: `Requested engine id '${requestedEngineId}' was found.`
    };
  }

  const defaultEngine = snapshot.session ? MinimalRealMusicIntelligenceEngine : StubMusicIntelligenceEngine;
  const fallbackReason = requestedEngineId
    ? `Requested engine id '${requestedEngineId}' not found; applying deterministic default policy.`
    : snapshot.session
      ? "Session present: use minimal real engine."
      : "No session: use stub engine.";
  return {
    engine: defaultEngine,
    source: "default",
    reason: fallbackReason
  };
}

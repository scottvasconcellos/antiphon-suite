import { type HubSnapshot } from "./types";
import { MinimalRealMusicIntelligenceEngine } from "./minimalRealMusicIntelligenceEngine";
import { StubMusicIntelligenceEngine } from "./musicIntelligenceEngine";
import { type MusicEnginePlugin } from "./musicEngineContracts";

const ENGINE_REGISTRY: Record<string, MusicEnginePlugin> = {
  [StubMusicIntelligenceEngine.id]: StubMusicIntelligenceEngine,
  [MinimalRealMusicIntelligenceEngine.id]: MinimalRealMusicIntelligenceEngine
};

export type MusicEngineSelection = {
  engine: MusicEnginePlugin;
  source: "requested" | "default";
  reason: string;
};

export function getRegisteredMusicEngineIds(): string[] {
  return Object.keys(ENGINE_REGISTRY).sort();
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
  return {
    engine: defaultEngine,
    source: "default",
    reason: snapshot.session ? "Session present: use minimal real engine." : "No session: use stub engine."
  };
}

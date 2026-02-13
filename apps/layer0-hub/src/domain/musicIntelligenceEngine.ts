import { type MusicEnginePlugin, type MusicIntelligenceInput, type MusicIntelligenceOutput } from "./musicEngineContracts";

export function evaluateMusicIntelligence(input: MusicIntelligenceInput): MusicIntelligenceOutput {
  if (!input.hasSession) {
    return { lane: "authenticate", reason: "Session required to unlock ownership-aware tools.", confidence: 0.92 };
  }
  if (input.offlineDaysRemaining <= 0) {
    return { lane: "authenticate", reason: "Offline trust expired. Reconnect to refresh authority.", confidence: 0.9 };
  }
  if (input.ownedCount === 0) {
    return { lane: "install", reason: "No owned tools detected yet. Start by installing your first app.", confidence: 0.8 };
  }
  if (input.ownedCount > input.installedCount) {
    const gap = input.ownedCount - input.installedCount;
    const confidence = Math.min(0.95, 0.72 + gap * 0.06);
    return { lane: "install", reason: "Owned tools available but not installed.", confidence };
  }
  return {
    lane: "create",
    reason: "System ready for uninterrupted creative flow.",
    confidence: 0.78
  };
}

export const StubMusicIntelligenceEngine: MusicEnginePlugin = {
  id: "stub-music-intelligence-v1",
  name: "Stub Music Intelligence",
  version: "1.0.0",
  evaluate(input: MusicIntelligenceInput): MusicIntelligenceOutput {
    return evaluateMusicIntelligence(input);
  }
};

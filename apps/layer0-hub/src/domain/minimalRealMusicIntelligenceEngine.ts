import { type MusicEnginePlugin, type MusicIntelligenceInput, type MusicIntelligenceOutput } from "./musicEngineContracts";

function score(input: MusicIntelligenceInput): number {
  const sessionBoost = input.hasSession ? 0.2 : -0.3;
  const installGap = input.ownedCount - input.installedCount;
  const installPenalty = installGap > 0 ? Math.min(0.3, installGap * 0.06) : 0;
  const offlineBoost = input.offlineDaysRemaining > 0 ? 0.2 : -0.2;
  return sessionBoost - installPenalty + offlineBoost;
}

export function evaluateMinimalRealMusicIntelligence(input: MusicIntelligenceInput): MusicIntelligenceOutput {
  if (!input.hasSession || input.offlineDaysRemaining <= 0) {
    return {
      lane: "authenticate",
      reason: "Reconnect account to restore trusted music intelligence.",
      confidence: 0.88
    };
  }

  if (input.ownedCount > input.installedCount) {
    return {
      lane: "install",
      reason: "Install owned tools to unlock full production flow.",
      confidence: 0.82
    };
  }

  const confidence = Math.max(0.65, Math.min(0.95, 0.75 + score(input) * 0.2));
  return {
    lane: "create",
    reason: "System profile is stable for focused composition.",
    confidence
  };
}

export const MinimalRealMusicIntelligenceEngine: MusicEnginePlugin = {
  id: "minimal-real-music-intelligence-v1",
  evaluate(input: MusicIntelligenceInput): MusicIntelligenceOutput {
    return evaluateMinimalRealMusicIntelligence(input);
  }
};

import { type MusicEnginePlugin, type MusicIntelligenceInput, type MusicIntelligenceOutput } from "./musicEngineContracts";

export function evaluateRuleBasedMusicIntelligence(input: MusicIntelligenceInput): MusicIntelligenceOutput {
  if (!input.hasSession) {
    return {
      lane: "authenticate",
      reason: "Sign in to enable rule-based production guidance.",
      confidence: 0.9
    };
  }

  if (input.offlineDaysRemaining <= 0) {
    return {
      lane: "authenticate",
      reason: "Offline trust window expired. Reconnect to continue.",
      confidence: 0.89
    };
  }

  const installGap = input.ownedCount - input.installedCount;
  if (installGap >= 2) {
    return {
      lane: "install",
      reason: "Multiple owned tools are pending install.",
      confidence: 0.86
    };
  }

  if (installGap === 1) {
    return {
      lane: "install",
      reason: "One owned tool is pending install.",
      confidence: 0.8
    };
  }

  return {
    lane: "create",
    reason: "Rule set confirms readiness for focused creation.",
    confidence: 0.79
  };
}

export const RuleBasedMusicIntelligenceEngine: MusicEnginePlugin = {
  id: "rule-based-music-intelligence-v1",
  name: "Rule-Based Music Intelligence",
  version: "1.0.0",
  capabilities: {
    domainScope: "arrangement",
    determinismLevel: "strict",
    fallbackPriority: 10,
    latencyTier: "fast"
  },
  evaluate(input: MusicIntelligenceInput): MusicIntelligenceOutput {
    return evaluateRuleBasedMusicIntelligence(input);
  }
};

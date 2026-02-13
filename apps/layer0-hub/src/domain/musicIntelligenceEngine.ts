import { type HubSnapshot } from "./types";

export type MusicIntelligenceInput = {
  hasSession: boolean;
  ownedCount: number;
  installedCount: number;
  offlineDaysRemaining: number;
};

export type MusicIntelligenceDecision = {
  lane: "authenticate" | "install" | "create";
  reason: string;
  confidence: number;
};

export function evaluateMusicIntelligence(input: MusicIntelligenceInput): MusicIntelligenceDecision {
  if (!input.hasSession) {
    return { lane: "authenticate", reason: "Session required to unlock ownership-aware tools.", confidence: 0.92 };
  }
  if (input.ownedCount > input.installedCount) {
    return { lane: "install", reason: "Owned tools available but not installed.", confidence: 0.84 };
  }
  return {
    lane: "create",
    reason: input.offlineDaysRemaining > 0 ? "System ready for uninterrupted creative flow." : "Reconnect soon to refresh offline trust window.",
    confidence: 0.78
  };
}

export function toMusicIntelligenceInput(snapshot: HubSnapshot): MusicIntelligenceInput {
  return {
    hasSession: Boolean(snapshot.session),
    ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
    installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
    offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
  };
}

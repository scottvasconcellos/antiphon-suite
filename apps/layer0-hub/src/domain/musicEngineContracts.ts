import { type HubSnapshot } from "./types";

export type MusicIntelligenceInput = {
  hasSession: boolean;
  ownedCount: number;
  installedCount: number;
  offlineDaysRemaining: number;
};

export type MusicIntelligenceOutput = {
  lane: "authenticate" | "install" | "create";
  reason: string;
  confidence: number;
};

export type MusicEnginePlugin = {
  id: string;
  evaluate(input: MusicIntelligenceInput): MusicIntelligenceOutput;
};

export type UiMusicProjection = {
  lane: MusicIntelligenceOutput["lane"];
  headline: string;
  detail: string;
  confidencePct: number;
};

export type MusicProjectionAdapter = {
  id: string;
  toProjection(output: MusicIntelligenceOutput): UiMusicProjection;
};

export type MusicPipelineResult = {
  status: "ready" | "runtime-error";
  message: string;
  engineId: string;
  selectionSource: "requested" | "default";
  selectionReason: string;
  projection: UiMusicProjection | null;
};

export function toMusicIntelligenceInput(snapshot: HubSnapshot): MusicIntelligenceInput {
  return {
    hasSession: Boolean(snapshot.session),
    ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
    installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
    offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
  };
}

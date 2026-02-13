import { type MusicPipelineResult } from "../domain/musicEngineContracts";
import { type HubSnapshot } from "../domain/types";

export type AuthorityMusicTelemetryDto = {
  schemaVersion: "1.0.0";
  engine: {
    id: string;
    name: string;
    version: string;
    source: "requested" | "default";
    reason: string;
  };
  decision: {
    status: "ready" | "runtime-error";
    lane: "authenticate" | "install" | "create" | "none";
    confidencePct: number;
  };
  context: {
    hasSession: boolean;
    ownedCount: number;
    installedCount: number;
    offlineDaysRemaining: number;
  };
};

export function toAuthorityMusicTelemetryDto(
  snapshot: HubSnapshot,
  pipeline: MusicPipelineResult
): AuthorityMusicTelemetryDto {
  return {
    schemaVersion: "1.0.0",
    engine: {
      id: pipeline.engineId,
      name: pipeline.engineName,
      version: pipeline.engineVersion,
      source: pipeline.selectionSource,
      reason: pipeline.selectionReason
    },
    decision: {
      status: pipeline.status,
      lane: pipeline.projection?.lane ?? "none",
      confidencePct: pipeline.projection?.confidencePct ?? 0
    },
    context: {
      hasSession: Boolean(snapshot.session),
      ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
      installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
      offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
    }
  };
}

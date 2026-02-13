import { type MusicPipelineResult } from "../domain/musicEngineContracts";
import {
  AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION,
  type AuthorityMusicTelemetryDto
} from "../domain/musicTelemetryContracts";
import { type HubSnapshot } from "../domain/types";

export function toAuthorityMusicTelemetryDto(
  snapshot: HubSnapshot,
  pipeline: MusicPipelineResult
): AuthorityMusicTelemetryDto {
  return {
    schemaVersion: AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION,
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

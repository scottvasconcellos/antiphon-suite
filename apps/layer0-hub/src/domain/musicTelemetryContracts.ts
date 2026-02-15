export const AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION = "1.0.0" as const;

export type AuthorityMusicTelemetryDto = {
  schemaVersion: typeof AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION;
  engine: {
    id: string;
    name: string;
    version: string;
    selectedEngineId: string;
    capabilitySummary: string;
    source: "requested" | "default";
    reason: string;
    matrixSnapshotRef: string;
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

import { type HubSnapshot } from "../domain/types";
import { TRUST_ARTIFACT_MAX_SKEW_SECONDS, toEpochSeconds } from "./timeControl";

export type TrustArtifact = {
  schema: "antiphon.trust-artifact";
  version: 1;
  appIds: string[];
  issuedAt: string;
};

export type TrustArtifactParseReport = {
  artifact: TrustArtifact | null;
  reasonCode:
    | "ok_trust_artifact_loaded"
    | "invalid_trust_artifact_json"
    | "invalid_trust_artifact_shape"
    | "unsupported_trust_artifact_version"
    | "trust_artifact_clock_skew";
  remediation:
    | "none"
    | "rebuild_trust_artifact"
    | "upgrade_or_downgrade_to_supported_version"
    | "refresh_online_session";
};

export function issueTrustArtifact(snapshot: HubSnapshot): TrustArtifact {
  return {
    schema: "antiphon.trust-artifact",
    version: 1,
    appIds: snapshot.entitlements
      .filter((app) => app.owned && app.installedVersion)
      .map((app) => app.id)
      .sort((a, b) => a.localeCompare(b)),
    issuedAt: snapshot.offlineCache.lastValidatedAt ?? "2026-02-13T00:00:00.000Z"
  };
}

export function serializeTrustArtifact(artifact: TrustArtifact): string {
  return JSON.stringify(artifact);
}

export function parseTrustArtifact(raw: string): TrustArtifact | null {
  return parseTrustArtifactWithReport(raw).artifact;
}

export function parseTrustArtifactWithReport(
  raw: string,
  options?: { nowIso?: string; maxSkewSeconds?: number }
): TrustArtifactParseReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      artifact: null,
      reasonCode: "invalid_trust_artifact_json",
      remediation: "rebuild_trust_artifact"
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      artifact: null,
      reasonCode: "invalid_trust_artifact_shape",
      remediation: "rebuild_trust_artifact"
    };
  }
  const candidate = parsed as Record<string, unknown>;
  if (candidate.schema !== "antiphon.trust-artifact" || candidate.version !== 1) {
    return {
      artifact: null,
      reasonCode: "unsupported_trust_artifact_version",
      remediation: "upgrade_or_downgrade_to_supported_version"
    };
  }
  if (
    !Array.isArray(candidate.appIds) ||
    !candidate.appIds.every((appId) => typeof appId === "string") ||
    typeof candidate.issuedAt !== "string"
  ) {
    return {
      artifact: null,
      reasonCode: "invalid_trust_artifact_shape",
      remediation: "rebuild_trust_artifact"
    };
  }
  if (options?.nowIso) {
    const now = toEpochSeconds(options.nowIso);
    const issuedAt = toEpochSeconds(candidate.issuedAt);
    const skew = Math.abs(now - issuedAt);
    const maxSkew = options.maxSkewSeconds ?? TRUST_ARTIFACT_MAX_SKEW_SECONDS;
    if (Number.isFinite(skew) && skew > maxSkew) {
      return {
        artifact: null,
        reasonCode: "trust_artifact_clock_skew",
        remediation: "refresh_online_session"
      };
    }
  }
  return {
    artifact: {
      schema: "antiphon.trust-artifact",
      version: 1,
      appIds: [...candidate.appIds].sort((a, b) => a.localeCompare(b)),
      issuedAt: candidate.issuedAt
    },
    reasonCode: "ok_trust_artifact_loaded",
    remediation: "none"
  };
}

export const TRUST_ARTIFACT_REASON_CODES = [
  "ok_trust_artifact_loaded",
  "invalid_trust_artifact_json",
  "invalid_trust_artifact_shape",
  "unsupported_trust_artifact_version",
  "trust_artifact_clock_skew"
] as const;

export function normalizeTrustArtifact(artifact: TrustArtifact): TrustArtifact {
  return {
    schema: "antiphon.trust-artifact",
    version: 1,
    appIds: [...artifact.appIds].sort((a, b) => a.localeCompare(b)),
    issuedAt: artifact.issuedAt
  };
}

export function isRunnableWithoutHub(artifact: TrustArtifact | null, appId: string): boolean {
  if (!artifact) {
    return false;
  }
  return artifact.appIds.includes(appId);
}

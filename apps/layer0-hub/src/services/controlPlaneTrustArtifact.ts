import { type HubSnapshot } from "../domain/types";

export type TrustArtifact = {
  schema: "antiphon.trust-artifact";
  version: 1;
  appIds: string[];
  issuedAt: string;
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
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const candidate = parsed as Record<string, unknown>;
  if (
    candidate.schema !== "antiphon.trust-artifact" ||
    candidate.version !== 1 ||
    !Array.isArray(candidate.appIds) ||
    !candidate.appIds.every((appId) => typeof appId === "string") ||
    typeof candidate.issuedAt !== "string"
  ) {
    return null;
  }
  return {
    schema: "antiphon.trust-artifact",
    version: 1,
    appIds: [...candidate.appIds].sort((a, b) => a.localeCompare(b)),
    issuedAt: candidate.issuedAt
  };
}

export function isRunnableWithoutHub(artifact: TrustArtifact | null, appId: string): boolean {
  if (!artifact) {
    return false;
  }
  return artifact.appIds.includes(appId);
}

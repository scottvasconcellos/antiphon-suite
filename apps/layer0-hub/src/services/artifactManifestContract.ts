export type ArtifactDigestAlgorithm = "sha256";

export type ArtifactManifestFile = {
  path: string;
  size: number;
  sha256: string;
};

export type ArtifactSignatureEnvelope = {
  keyId?: string;
  algorithm?: string;
  signature?: string;
  notBefore?: string;
  notAfter?: string;
};

export type ArtifactManifest = {
  schema: "antiphon.artifact-manifest";
  version: 1;
  appId: string;
  appVersion: string;
  channel: "stable" | "beta";
  digestAlgorithm: ArtifactDigestAlgorithm;
  files: ArtifactManifestFile[];
  signature?: ArtifactSignatureEnvelope;
};

function normalizeFile(file: ArtifactManifestFile): ArtifactManifestFile {
  return {
    path: file.path,
    size: file.size,
    sha256: file.sha256.toLowerCase()
  };
}

function normalizeSignature(signature?: ArtifactSignatureEnvelope): ArtifactSignatureEnvelope | undefined {
  if (!signature) {
    return undefined;
  }
  const normalized: ArtifactSignatureEnvelope = {};
  if (typeof signature.keyId === "string") {
    normalized.keyId = signature.keyId;
  }
  if (typeof signature.algorithm === "string") {
    normalized.algorithm = signature.algorithm;
  }
  if (typeof signature.signature === "string") {
    normalized.signature = signature.signature;
  }
  if (typeof signature.notBefore === "string") {
    normalized.notBefore = signature.notBefore;
  }
  if (typeof signature.notAfter === "string") {
    normalized.notAfter = signature.notAfter;
  }
  return Object.keys(normalized).length === 0 ? undefined : normalized;
}

export function normalizeArtifactManifest(manifest: ArtifactManifest): ArtifactManifest {
  return {
    schema: "antiphon.artifact-manifest",
    version: 1,
    appId: manifest.appId,
    appVersion: manifest.appVersion,
    channel: manifest.channel,
    digestAlgorithm: "sha256",
    files: [...manifest.files].map(normalizeFile).sort((a, b) => a.path.localeCompare(b.path)),
    ...(normalizeSignature(manifest.signature) ? { signature: normalizeSignature(manifest.signature) } : {})
  };
}

export function serializeArtifactManifest(manifest: ArtifactManifest): string {
  return JSON.stringify(normalizeArtifactManifest(manifest), null, 2);
}

export type ArtifactManifestParseReport = {
  manifest: ArtifactManifest | null;
  reasonCode:
    | "ok_artifact_manifest_loaded"
    | "invalid_artifact_manifest_json"
    | "invalid_artifact_manifest_shape"
    | "unsupported_artifact_manifest_version";
  remediation: "none" | "rebuild_artifact_manifest" | "upgrade_or_downgrade_to_supported_version";
};

export const ARTIFACT_MANIFEST_REASON_CODES = [
  "ok_artifact_manifest_loaded",
  "invalid_artifact_manifest_json",
  "invalid_artifact_manifest_shape",
  "unsupported_artifact_manifest_version"
] as const;

function isValidFile(value: unknown): value is ArtifactManifestFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.sha256 === "string"
  );
}

export function parseArtifactManifest(raw: string): ArtifactManifestParseReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      manifest: null,
      reasonCode: "invalid_artifact_manifest_json",
      remediation: "rebuild_artifact_manifest"
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      manifest: null,
      reasonCode: "invalid_artifact_manifest_shape",
      remediation: "rebuild_artifact_manifest"
    };
  }

  const candidate = parsed as Record<string, unknown>;
  if (candidate.schema !== "antiphon.artifact-manifest" || candidate.version !== 1) {
    return {
      manifest: null,
      reasonCode: "unsupported_artifact_manifest_version",
      remediation: "upgrade_or_downgrade_to_supported_version"
    };
  }

  if (
    typeof candidate.appId !== "string" ||
    typeof candidate.appVersion !== "string" ||
    (candidate.channel !== "stable" && candidate.channel !== "beta") ||
    candidate.digestAlgorithm !== "sha256" ||
    !Array.isArray(candidate.files) ||
    !candidate.files.every(isValidFile)
  ) {
    return {
      manifest: null,
      reasonCode: "invalid_artifact_manifest_shape",
      remediation: "rebuild_artifact_manifest"
    };
  }

  const manifest = normalizeArtifactManifest(candidate as ArtifactManifest);
  return {
    manifest,
    reasonCode: "ok_artifact_manifest_loaded",
    remediation: "none"
  };
}

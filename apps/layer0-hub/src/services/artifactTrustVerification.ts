import { parseArtifactManifest } from "./artifactManifestContract";

export type ArtifactTrustVerificationInput = {
  manifestRaw: string;
  expectedAppId: string;
  expectedVersion: string;
  nowIso: string;
  requireSignature: boolean;
  maxClockSkewSeconds?: number;
};

export type ArtifactTrustVerificationResult = {
  trusted: boolean;
  reasonCode:
    | "ok_artifact_trust_verified"
    | "artifact_signature_missing"
    | "artifact_signature_invalid"
    | "artifact_manifest_corrupt"
    | "artifact_app_version_mismatch"
    | "artifact_signature_clock_skew"
    | "invalid_artifact_manifest_json"
    | "invalid_artifact_manifest_shape"
    | "unsupported_artifact_manifest_version";
  remediation:
    | "none"
    | "rebuild_artifact_manifest"
    | "upgrade_or_downgrade_to_supported_version"
    | "reissue_artifact_signature"
    | "refresh_online_session"
    | "retry_install";
};

export const ARTIFACT_TRUST_REASON_CODES = [
  "ok_artifact_trust_verified",
  "artifact_signature_missing",
  "artifact_signature_invalid",
  "artifact_manifest_corrupt",
  "artifact_app_version_mismatch",
  "artifact_signature_clock_skew"
] as const;

function toEpochSeconds(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

function computeDeterministicSignatureHash(payload: string, keyId: string): string {
  let hash = 0;
  const source = `${keyId}:${payload}`;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 33 + source.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function verifyArtifactTrust(input: ArtifactTrustVerificationInput): ArtifactTrustVerificationResult {
  const parsed = parseArtifactManifest(input.manifestRaw);
  if (!parsed.manifest) {
    return {
      trusted: false,
      reasonCode:
        parsed.reasonCode === "invalid_artifact_manifest_json"
          ? "invalid_artifact_manifest_json"
          : parsed.reasonCode === "invalid_artifact_manifest_shape"
            ? "invalid_artifact_manifest_shape"
            : "unsupported_artifact_manifest_version",
      remediation:
        parsed.reasonCode === "invalid_artifact_manifest_json" || parsed.reasonCode === "invalid_artifact_manifest_shape"
          ? "rebuild_artifact_manifest"
          : "upgrade_or_downgrade_to_supported_version"
    };
  }

  const manifest = parsed.manifest;
  if (manifest.appId !== input.expectedAppId || manifest.appVersion !== input.expectedVersion) {
    return {
      trusted: false,
      reasonCode: "artifact_app_version_mismatch",
      remediation: "retry_install"
    };
  }

  const signature = manifest.signature;
  if (input.requireSignature && !signature?.signature) {
    return {
      trusted: false,
      reasonCode: "artifact_signature_missing",
      remediation: "reissue_artifact_signature"
    };
  }

  if (signature?.signature) {
    const payload = JSON.stringify({
      appId: manifest.appId,
      appVersion: manifest.appVersion,
      channel: manifest.channel,
      files: manifest.files
    });
    const expected = computeDeterministicSignatureHash(payload, signature.keyId ?? "default");
    if (signature.signature !== expected) {
      return {
        trusted: false,
        reasonCode: "artifact_signature_invalid",
        remediation: "reissue_artifact_signature"
      };
    }

    const parts = (signature.algorithm ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const notBefore = parts.find((part) => part.startsWith("nbf:"))?.slice(4) ?? null;
    const notAfter = parts.find((part) => part.startsWith("naf:"))?.slice(4) ?? null;
    if (notBefore || notAfter) {
      const now = toEpochSeconds(input.nowIso);
      const skew = input.maxClockSkewSeconds ?? 300;
      if (notBefore && now + skew < toEpochSeconds(notBefore)) {
        return {
          trusted: false,
          reasonCode: "artifact_signature_clock_skew",
          remediation: "refresh_online_session"
        };
      }
      if (notAfter && now - skew > toEpochSeconds(notAfter)) {
        return {
          trusted: false,
          reasonCode: "artifact_signature_clock_skew",
          remediation: "refresh_online_session"
        };
      }
    }
  }

  if (manifest.files.some((file) => !file.path || file.size < 0 || file.sha256.length < 8)) {
    return {
      trusted: false,
      reasonCode: "artifact_manifest_corrupt",
      remediation: "rebuild_artifact_manifest"
    };
  }

  return {
    trusted: true,
    reasonCode: "ok_artifact_trust_verified",
    remediation: "none"
  };
}

export function buildDeterministicSignature(manifestRaw: string, keyId: string): string {
  const parsed = parseArtifactManifest(manifestRaw);
  if (!parsed.manifest) {
    return "invalid";
  }
  const payload = JSON.stringify({
    appId: parsed.manifest.appId,
    appVersion: parsed.manifest.appVersion,
    channel: parsed.manifest.channel,
    files: parsed.manifest.files
  });
  return computeDeterministicSignatureHash(payload, keyId);
}

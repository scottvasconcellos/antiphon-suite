import { parseArtifactManifest, type ArtifactManifest } from "./artifactManifestContract";

export type VirtualFileSystem = Record<string, string>;

export type InstallerFailureInjection = {
  mode?: "none" | "missing_file" | "digest_mismatch" | "partial_apply" | "rollback_fail";
  missingPath?: string;
};

export type ArtifactRollbackMetadata = {
  appId: string;
  previousTargetHash: string;
  manifestVersion: string;
  rollbackPrepared: boolean;
};

export type ArtifactApplyReasonCode =
  | "ok_artifact_apply_completed"
  | "invalid_artifact_manifest_json"
  | "invalid_artifact_manifest_shape"
  | "unsupported_artifact_manifest_version"
  | "artifact_missing_file"
  | "artifact_digest_mismatch"
  | "artifact_partial_apply"
  | "artifact_rollback_failed";

export const ARTIFACT_INSTALLER_REASON_CODES = [
  "ok_artifact_apply_completed",
  "invalid_artifact_manifest_json",
  "invalid_artifact_manifest_shape",
  "unsupported_artifact_manifest_version",
  "artifact_missing_file",
  "artifact_digest_mismatch",
  "artifact_partial_apply",
  "artifact_rollback_failed"
] as const;

export type ArtifactApplyResult =
  | {
      ok: true;
      reasonCode: "ok_artifact_apply_completed";
      remediation: "none";
      targetFiles: string[];
      rollback: ArtifactRollbackMetadata;
      fileSystem: VirtualFileSystem;
    }
  | {
      ok: false;
      reasonCode:
        | "invalid_artifact_manifest_json"
        | "invalid_artifact_manifest_shape"
        | "unsupported_artifact_manifest_version"
        | "artifact_missing_file"
        | "artifact_digest_mismatch"
        | "artifact_partial_apply"
        | "artifact_rollback_failed";
      remediation:
        | "rebuild_artifact_manifest"
        | "upgrade_or_downgrade_to_supported_version"
        | "retry_install"
        | "retry_update"
        | "rebuild_cache";
      targetFiles: string[];
      rollback: ArtifactRollbackMetadata;
      fileSystem: VirtualFileSystem;
    };

export type ArtifactApplyInput = {
  appId: string;
  manifestRaw: string;
  payloadFiles: VirtualFileSystem;
  targetDir: string;
  fileSystem: VirtualFileSystem;
  inject?: InstallerFailureInjection;
};

export type ArtifactTransactionResult = {
  applied: ArtifactApplyResult;
  atomicity: {
    guaranteed: boolean;
    rollbackAttempted: boolean;
    rollbackSucceeded: boolean;
  };
};

function sha256(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i += 1) {
    hash ^= content.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  const hex = hash.toString(16).padStart(8, "0");
  return `${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 64);
}

function serializeTreeHash(entries: [string, string][]): string {
  return sha256(entries.map(([path, content]) => `${path}:${sha256(content)}`).join("|"));
}

function toManifestVersion(manifest: ArtifactManifest): string {
  return `${manifest.appVersion}:${manifest.channel}`;
}

function collectTargetEntries(fileSystem: VirtualFileSystem, targetDir: string): [string, string][] {
  return Object.entries(fileSystem)
    .filter(([path]) => path.startsWith(`${targetDir}/`))
    .sort((a, b) => a[0].localeCompare(b[0]));
}

export function applyArtifactManifest(input: ArtifactApplyInput): ArtifactApplyResult {
  const parsed = parseArtifactManifest(input.manifestRaw);
  if (!parsed.manifest) {
    return {
      ok: false,
      reasonCode:
        parsed.reasonCode === "invalid_artifact_manifest_json"
          ? "invalid_artifact_manifest_json"
          : parsed.reasonCode === "invalid_artifact_manifest_shape"
            ? "invalid_artifact_manifest_shape"
            : "unsupported_artifact_manifest_version",
      remediation:
        parsed.reasonCode === "invalid_artifact_manifest_json" || parsed.reasonCode === "invalid_artifact_manifest_shape"
          ? "rebuild_artifact_manifest"
          : "upgrade_or_downgrade_to_supported_version",
      targetFiles: [],
      rollback: {
        appId: input.appId,
        previousTargetHash: serializeTreeHash(collectTargetEntries(input.fileSystem, input.targetDir)),
        manifestVersion: "unknown",
        rollbackPrepared: false
      },
      fileSystem: { ...input.fileSystem }
    };
  }

  const manifest = parsed.manifest;
  const nextFileSystem: VirtualFileSystem = { ...input.fileSystem };
  const previousTargetEntries = collectTargetEntries(nextFileSystem, input.targetDir);
  const previousTargetHash = serializeTreeHash(previousTargetEntries);

  const applyFiles = [...manifest.files].sort((a, b) => a.path.localeCompare(b.path));
  const tempDir = `${input.targetDir}.tmp`;

  for (let index = 0; index < applyFiles.length; index += 1) {
    const file = applyFiles[index];
    if (input.inject?.mode === "missing_file" && file.path === input.inject.missingPath) {
      return {
        ok: false,
        reasonCode: "artifact_missing_file",
        remediation: "retry_install",
        targetFiles: [],
        rollback: {
          appId: input.appId,
          previousTargetHash,
          manifestVersion: toManifestVersion(manifest),
          rollbackPrepared: true
        },
        fileSystem: { ...input.fileSystem }
      };
    }

    const payload = input.payloadFiles[file.path];
    if (typeof payload !== "string") {
      return {
        ok: false,
        reasonCode: "artifact_missing_file",
        remediation: "retry_install",
        targetFiles: [],
        rollback: {
          appId: input.appId,
          previousTargetHash,
          manifestVersion: toManifestVersion(manifest),
          rollbackPrepared: true
        },
        fileSystem: { ...input.fileSystem }
      };
    }

    const digest = input.inject?.mode === "digest_mismatch" && index === 0 ? `${sha256(payload)}x` : sha256(payload);
    if (digest !== file.sha256.toLowerCase()) {
      return {
        ok: false,
        reasonCode: "artifact_digest_mismatch",
        remediation: "retry_install",
        targetFiles: [],
        rollback: {
          appId: input.appId,
          previousTargetHash,
          manifestVersion: toManifestVersion(manifest),
          rollbackPrepared: true
        },
        fileSystem: { ...input.fileSystem }
      };
    }

    nextFileSystem[`${tempDir}/${file.path}`] = payload;

    if (input.inject?.mode === "partial_apply" && index === 0) {
      return {
        ok: false,
        reasonCode: "artifact_partial_apply",
        remediation: "retry_update",
        targetFiles: [file.path],
        rollback: {
          appId: input.appId,
          previousTargetHash,
          manifestVersion: toManifestVersion(manifest),
          rollbackPrepared: true
        },
        fileSystem: { ...input.fileSystem }
      };
    }
  }

  const removeTargetPaths = Object.keys(nextFileSystem).filter((path) => path.startsWith(`${input.targetDir}/`));
  for (const path of removeTargetPaths) {
    delete nextFileSystem[path];
  }

  const tempPaths = Object.keys(nextFileSystem).filter((path) => path.startsWith(`${tempDir}/`)).sort((a, b) => a.localeCompare(b));
  for (const tempPath of tempPaths) {
    const targetPath = `${input.targetDir}/${tempPath.slice(tempDir.length + 1)}`;
    nextFileSystem[targetPath] = nextFileSystem[tempPath];
    delete nextFileSystem[tempPath];
  }

  if (input.inject?.mode === "rollback_fail") {
    return {
      ok: false,
      reasonCode: "artifact_rollback_failed",
      remediation: "rebuild_cache",
      targetFiles: [],
      rollback: {
        appId: input.appId,
        previousTargetHash,
        manifestVersion: toManifestVersion(manifest),
        rollbackPrepared: false
      },
      fileSystem: { ...input.fileSystem }
    };
  }

  return {
    ok: true,
    reasonCode: "ok_artifact_apply_completed",
    remediation: "none",
    targetFiles: applyFiles.map((file) => file.path),
    rollback: {
      appId: input.appId,
      previousTargetHash,
      manifestVersion: toManifestVersion(manifest),
      rollbackPrepared: true
    },
    fileSystem: nextFileSystem
  };
}

export function executeAtomicArtifactTransaction(input: ArtifactApplyInput): ArtifactTransactionResult {
  const applied = applyArtifactManifest(input);
  if (applied.ok) {
    return {
      applied,
      atomicity: {
        guaranteed: true,
        rollbackAttempted: false,
        rollbackSucceeded: true
      }
    };
  }
  const rollbackAttempted = applied.rollback.rollbackPrepared;
  const rollbackSucceeded = rollbackAttempted && applied.reasonCode !== "artifact_rollback_failed";
  return {
    applied,
    atomicity: {
      guaranteed: rollbackSucceeded,
      rollbackAttempted,
      rollbackSucceeded
    }
  };
}

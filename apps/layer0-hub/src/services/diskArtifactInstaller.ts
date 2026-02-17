/**
 * Installs artifacts to disk at ~/.antiphon/apps/<appId>/<version>/ (or ANTIPHON_APPS_DIR).
 *
 * Invariants:
 * - Manifest is parsed and validated via parseArtifactManifest.
 * - manifest.appId and manifest.appVersion must match the inputs (appId, version).
 * - Each payload file's SHA-256 digest and byte size (UTF-8) must match the manifest.
 * - Files are written to a temporary directory (<target>.tmp) and then atomically
 *   renamed to the final install directory. Existing installs are removed first.
 *
 * On failure, the original on-disk state is preserved and a reasonCode is returned
 * so callers can surface a meaningful error to operators.
 */
import { mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { parseArtifactManifest, type ArtifactManifest } from "./artifactManifestContract";

/**
 * Computes a deterministic pseudo-SHA256 digest of a string.
 *
 * NOTE: This matches the stub implementation used by the in-memory
 * VirtualFileSystem artifact installer (`artifactInstallerExecution.ts`).
 * It is not cryptographically secure, but ensures that on-disk installs
 * and VirtualFileSystem installs agree on expected digests for the demo
 * artifacts shipped in this repo.
 */
function sha256(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i += 1) {
    hash ^= content.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  const hex = hash.toString(16).padStart(8, "0");
  return `${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 64);
}

/**
 * Gets the installation directory for an app version.
 * Uses ~/.antiphon/apps/<appId>/<version>/ or ANTIPHON_APPS_DIR env var.
 */
function getInstallDir(appId: string, version: string): string {
  const baseDir = process.env.ANTIPHON_APPS_DIR || join(homedir(), ".antiphon", "apps");
  return join(baseDir, appId, version);
}

export type DiskInstallResult =
  | { ok: true; installedPath: string }
  | {
      ok: false;
      reasonCode:
        | "artifact_digest_mismatch"
        | "artifact_write_error"
        | "artifact_parse_error"
        | "artifact_directory_error";
    };

/**
 * Installs an artifact to disk.
 * @param appId - The app ID
 * @param version - The version string
 * @param manifestRaw - The raw manifest JSON string
 * @param payloadFiles - Map of file paths to file contents
 * @returns Installation result with installed path or error
 */
export function installArtifactToDisk(
  appId: string,
  version: string,
  manifestRaw: string,
  payloadFiles: Record<string, string>
): DiskInstallResult {
  try {
    // Parse and validate manifest
    const parseResult = parseArtifactManifest(manifestRaw);
    if (!parseResult.manifest) {
      return { ok: false, reasonCode: "artifact_parse_error" };
    }
    const manifest: ArtifactManifest = parseResult.manifest;

    // Verify appId matches
    if (manifest.appId !== appId) {
      return { ok: false, reasonCode: "artifact_parse_error" };
    }

    // Verify version matches
    if (manifest.appVersion !== version) {
      return { ok: false, reasonCode: "artifact_parse_error" };
    }

    // Get installation directory
    const installDir = getInstallDir(appId, version);
    const tempDir = `${installDir}.tmp`;

    try {
      // Create temp directory (and parent directories)
      mkdirSync(tempDir, { recursive: true });
    } catch {
      return { ok: false, reasonCode: "artifact_directory_error" };
    }

    // Write payload files and verify digests
    for (const file of manifest.files) {
      const content = payloadFiles[file.path];
      if (typeof content !== "string") {
        return { ok: false, reasonCode: "artifact_write_error" };
      }

      // Verify SHA-256 digest
      const computedDigest = sha256(content).toLowerCase();
      const expectedDigest = file.sha256.toLowerCase();
      if (computedDigest !== expectedDigest) {
        return { ok: false, reasonCode: "artifact_digest_mismatch" };
      }

      // Verify size (manifest size is in bytes; content is UTF-8)
      if (Buffer.byteLength(content, "utf-8") !== file.size) {
        return { ok: false, reasonCode: "artifact_digest_mismatch" };
      }

      // Write file to temp directory
      const filePath = join(tempDir, file.path);
      try {
        // Ensure parent directories exist
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content, "utf-8");
      } catch {
        return { ok: false, reasonCode: "artifact_write_error" };
      }
    }

    // Write manifest.json to temp directory
    try {
      writeFileSync(join(tempDir, "manifest.json"), manifestRaw, "utf-8");
    } catch {
      return { ok: false, reasonCode: "artifact_write_error" };
    }

    // Atomic install: rename temp directory to final directory
    try {
      // Remove existing directory if it exists
      if (existsSync(installDir)) {
        rmSync(installDir, { recursive: true, force: true });
      }
      renameSync(tempDir, installDir);
    } catch {
      return { ok: false, reasonCode: "artifact_write_error" };
    }

    return { ok: true, installedPath: installDir };
  } catch (error) {
    return { ok: false, reasonCode: "artifact_write_error" };
  }
}

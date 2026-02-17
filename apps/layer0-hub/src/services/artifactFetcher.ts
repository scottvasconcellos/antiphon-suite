/**
 * Fetches artifact manifests and payload files from the filesystem.
 *
 * Phase 5 demo mapping:
 * - appId → artifact root:
 *   - "antiphon.layer.hello-world" → apps/layer-app-hello-world/artifacts/
 *   - "antiphon.layer.rhythm"            → apps/layer-app-rhythm/artifacts/
 *   - "antiphon.layer.chord-scale-helper" → apps/layer-app-chord-scale-helper/artifacts/
 * - version → version directory:
 *   - "1.0.0"           → v1/
 *   - "1.1.0" or "1.1." → v2/ (including 1.1.0-beta.1)
 *
 * Errors are surfaced as reason codes:
 * - artifact_not_found     — manifest.json missing for the requested app/version
 * - artifact_missing_file  — manifest lists a payload file that is not on disk
 * - artifact_read_error    — any filesystem or JSON parse failure
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = join(__dirname, "../../../..");

/**
 * Maps appId to artifact directory name.
 * Example: "antiphon.layer.hello-world" -> "layer-app-hello-world"
 */
function appIdToDirectory(appId: string): string {
  if (appId === "antiphon.layer.hello-world") {
    return "layer-app-hello-world";
  }
  if (appId === "antiphon.layer.rhythm") {
    return "layer-app-rhythm";
  }
  if (appId === "antiphon.layer.chord-scale-helper") {
    return "layer-app-chord-scale-helper";
  }
  throw new Error(`Unknown appId: ${appId}`);
}

/**
 * Maps version string to artifact version directory.
 * Example: "1.0.0" -> "v1", "1.1.0" -> "v2"
 * This is a simple mapping for Phase 5; in production this could be more sophisticated.
 */
function versionToDirectory(version: string): string {
  // Simple mapping: 1.0.0 -> v1, 1.1.0 -> v2
  // For Phase 5, we assume versions map directly to v1/v2 directories
  if (version.startsWith("1.0.")) {
    return "v1";
  }
  if (version.startsWith("1.1.")) {
    return "v2";
  }
  // Fallback: try to parse major.minor
  const parts = version.split(".");
  if (parts.length >= 2) {
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    if (!isNaN(major) && !isNaN(minor)) {
      // v1 = 1.0.x, v2 = 1.1.x, etc.
      if (major === 1 && minor === 0) return "v1";
      if (major === 1 && minor === 1) return "v2";
    }
  }
  throw new Error(`Cannot map version ${version} to directory`);
}

export type ArtifactFetchResult =
  | { ok: true; manifestRaw: string; payloadFiles: Record<string, string> }
  | { ok: false; reasonCode: "artifact_not_found" | "artifact_missing_file" | "artifact_read_error" };

/**
 * Fetches an artifact from the filesystem.
 * @param appId - The app ID (e.g. "antiphon.layer.hello-world")
 * @param version - The version string (e.g. "1.0.0")
 * @returns Artifact manifest raw JSON and payload files
 */
export function fetchArtifactFromFilesystem(
  appId: string,
  version: string
): ArtifactFetchResult {
  try {
    const appDir = appIdToDirectory(appId);
    const versionDir = versionToDirectory(version);
    const artifactPath = join(MONOREPO_ROOT, "apps", appDir, "artifacts", versionDir);

    // Read manifest.json
    const manifestPath = join(artifactPath, "manifest.json");
    if (!existsSync(manifestPath)) {
      return { ok: false, reasonCode: "artifact_not_found" };
    }

    let manifestRaw: string;
    try {
      manifestRaw = readFileSync(manifestPath, "utf-8");
    } catch (error) {
      return { ok: false, reasonCode: "artifact_read_error" };
    }

    // Parse manifest to get file list
    let manifest: { files?: Array<{ path: string }> };
    try {
      manifest = JSON.parse(manifestRaw);
    } catch {
      return { ok: false, reasonCode: "artifact_read_error" };
    }

    if (!manifest.files || !Array.isArray(manifest.files)) {
      return { ok: false, reasonCode: "artifact_read_error" };
    }

    // Read all payload files
    const payloadFiles: Record<string, string> = {};
    for (const file of manifest.files) {
      if (typeof file.path !== "string") {
        return { ok: false, reasonCode: "artifact_read_error" };
      }
      const filePath = join(artifactPath, file.path);
      if (!existsSync(filePath)) {
        return { ok: false, reasonCode: "artifact_missing_file" };
      }
      try {
        payloadFiles[file.path] = readFileSync(filePath, "utf-8");
      } catch {
        return { ok: false, reasonCode: "artifact_read_error" };
      }
    }

    return { ok: true, manifestRaw, payloadFiles };
  } catch (error) {
    return { ok: false, reasonCode: "artifact_read_error" };
  }
}

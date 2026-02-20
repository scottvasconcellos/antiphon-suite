/**
 * Derive a 0–1 quality_score from MIR metrics (mir_compare output).
 * Lower metric diffs = higher score. Optional: update stem-forge registry with score.
 * See docs/FOSS_AND_LOCAL_LLM_STACK.md (registry, quality_score).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const DEFAULT_REGISTRY_PATH = join(REPO_ROOT, "scripts", "stem-forge-registry.json");

// Reasonable bounds for normalization (lower diff = better)
const CENTROID_BOUND = 2000;  // Hz
const LOUDNESS_BOUND = 0.5;   // RMS diff

/**
 * Compute quality_score from mir_compare metrics object.
 * @param {{ spectralCentroidDiff?: number, loudnessDiff?: number }} metrics
 * @returns {number} 0–1 (higher = closer match to original)
 */
export function metricsToQualityScore(metrics) {
  if (!metrics || typeof metrics !== "object") return 0;
  const cent = Number(metrics.spectralCentroidDiff) || 0;
  const loud = Number(metrics.loudnessDiff) || 0;
  const q1 = Math.max(0, 1 - cent / CENTROID_BOUND);
  const q2 = Math.max(0, 1 - loud / LOUDNESS_BOUND);
  return Math.round(((q1 + q2) / 2) * 10000) / 10000;
}

/**
 * Load registry JSON (array of { id, type, quality_score?, path? }). Creates empty array if missing.
 * @param {string} [registryPath]
 * @returns {{ id: string, type: string, quality_score?: number, path?: string }[]}
 */
export function loadRegistry(registryPath = DEFAULT_REGISTRY_PATH) {
  const path = registryPath.startsWith("/") ? registryPath : join(REPO_ROOT, registryPath);
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Update one entry's quality_score (and path if provided); append if id not present.
 * Writes back to registry file. Merges with allowlist-style ids if registry is empty but allowlist exists.
 * @param {string} modelId - Model id (e.g. from router).
 * @param {number} quality_score - 0–1 score.
 * @param {{ path?: string, registryPath?: string }} [opts]
 */
export function updateRegistryQuality(modelId, quality_score, opts = {}) {
  const registryPath = opts.registryPath
    ? (opts.registryPath.startsWith("/") ? opts.registryPath : join(REPO_ROOT, opts.registryPath))
    : DEFAULT_REGISTRY_PATH;
  let entries = loadRegistry(registryPath);
  let found = entries.find((e) => e.id === modelId);
  if (found) {
    found.quality_score = quality_score;
    if (opts.path != null) found.path = opts.path;
  } else {
    entries.push({
      id: modelId,
      type: "clone",
      quality_score,
      ...(opts.path != null && { path: opts.path }),
    });
  }
  writeFileSync(registryPath, JSON.stringify(entries, null, 2), "utf8");
}

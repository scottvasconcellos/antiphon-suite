#!/usr/bin/env node
/**
 * STEM Forge health check: ffmpeg, Python venv, allowlist, optional Ollama.
 * Exit 0 if core deps OK; non-zero otherwise. Output: JSON to stdout.
 * Usage: node scripts/stem-forge-health.mjs [--ollama]
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = join(import.meta.dirname ?? import.meta.path, "..");
const checkOllama = process.argv.includes("--ollama");

const report = { ok: true, checks: {} };

function check(name, ok, detail) {
  report.checks[name] = ok ? { ok: true, ...(detail && { detail }) } : { ok: false, ...(detail && { detail }) };
  if (!ok) report.ok = false;
}

// ffmpeg in PATH
try {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf-8", stdio: "pipe" });
  check("ffmpeg", r.status === 0, r.status === 0 ? "in PATH" : r.stderr?.slice(0, 100));
} catch (e) {
  check("ffmpeg", false, e.message);
}

// Python venv (optional but recommended)
const venvPython = join(REPO_ROOT, ".venv", "bin", "python3");
const hasVenv = existsSync(venvPython);
check("venv", hasVenv, hasVenv ? ".venv/bin/python3" : "missing .venv (pip install -r scripts/audio-tools-requirements.txt)");

// Allowlist valid
const allowlistPath = join(REPO_ROOT, "scripts", "stem-forge-allowlist.json");
try {
  if (existsSync(allowlistPath)) {
    const data = JSON.parse(readFileSync(allowlistPath, "utf-8"));
    const valid = data && Array.isArray(data.cloneModels) && data.cloneModels.length >= 1;
    check("allowlist", valid, valid ? `${data.cloneModels.length} clone models` : "cloneModels must be non-empty array");
  } else {
    check("allowlist", true, "using defaults (no file)");
  }
} catch (e) {
  check("allowlist", false, e.message);
}

async function run() {
  // Optional: Ollama reachable
  if (checkOllama) {
    try {
      const res = await fetch("http://localhost:11434/api/tags", { method: "GET" });
      check("ollama", res.ok, res.ok ? "reachable" : `HTTP ${res.status}`);
    } catch (e) {
      check("ollama", false, e.message || "not reachable");
    }
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}
run();

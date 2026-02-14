import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildDemoOperatorContract } from "./demo.mjs";
import { buildTrustInstallOperatorContract } from "./proof-trust-install-boundary.mjs";
import { buildLongRunOperatorContract } from "./proof-long-run-determinism.mjs";

function fail(message) {
  console.error(`[operator-contract-check] FAIL: operator_contract_violation:${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseGateContractSurface() {
  const source = readFileSync(join(process.cwd(), "scripts/gate.mjs"), "utf-8");
  const steps = [...source.matchAll(/console\.log\("\[gate\] ([^"]+)"\);/g)]
    .map((match) => match[1])
    .filter((label) => label !== "repo status" && label !== "PASS")
    .sort((a, b) => a.localeCompare(b));
  return {
    contract_version: "rc0",
    script: "gate",
    step_labels: steps,
    final_marker: "PASS"
  };
}

function validateSurface(surface, shape) {
  const keys = Object.keys(surface).sort((a, b) => a.localeCompare(b));
  for (const required of shape.required_keys) {
    assert(Object.prototype.hasOwnProperty.call(surface, required), `${shape.script}:missing_required_key:${required}`);
  }
  for (const key of keys) {
    assert(shape.allowed_keys.includes(key), `${shape.script}:unexpected_key:${key}`);
  }
  assert(surface.contract_version === shape.contract_version, `${shape.script}:bad_contract_version`);
}

export async function buildOperatorContractSurface() {
  const demo = await buildDemoOperatorContract();
  const trust = await buildTrustInstallOperatorContract();
  const longRun = await buildLongRunOperatorContract();
  const gate = parseGateContractSurface();

  return {
    contract_version: "rc0",
    contracts: [demo, gate, longRun, trust].sort((a, b) => a.script.localeCompare(b.script))
  };
}

export async function runOperatorContractCheck(options = { updateLock: false }) {
  const definition = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/operator-contract-definition.json"), "utf-8")
  );

  const surface = await buildOperatorContractSurface();
  assert(surface.contract_version === definition.contract_version, "surface:bad_contract_version");

  for (const shape of definition.surfaces) {
    const target = surface.contracts.find((entry) => entry.script === shape.script);
    assert(Boolean(target), `missing_surface:${shape.script}`);
    validateSurface(target, shape);
  }

  const lockPath = join(process.cwd(), "apps/layer0-hub/fixtures/operator-contract-lock-snapshots.json");
  if (options.updateLock) {
    writeFileSync(lockPath, JSON.stringify([{ name: "operator-contract-surface", expected: surface }], null, 2) + "\n");
    console.log("[operator-contract-check] UPDATED_LOCK");
    return;
  }

  const lock = JSON.parse(readFileSync(lockPath, "utf-8"))[0]?.expected;
  assert(Boolean(lock), "missing_lock_snapshot");
  const left = stableStringify(surface);
  const right = stableStringify(lock);
  assert(left === right, "surface_lock_mismatch");

  console.log("[operator-contract-check] PASS");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const updateLock = process.argv.includes("--update-lock");
  runOperatorContractCheck({ updateLock }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    fail(message);
  });
}

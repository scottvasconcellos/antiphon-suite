import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-reason-coverage-snapshots.json"), "utf-8")
)[0]?.expectedReasonCodes;
assert(Array.isArray(fixture), "reason coverage fixture missing expectedReasonCodes");

const sortedUnique = [...new Set(fixture)].sort();
assert(JSON.stringify(fixture) === JSON.stringify(sortedUnique), "reason coverage fixture must be sorted + unique");

const taxonomySource = readFileSync(
  join(process.cwd(), "apps/layer0-hub/src/services/controlPlaneReasonTaxonomy.ts"),
  "utf-8"
);
const taxonomyKeys = [...taxonomySource.matchAll(/^\s*([a-z0-9_]+):\s*"[a-z0-9_]+"/gim)].map((m) => m[1]);
for (const code of fixture) {
  assert(taxonomyKeys.includes(code), `reason code missing taxonomy mapping: ${code}`);
}

console.log("[gate] reason coverage snapshot OK");

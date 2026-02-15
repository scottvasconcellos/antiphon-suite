import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const source = readFileSync(join(process.cwd(), "apps/layer0-hub/src/services/publicControlPlane.ts"), "utf-8");
const expected = JSON.parse(
  readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-public-surface-snapshots.json"), "utf-8")
)[0]?.expected;

const actual = [...source.matchAll(/export\s+\*\s+as\s+([A-Za-z0-9_]+)\s+from/g)].map((m) => m[1]).sort();
assert(Array.isArray(expected), "public surface fixture missing expected list");
assert(JSON.stringify(actual) === JSON.stringify([...expected].sort()), `public surface mismatch\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
console.log("[gate] public surface snapshot OK");

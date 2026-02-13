import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

function runStep(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`Step failed: ${command} ${args.join(" ")}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.engine-smoke.json"]);

  const basePath = join(process.cwd(), "apps/layer0-hub/.tmp-engine-smoke/domain");
  const corePath = join(basePath, "hubEngineCore.js");
  const coreSource = readFileSync(corePath, "utf-8").replace('from "./defaults";', 'from "./defaults.js";');
  writeFileSync(corePath, coreSource, "utf-8");
  const core = await import(pathToFileURL(join(basePath, "hubEngineCore.js")).href);
  const defaults = await import(pathToFileURL(join(basePath, "defaults.js")).href);

  const seed = structuredClone(defaults.DEFAULT_HUB_SNAPSHOT);
  const payload = {
    type: "TRANSACTIONS_SYNCED",
    transactions: [{ id: "tx_1", appId: "a", appName: "A", action: "install", status: "succeeded", message: "ok", occurredAt: "2026-02-13T00:00:00.000Z" }]
  };

  const a = core.applyHubEvent(seed, payload);
  const b = core.applyHubEvent(seed, payload);
  assert(JSON.stringify(a) === JSON.stringify(b), "applyHubEvent must be deterministic for same input.");

  const signedOut = core.applyHubEvent(
    { ...seed, session: { userId: "u", email: "u@a.com", displayName: "U", signedInAt: "2026-02-13T00:00:00.000Z" } },
    { type: "SIGNED_OUT" }
  );
  assert(signedOut.snapshot.session === null, "SIGNED_OUT must clear session.");

  const reset = core.applyHubEvent(seed, { type: "RESET" });
  assert(reset.status.mode === "configuration-error", "RESET must return configuration-error mode.");
  assert(reset.snapshot.session === null, "RESET must return default snapshot.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

import { spawnSync } from "node:child_process";
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

function expectThrows(action, message) {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

async function run() {
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.structure-smoke.json"]);

  const basePath = join(process.cwd(), "apps/layer0-hub/.tmp-structure-smoke/services");
  const contracts = await import(pathToFileURL(join(basePath, "authorityContracts.js")).href);
  const runtime = await import(pathToFileURL(join(basePath, "hubRuntime.js")).href);

  const session = contracts.parseSession({
    userId: "usr_123",
    email: "producer@antiphon.audio",
    displayName: "Producer",
    signedInAt: "2026-02-13T00:00:00.000Z"
  });
  assert(session.userId === "usr_123", "parseSession should parse valid payload.");
  expectThrows(
    () => contracts.parseSession({ userId: "usr_123" }),
    "parseSession should reject incomplete payload."
  );

  const entitlements = contracts.parseEntitlements([
    {
      id: "app.test",
      name: "App Test",
      version: "1.0.0",
      installedVersion: null,
      owned: true,
      installState: "not-installed",
      updateAvailable: false
    }
  ]);
  assert(entitlements.length === 1 && entitlements[0].id === "app.test", "parseEntitlements should parse list payload.");

  const readyState = {
    snapshot: {
      session: null,
      entitlements: [],
      offlineCache: { lastValidatedAt: null, maxOfflineDays: 21, offlineDaysRemaining: 0, cacheState: "empty" },
      transactions: []
    },
    status: { mode: "ready", message: "ok" }
  };

  const completed = await runtime.runHubTask(
    null,
    async () => ({ ...readyState, status: { mode: "ready", message: "completed" } }),
    () => readyState
  );
  assert(completed.status.message === "completed", "runHubTask should return successful task state.");

  const engine = {
    async syncTransactions() {
      return { ...readyState, status: { mode: "ready", message: "synced" } };
    }
  };
  const recovered = await runtime.runHubTask(
    engine,
    async () => {
      throw new Error("boom");
    },
    () => readyState
  );
  assert(recovered.status.mode === "runtime-error", "runHubTask should set runtime-error on failure.");
  assert(recovered.status.message === "boom", "runHubTask should preserve error message.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

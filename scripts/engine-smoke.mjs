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
  const enginePath = join(basePath, "hubEngine.js");
  const engineSource = readFileSync(enginePath, "utf-8")
    .replace('from "./defaults";', 'from "./defaults.js";')
    .replace('from "./hubEngineCore";', 'from "./hubEngineCore.js";');
  writeFileSync(enginePath, engineSource, "utf-8");
  const stubPath = join(process.cwd(), "apps/layer0-hub/.tmp-engine-smoke/services/stubHubEngine.js");
  const stubSource = readFileSync(stubPath, "utf-8")
    .replace('from "../domain/defaults";', 'from "../domain/defaults.js";')
    .replace('from "../domain/hubEngineCore";', 'from "../domain/hubEngineCore.js";');
  writeFileSync(stubPath, stubSource, "utf-8");
  const adapterPath = join(process.cwd(), "apps/layer0-hub/.tmp-engine-smoke/services/musicIntelligenceAdapter.js");
  const adapterSource = readFileSync(adapterPath, "utf-8").replace(
    'from "../domain/musicIntelligenceEngine";',
    'from "../domain/musicIntelligenceEngine.js";'
  );
  writeFileSync(adapterPath, adapterSource, "utf-8");
  const core = await import(pathToFileURL(join(basePath, "hubEngineCore.js")).href);
  const defaults = await import(pathToFileURL(join(basePath, "defaults.js")).href);
  const hubEngineModule = await import(pathToFileURL(enginePath).href);
  const stubModule = await import(pathToFileURL(stubPath).href);
  const intelligenceAdapter = await import(pathToFileURL(adapterPath).href);

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

  const fakeGateway = {
    async signIn() {
      return { userId: "usr_1", email: "a@a.com", displayName: "A", signedInAt: "2026-02-13T00:00:00.000Z" };
    },
    async signOut() {},
    async fetchEntitlements() {
      return [{ id: "app.1", name: "App One", version: "1.0.0", installedVersion: null, owned: true, installState: "not-installed", updateAvailable: false }];
    },
    async refreshEntitlements() {
      return { lastValidatedAt: "2026-02-13T00:00:00.000Z", maxOfflineDays: 21, offlineDaysRemaining: 21, cacheState: "valid" };
    },
    async installApp() {
      return { id: "app.1", name: "App One", version: "1.0.0", installedVersion: "1.0.0", owned: true, installState: "installed", updateAvailable: false };
    },
    async applyUpdate() {
      return { id: "app.1", name: "App One", version: "1.0.1", installedVersion: "1.0.1", owned: true, installState: "installed", updateAvailable: false };
    },
    async getOfflineCacheState() {
      return { lastValidatedAt: "2026-02-13T00:00:00.000Z", maxOfflineDays: 21, offlineDaysRemaining: 21, cacheState: "valid" };
    },
    async fetchTransactions() {
      return [{ id: "tx_1", appId: "app.1", appName: "App One", action: "install", status: "succeeded", message: "ok", occurredAt: "2026-02-13T00:00:00.000Z" }];
    }
  };
  let saved = structuredClone(defaults.DEFAULT_HUB_SNAPSHOT);
  const fakeStore = {
    load() {
      return saved;
    },
    save(snapshot) {
      saved = snapshot;
      return snapshot;
    }
  };

  const hubEngine = new hubEngineModule.HubEngine(fakeGateway, fakeStore);
  const signedInState = await hubEngine.signIn("a@a.com");
  assert(signedInState.status.mode === "ready", "HubEngine signIn should return ready.");
  const installedState = await hubEngine.installApp("app.1");
  assert(installedState.snapshot.entitlements[0].installedVersion === "1.0.0", "HubEngine installApp should upsert installed version.");
  const signedOutState = await hubEngine.signOut();
  assert(signedOutState.snapshot.session === null, "HubEngine signOut should clear session.");

  const stubEngineA = new stubModule.StubHubEngine();
  const stubEngineB = new stubModule.StubHubEngine();
  const stubA = await stubEngineA.bootstrap();
  const stubB = await stubEngineB.bootstrap();
  assert(JSON.stringify(stubA) === JSON.stringify(stubB), "StubHubEngine bootstrap should be deterministic.");

  const orchestratorEngineA = new stubModule.StubHubEngine();
  const orchestratorEngineB = new stubModule.StubHubEngine();
  await orchestratorEngineA.bootstrap();
  await orchestratorEngineB.bootstrap();
  const e2eA = intelligenceAdapter.runMusicIntelligence((await orchestratorEngineA.signIn("producer@antiphon.audio")).snapshot);
  const e2eB = intelligenceAdapter.runMusicIntelligence((await orchestratorEngineB.signIn("producer@antiphon.audio")).snapshot);
  assert(JSON.stringify(e2eA) === JSON.stringify(e2eB), "Orchestrator -> engine -> adapter path must be deterministic.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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

function patchImports(filePath, replacements) {
  let source = readFileSync(filePath, "utf-8");
  for (const [from, to] of replacements) {
    source = source.replace(from, to);
  }
  writeFileSync(filePath, source, "utf-8");
}

async function run() {
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.engine-smoke.json"]);

  const tmpRoot = join(process.cwd(), "apps/layer0-hub/.tmp-engine-smoke");
  const domainRoot = join(tmpRoot, "domain");
  const servicesRoot = join(tmpRoot, "services");

  patchImports(join(domainRoot, "hubEngineCore.js"), [["from \"./defaults\";", "from \"./defaults.js\";"]]);
  patchImports(join(domainRoot, "hubEngine.js"), [
    ["from \"./defaults\";", "from \"./defaults.js\";"],
    ["from \"./hubEngineCore\";", "from \"./hubEngineCore.js\";"],
    ["from \"./hubMusicOrchestrator\";", "from \"./hubMusicOrchestrator.js\";"],
    ["from \"./musicIntelligenceEngine\";", "from \"./musicIntelligenceEngine.js\";"],
    ["from \"./uiMusicProjectionAdapter\";", "from \"./uiMusicProjectionAdapter.js\";"]
  ]);
  patchImports(join(domainRoot, "hubMusicOrchestrator.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "musicIntelligenceEngine.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "uiMusicProjectionAdapter.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(servicesRoot, "stubHubEngine.js"), [
    ["from \"../domain/defaults\";", "from \"../domain/defaults.js\";"],
    ["from \"../domain/hubEngineCore\";", "from \"../domain/hubEngineCore.js\";"],
    ["from \"../domain/hubMusicOrchestrator\";", "from \"../domain/hubMusicOrchestrator.js\";"],
    ["from \"../domain/musicIntelligenceEngine\";", "from \"../domain/musicIntelligenceEngine.js\";"],
    ["from \"../domain/uiMusicProjectionAdapter\";", "from \"../domain/uiMusicProjectionAdapter.js\";"]
  ]);

  const defaults = await import(pathToFileURL(join(domainRoot, "defaults.js")).href);
  const core = await import(pathToFileURL(join(domainRoot, "hubEngineCore.js")).href);
  const hubEngineModule = await import(pathToFileURL(join(domainRoot, "hubEngine.js")).href);
  const orchestrator = await import(pathToFileURL(join(domainRoot, "hubMusicOrchestrator.js")).href);
  const stubMusicEngine = await import(pathToFileURL(join(domainRoot, "musicIntelligenceEngine.js")).href);
  const projectionAdapter = await import(pathToFileURL(join(domainRoot, "uiMusicProjectionAdapter.js")).href);
  const contracts = await import(pathToFileURL(join(domainRoot, "musicEngineContracts.js")).href);
  const stubModule = await import(pathToFileURL(join(servicesRoot, "stubHubEngine.js")).href);

  const seed = structuredClone(defaults.DEFAULT_HUB_SNAPSHOT);
  const syncEvent = {
    type: "TRANSACTIONS_SYNCED",
    transactions: [{ id: "tx_1", appId: "a", appName: "A", action: "install", status: "succeeded", message: "ok", occurredAt: "2026-02-13T00:00:00.000Z" }]
  };

  const a = core.applyHubEvent(seed, syncEvent);
  const b = core.applyHubEvent(seed, syncEvent);
  assert(JSON.stringify(a) === JSON.stringify(b), "applyHubEvent must be deterministic for same input.");

  const reset = core.applyHubEvent(seed, { type: "RESET" });
  assert(reset.status.mode === "configuration-error", "RESET must return configuration-error mode.");

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
  await hubEngine.signIn("a@a.com");
  const projectionA = hubEngine.runMusicIntelligence();
  const projectionB = hubEngine.runMusicIntelligence();
  assert(JSON.stringify(projectionA) === JSON.stringify(projectionB), "HubEngine orchestration path must be deterministic.");
  assert(projectionA.status === "ready" && projectionA.projection !== null, "HubEngine should return UI-safe projection.");

  const badPlugin = { id: "bad-plugin", evaluate() { return { lane: "invalid", reason: 42, confidence: "x" }; } };
  const badResult = orchestrator.runMusicPipeline(saved, badPlugin, projectionAdapter.UiMusicProjectionAdapter);
  assert(badResult.status === "runtime-error", "Invalid engine output must be handled as runtime-error.");
  assert(badResult.message.includes("contract violation"), "Contract enforcement message must be explicit.");

  const throwingPlugin = { id: "throwing-plugin", evaluate() { throw new Error("engine exploded"); } };
  const thrownResult = orchestrator.runMusicPipeline(saved, throwingPlugin, projectionAdapter.UiMusicProjectionAdapter);
  assert(thrownResult.status === "runtime-error", "Plugin exceptions must map to runtime-error.");
  assert(thrownResult.message === "engine exploded", "Runtime-error should preserve plugin exception message.");

  const nanPlugin = { id: "nan-plugin", evaluate() { return { lane: "create", reason: "x", confidence: Number.NaN }; } };
  const nanResult = orchestrator.runMusicPipeline(saved, nanPlugin, projectionAdapter.UiMusicProjectionAdapter);
  assert(nanResult.status === "runtime-error", "Non-finite confidence must fail contract enforcement.");

  const adapterThrowResult = orchestrator.runMusicPipeline(
    saved,
    stubMusicEngine.StubMusicIntelligenceEngine,
    { id: "throwing-adapter", toProjection() { throw new Error("adapter exploded"); } }
  );
  assert(adapterThrowResult.status === "runtime-error", "Adapter exceptions must map to runtime-error.");
  assert(adapterThrowResult.message === "adapter exploded", "Runtime-error should preserve adapter exception message.");

  const stubEngineA = new stubModule.StubHubEngine();
  const stubEngineB = new stubModule.StubHubEngine();
  const stubA = await stubEngineA.bootstrap();
  const stubB = await stubEngineB.bootstrap();
  assert(JSON.stringify(stubA) === JSON.stringify(stubB), "StubHubEngine bootstrap should be deterministic.");

  const pluginA = orchestrator.runMusicPipeline(stubA.snapshot, stubMusicEngine.StubMusicIntelligenceEngine, projectionAdapter.UiMusicProjectionAdapter);
  const pluginB = orchestrator.runMusicPipeline(stubB.snapshot, stubMusicEngine.StubMusicIntelligenceEngine, projectionAdapter.UiMusicProjectionAdapter);
  assert(JSON.stringify(pluginA) === JSON.stringify(pluginB), "Engine plugin + adapter projection must be deterministic.");

  const staleInput = { hasSession: true, ownedCount: 2, installedCount: 2, offlineDaysRemaining: 0 };
  const staleDecision = stubMusicEngine.evaluateMusicIntelligence(staleInput);
  assert(staleDecision.lane === "authenticate", "Expired offline trust should route to authenticate lane.");
  const coldInput = { hasSession: true, ownedCount: 0, installedCount: 0, offlineDaysRemaining: 21 };
  const coldDecision = stubMusicEngine.evaluateMusicIntelligence(coldInput);
  assert(coldDecision.lane === "install", "Zero-owned state should route to install lane.");

  const clampedProjection = projectionAdapter.UiMusicProjectionAdapter.toProjection({ lane: "create", reason: "ok", confidence: 2.8 });
  assert(clampedProjection.confidencePct === 100, "UI projection confidence must clamp to safe percentage.");

  const inputA = contracts.toMusicIntelligenceInput(stubA.snapshot);
  const inputB = contracts.toMusicIntelligenceInput(stubA.snapshot);
  assert(JSON.stringify(inputA) === JSON.stringify(inputB), "Input mapping must remain deterministic.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

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

function stable(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stable(entry));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = stable(value[key]);
    }
    return out;
  }
  return value;
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
    ["from \"./musicEngineRegistry\";", "from \"./musicEngineRegistry.js\";"],
    ["from \"./musicIntelligenceEngine\";", "from \"./musicIntelligenceEngine.js\";"],
    ["from \"./uiMusicProjectionAdapter\";", "from \"./uiMusicProjectionAdapter.js\";"],
    ["from \"../services/musicTelemetryDto\";", "from \"../services/musicTelemetryDto.js\";"],
    ["from \"../services/installUpdateAuthority\";", "from \"../services/installUpdateAuthority.js\";"]
  ]);
  patchImports(join(domainRoot, "hubMusicOrchestrator.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "musicIntelligenceEngine.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "minimalRealMusicIntelligenceEngine.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "ruleBasedMusicIntelligenceEngine.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(domainRoot, "musicEngineRegistry.js"), [
    ["from \"./minimalRealMusicIntelligenceEngine\";", "from \"./minimalRealMusicIntelligenceEngine.js\";"],
    ["from \"./musicIntelligenceEngine\";", "from \"./musicIntelligenceEngine.js\";"],
    ["from \"./ruleBasedMusicIntelligenceEngine\";", "from \"./ruleBasedMusicIntelligenceEngine.js\";"]
  ]);
  patchImports(join(domainRoot, "uiMusicProjectionAdapter.js"), [["from \"./musicEngineContracts\";", "from \"./musicEngineContracts.js\";"]]);
  patchImports(join(servicesRoot, "stubHubEngine.js"), [
    ["from \"../domain/defaults\";", "from \"../domain/defaults.js\";"],
    ["from \"../domain/hubEngineCore\";", "from \"../domain/hubEngineCore.js\";"],
    ["from \"../domain/hubMusicOrchestrator\";", "from \"../domain/hubMusicOrchestrator.js\";"],
    ["from \"../domain/musicEngineRegistry\";", "from \"../domain/musicEngineRegistry.js\";"],
    ["from \"../domain/musicIntelligenceEngine\";", "from \"../domain/musicIntelligenceEngine.js\";"],
    ["from \"../domain/uiMusicProjectionAdapter\";", "from \"../domain/uiMusicProjectionAdapter.js\";"],
    ["from \"./musicTelemetryDto\";", "from \"./musicTelemetryDto.js\";"]
  ]);
  patchImports(join(servicesRoot, "hubViewModel.js"), [
    ["from \"../domain/musicEngineContracts\";", "from \"../domain/musicEngineContracts.js\";"],
    ["from \"../domain/musicEngineRegistry\";", "from \"../domain/musicEngineRegistry.js\";"]
  ]);
  patchImports(join(servicesRoot, "musicTelemetryDto.js"), [
    ["from \"../domain/musicEngineContracts\";", "from \"../domain/musicEngineContracts.js\";"],
    ["from \"../domain/musicTelemetryContracts\";", "from \"../domain/musicTelemetryContracts.js\";"]
  ]);
  patchImports(join(servicesRoot, "installUpdateAuthority.js"), [
    ["from \"../domain/installUpdateStateMachine\";", "from \"../domain/installUpdateStateMachine.js\";"]
  ]);

  const defaults = await import(pathToFileURL(join(domainRoot, "defaults.js")).href);
  const core = await import(pathToFileURL(join(domainRoot, "hubEngineCore.js")).href);
  const hubEngineModule = await import(pathToFileURL(join(domainRoot, "hubEngine.js")).href);
  const orchestrator = await import(pathToFileURL(join(domainRoot, "hubMusicOrchestrator.js")).href);
  const registry = await import(pathToFileURL(join(domainRoot, "musicEngineRegistry.js")).href);
  const stubMusicEngine = await import(pathToFileURL(join(domainRoot, "musicIntelligenceEngine.js")).href);
  const realMusicEngine = await import(pathToFileURL(join(domainRoot, "minimalRealMusicIntelligenceEngine.js")).href);
  const ruleMusicEngine = await import(pathToFileURL(join(domainRoot, "ruleBasedMusicIntelligenceEngine.js")).href);
  const projectionAdapter = await import(pathToFileURL(join(domainRoot, "uiMusicProjectionAdapter.js")).href);
  const contracts = await import(pathToFileURL(join(domainRoot, "musicEngineContracts.js")).href);
  const telemetryContracts = await import(pathToFileURL(join(domainRoot, "musicTelemetryContracts.js")).href);
  const stubModule = await import(pathToFileURL(join(servicesRoot, "stubHubEngine.js")).href);
  const hubViewModel = await import(pathToFileURL(join(servicesRoot, "hubViewModel.js")).href);
  const telemetry = await import(pathToFileURL(join(servicesRoot, "musicTelemetryDto.js")).href);

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
  assert(typeof projectionA.engineId === "string" && projectionA.engineId.length > 0, "Pipeline result must surface engine id.");
  assert(projectionA.selectionSource === "default", "Pipeline result must surface deterministic selection source.");
  const telemetryA = hubEngine.buildMusicTelemetry();
  const telemetryB = hubEngine.buildMusicTelemetry();
  assert(JSON.stringify(telemetryA) === JSON.stringify(telemetryB), "HubEngine telemetry build must be deterministic.");

  const badPlugin = { id: "bad-plugin", name: "Bad Plugin", version: "1.0.0", evaluate() { return { lane: "invalid", reason: 42, confidence: "x" }; } };
  const badResult = orchestrator.runMusicPipeline(
    saved,
    { engine: badPlugin, source: "requested", reason: "test bad plugin" },
    projectionAdapter.UiMusicProjectionAdapter
  );
  assert(badResult.status === "runtime-error", "Invalid engine output must be handled as runtime-error.");
  assert(badResult.message.includes("contract violation"), "Contract enforcement message must be explicit.");

  const throwingPlugin = { id: "throwing-plugin", name: "Throwing Plugin", version: "1.0.0", evaluate() { throw new Error("engine exploded"); } };
  const thrownResult = orchestrator.runMusicPipeline(
    saved,
    { engine: throwingPlugin, source: "requested", reason: "test throwing plugin" },
    projectionAdapter.UiMusicProjectionAdapter
  );
  assert(thrownResult.status === "runtime-error", "Plugin exceptions must map to runtime-error.");
  assert(thrownResult.message === "engine exploded", "Runtime-error should preserve plugin exception message.");

  const nanPlugin = { id: "nan-plugin", name: "NaN Plugin", version: "1.0.0", evaluate() { return { lane: "create", reason: "x", confidence: Number.NaN }; } };
  const nanResult = orchestrator.runMusicPipeline(
    saved,
    { engine: nanPlugin, source: "requested", reason: "test nan plugin" },
    projectionAdapter.UiMusicProjectionAdapter
  );
  assert(nanResult.status === "runtime-error", "Non-finite confidence must fail contract enforcement.");

  const adapterThrowResult = orchestrator.runMusicPipeline(
    saved,
    { engine: stubMusicEngine.StubMusicIntelligenceEngine, source: "requested", reason: "test adapter throw" },
    { id: "throwing-adapter", toProjection() { throw new Error("adapter exploded"); } }
  );
  assert(adapterThrowResult.status === "runtime-error", "Adapter exceptions must map to runtime-error.");
  assert(adapterThrowResult.message === "adapter exploded", "Runtime-error should preserve adapter exception message.");

  const stubEngineA = new stubModule.StubHubEngine();
  const stubEngineB = new stubModule.StubHubEngine();
  const stubA = await stubEngineA.bootstrap();
  const stubB = await stubEngineB.bootstrap();
  assert(JSON.stringify(stubA) === JSON.stringify(stubB), "StubHubEngine bootstrap should be deterministic.");

  const pluginA = orchestrator.runMusicPipeline(
    stubA.snapshot,
    { engine: stubMusicEngine.StubMusicIntelligenceEngine, source: "default", reason: "test deterministic A" },
    projectionAdapter.UiMusicProjectionAdapter
  );
  const pluginB = orchestrator.runMusicPipeline(
    stubB.snapshot,
    { engine: stubMusicEngine.StubMusicIntelligenceEngine, source: "default", reason: "test deterministic A" },
    projectionAdapter.UiMusicProjectionAdapter
  );
  assert(JSON.stringify(pluginA) === JSON.stringify(pluginB), "Engine plugin + adapter projection must be deterministic.");

  const registryIds = registry.getRegisteredMusicEngineIds();
  assert(JSON.stringify(registryIds) === JSON.stringify([...registryIds].sort()), "Engine registry IDs must be deterministic.");
  const manifestFixture = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/music-engine-registry-snapshot.json"), "utf-8")
  );
  assert(
    JSON.stringify(registry.getMusicEngineManifest()) === JSON.stringify(manifestFixture),
    "Engine registry manifest snapshot mismatch."
  );
  const selectionFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/music-selection-snapshots.json"), "utf-8")
  );
  for (const fixture of selectionFixtures) {
    const selection = registry.selectMusicEngine(fixture.snapshot, fixture.requestedEngineId ?? undefined);
    assert(
      JSON.stringify(stable({
        engineId: selection.engine.id,
        source: selection.source,
        reason: selection.reason,
        selectedEngineId: selection.selectedEngineId,
        selectedCapabilitySummary: selection.selectedCapabilitySummary,
        matrixSnapshotRef: selection.matrixSnapshotRef
      })) === JSON.stringify(stable(fixture.expected)),
      `Music selection snapshot mismatch: ${fixture.name}`
    );
  }
  const requestEligibleSnapshot = {
    ...defaults.DEFAULT_HUB_SNAPSHOT,
    session: { userId: "usr_req", email: "req@antiphon.audio", displayName: "Req", signedInAt: "2026-02-13T00:00:00.000Z" },
    offlineCache: { ...defaults.DEFAULT_HUB_SNAPSHOT.offlineCache, offlineDaysRemaining: 21 }
  };
  const requested = registry.selectMusicEngine(requestEligibleSnapshot, realMusicEngine.MinimalRealMusicIntelligenceEngine.id).engine.id;
  assert(requested === realMusicEngine.MinimalRealMusicIntelligenceEngine.id, "Requested engine ID must be honored deterministically.");
  const requestedRule = registry.selectMusicEngine(requestEligibleSnapshot, ruleMusicEngine.RuleBasedMusicIntelligenceEngine.id).engine.id;
  assert(requestedRule === ruleMusicEngine.RuleBasedMusicIntelligenceEngine.id, "Requested rule-based engine ID must be honored deterministically.");
  const tieBreakSnapshot = {
    ...defaults.DEFAULT_HUB_SNAPSHOT,
    session: { userId: "usr_tie", email: "tie@antiphon.audio", displayName: "Tie", signedInAt: "2026-02-13T00:00:00.000Z" },
    offlineCache: { ...defaults.DEFAULT_HUB_SNAPSHOT.offlineCache, offlineDaysRemaining: 21 }
  };
  const tieBreakSelection = registry.selectMusicEngine(tieBreakSnapshot);
  assert(
    tieBreakSelection.engine.id === "minimal-real-music-intelligence-v1",
    "Multiple eligible engines must resolve with deterministic tie-breaker."
  );
  const ineligibleRequested = registry.selectMusicEngine(defaults.DEFAULT_HUB_SNAPSHOT, "minimal-real-music-intelligence-v1");
  assert(
    ineligibleRequested.source === "default" && ineligibleRequested.reason.includes("ineligible"),
    "Requested ineligible engine must deterministically fall back."
  );
  const noEligibleSnapshot = {
    ...defaults.DEFAULT_HUB_SNAPSHOT,
    session: null,
    offlineCache: { ...defaults.DEFAULT_HUB_SNAPSHOT.offlineCache, offlineDaysRemaining: -1 }
  };
  const noEligibleSelection = registry.selectMusicEngine(noEligibleSnapshot);
  assert(
    noEligibleSelection.engine.id === "emergency-fallback-music-intelligence-v1",
    "Zero eligible engines must deterministically select emergency fallback."
  );

  const explicitStubEngine = new hubEngineModule.HubEngine(fakeGateway, fakeStore, { musicEngineId: stubMusicEngine.StubMusicIntelligenceEngine.id });
  const explicitStubProjection = explicitStubEngine.runMusicIntelligence();
  assert(explicitStubProjection.engineId === stubMusicEngine.StubMusicIntelligenceEngine.id, "Explicit stub engine selection must be surfaced.");
  assert(explicitStubProjection.selectionSource === "requested", "Explicit stub selection source must be requested.");
  const explicitRealEngine = new hubEngineModule.HubEngine(fakeGateway, fakeStore, { musicEngineId: realMusicEngine.MinimalRealMusicIntelligenceEngine.id });
  const explicitRealProjection = explicitRealEngine.runMusicIntelligence();
  assert(explicitRealProjection.engineId === realMusicEngine.MinimalRealMusicIntelligenceEngine.id, "Explicit real engine selection must be surfaced.");
  assert(explicitRealProjection.selectionSource === "requested", "Explicit real selection source must be requested.");
  const invalidRequestedEngine = new hubEngineModule.HubEngine(fakeGateway, fakeStore, { musicEngineId: "unknown.engine.v1" });
  const invalidRequestedProjection = invalidRequestedEngine.runMusicIntelligence();
  assert(invalidRequestedProjection.selectionSource === "default", "Invalid requested engine must resolve to default selection source.");
  assert(invalidRequestedProjection.selectionReason.includes("not found"), "Invalid requested engine reason must describe deterministic fallback.");

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

  const fixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/hub-view-model-snapshots.json"), "utf-8")
  );
  for (const fixture of fixtures) {
    const actual = hubViewModel.toHubViewModel(fixture.hubState, fixture.intelligence);
    const summary = hubViewModel.toEngineSummaryLine(actual);
    assert(
      summary.includes(actual.intelligenceEngineId),
      `Hub engine summary mismatch: ${fixture.name}`
    );
    assert(
      JSON.stringify(stable(actual)) === JSON.stringify(stable(fixture.expected)),
      `Hub view-model snapshot mismatch: ${fixture.name}`
    );
  }
  const capabilityMatrixFixture = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/engine-capability-matrix-snapshots.json"), "utf-8")
  );
  const capabilityMatrix = hubViewModel.toCapabilityMatrixViewModel();
  assert(
    JSON.stringify(stable(capabilityMatrix)) === JSON.stringify(stable(capabilityMatrixFixture)),
    "Engine capability matrix snapshot mismatch."
  );
  assert(
    JSON.stringify(hubViewModel.toCapabilityMatrixViewModel()) === JSON.stringify(capabilityMatrix),
    "Engine capability matrix projection must be deterministic."
  );

  const pipelineFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/music-pipeline-snapshots.json"), "utf-8")
  );
  for (const fixture of pipelineFixtures) {
    const selection = registry.selectMusicEngine(fixture.snapshot, fixture.requestedEngineId ?? undefined);
    const actual = orchestrator.runMusicPipeline(fixture.snapshot, selection, projectionAdapter.UiMusicProjectionAdapter);
    const comparable = {
      status: actual.status,
      engineId: actual.engineId,
      engineName: actual.engineName,
      engineVersion: actual.engineVersion,
      selectionSource: actual.selectionSource,
      selectionReason: actual.selectionReason,
      selectedEngineId: actual.selectedEngineId,
      selectedCapabilitySummary: actual.selectedCapabilitySummary,
      matrixSnapshotRef: actual.matrixSnapshotRef,
      projection: actual.projection
    };
    assert(
      JSON.stringify(stable(comparable)) === JSON.stringify(stable(fixture.expected)),
      `Music pipeline snapshot mismatch: ${fixture.name}\nactual=${JSON.stringify(comparable)}\nexpected=${JSON.stringify(fixture.expected)}`
    );
  }

  const telemetryFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/music-telemetry-snapshots.json"), "utf-8")
  );
  for (const fixture of telemetryFixtures) {
    const selection = registry.selectMusicEngine(fixture.snapshot, fixture.requestedEngineId ?? undefined);
    const pipeline = orchestrator.runMusicPipeline(fixture.snapshot, selection, projectionAdapter.UiMusicProjectionAdapter);
    const dto = telemetry.toAuthorityMusicTelemetryDto(fixture.snapshot, pipeline);
    assert(
      JSON.stringify(stable(dto)) === JSON.stringify(stable(fixture.expected)),
      `Music telemetry snapshot mismatch: ${fixture.name}`
    );
    assert(
      dto.schemaVersion === telemetryContracts.AUTHORITY_MUSIC_TELEMETRY_SCHEMA_VERSION,
      `Telemetry schema version mismatch: ${fixture.name}`
    );
  }
  const missingTelemetry = telemetry.toAuthorityMusicTelemetryDto(defaults.DEFAULT_HUB_SNAPSHOT, null);
  assert(
    missingTelemetry.decision.status === "runtime-error" && missingTelemetry.engine.id === "none",
    "Missing telemetry input must normalize deterministically."
  );
  const invalidTelemetry = telemetry.toAuthorityMusicTelemetryDto(defaults.DEFAULT_HUB_SNAPSHOT, {
    status: "ready",
    message: "x",
    engineId: "",
    engineName: "",
    engineVersion: "",
    selectionSource: "default",
    selectionReason: "x",
    selectedEngineId: "",
    selectedCapabilitySummary: "",
    matrixSnapshotRef: "",
    projection: null
  });
  assert(
    invalidTelemetry.decision.status === "runtime-error" && invalidTelemetry.engine.id === "none",
    "Invalid telemetry input must normalize deterministically."
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

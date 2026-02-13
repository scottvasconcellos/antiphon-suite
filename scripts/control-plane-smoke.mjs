import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";

function runStep(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`Step failed: ${command} ${args.join(" ")}`);
  }
}

function stable(value) {
  if (Array.isArray(value)) {
    return value.map((v) => stable(v));
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

function assertEqual(actual, expected, message) {
  if (JSON.stringify(stable(actual)) !== JSON.stringify(stable(expected))) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.control-plane-smoke.json"]);

  const domainRoot = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/domain");
  const launchTokenPath = join(domainRoot, "launchTokenBoundary.js");
  const launchTokenSource = readFileSync(launchTokenPath, "utf-8").replace('from "node:crypto";', 'from "node:crypto";');
  writeFileSync(launchTokenPath, launchTokenSource, "utf-8");
  const authorityPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js");
  const authoritySource = readFileSync(authorityPath, "utf-8").replace(
    'from "../domain/installUpdateStateMachine";',
    'from "../domain/installUpdateStateMachine.js";'
  );
  writeFileSync(authorityPath, authoritySource, "utf-8");
  const controlPlaneVmPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneViewModel.js");
  let controlPlaneVmSource = readFileSync(controlPlaneVmPath, "utf-8");
  controlPlaneVmSource = controlPlaneVmSource.replace(
    'from "../domain/entitlementDecision";',
    'from "../domain/entitlementDecision.js";'
  );
  controlPlaneVmSource = controlPlaneVmSource.replace(
    'from "../domain/launchTokenBoundary";',
    'from "../domain/launchTokenBoundary.js";'
  );
  controlPlaneVmSource = controlPlaneVmSource.replace(
    'from "./controlPlanePersistence";',
    'from "./controlPlanePersistence.js";'
  );
  controlPlaneVmSource = controlPlaneVmSource.replace(
    'from "./launchReadinessMatrix";',
    'from "./launchReadinessMatrix.js";'
  );
  writeFileSync(controlPlaneVmPath, controlPlaneVmSource, "utf-8");
  const launchReadinessPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/launchReadinessMatrix.js");
  let launchReadinessSource = readFileSync(launchReadinessPath, "utf-8");
  launchReadinessSource = launchReadinessSource.replace(
    'from "../domain/launchTokenBoundary";',
    'from "../domain/launchTokenBoundary.js";'
  );
  writeFileSync(launchReadinessPath, launchReadinessSource, "utf-8");
  const scenarioRunnerPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneScenarioRunner.js");
  let scenarioRunnerSource = readFileSync(scenarioRunnerPath, "utf-8");
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "../domain/entitlementDecision";',
    'from "../domain/entitlementDecision.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "../domain/installUpdateStateMachine";',
    'from "../domain/installUpdateStateMachine.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./installUpdateAuthority";',
    'from "./installUpdateAuthority.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./controlPlaneViewModel";',
    'from "./controlPlaneViewModel.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./controlPlanePersistence";',
    'from "./controlPlanePersistence.js";'
  );
  writeFileSync(scenarioRunnerPath, scenarioRunnerSource, "utf-8");

  const entitlement = await import(pathToFileURL(join(domainRoot, "entitlementDecision.js")).href);
  const lifecycle = await import(pathToFileURL(join(domainRoot, "installUpdateStateMachine.js")).href);
  const tokenBoundary = await import(pathToFileURL(join(domainRoot, "launchTokenBoundary.js")).href);
  const persistence = await import(pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlanePersistence.js")).href);
  const installUpdateAuthority = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js")).href
  );
  const controlPlaneViewModel = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneViewModel.js")).href
  );
  const controlPlaneBootstrap = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneBootstrap.js")).href
  );
  const controlPlaneScenarioRunner = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneScenarioRunner.js")).href
  );
  const launchReadinessMatrix = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/launchReadinessMatrix.js")).href
  );
  const controlPlaneOperations = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneOperationsViewModel.js")).href
  );

  const entitlementFixtures = JSON.parse(readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/entitlement-decision-snapshots.json"), "utf-8"));
  for (const fixture of entitlementFixtures) {
    const actual = entitlement.decideEntitlement(fixture.input);
    assertEqual(actual, fixture.expected, `Entitlement snapshot mismatch: ${fixture.name}`);
    const repeat = entitlement.decideEntitlement(fixture.input);
    assertEqual(repeat, actual, `Entitlement determinism mismatch: ${fixture.name}`);
  }

  const lifecycleFixtures = JSON.parse(readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/install-update-state-machine-snapshots.json"), "utf-8"));
  for (const fixture of lifecycleFixtures) {
    const actual = lifecycle.transitionLifecycleState(fixture.from, fixture.event);
    assertEqual(actual, fixture.expected, `Lifecycle snapshot mismatch: ${fixture.name}`);
  }

  const launchTokenFixtures = JSON.parse(readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/launch-token-snapshots.json"), "utf-8"));
  for (const fixture of launchTokenFixtures) {
    const token = tokenBoundary.issueLaunchToken(fixture.claims, fixture.secret);
    const verified = tokenBoundary.verifyLaunchToken(token, fixture.secret, fixture.verifyAt);
    assert(
      verified.valid === fixture.expectedValid,
      `Launch token validity mismatch: ${fixture.name} actual=${JSON.stringify(verified)} token=${token}`
    );
    assert(verified.reason === fixture.expectedReason, `Launch token reason mismatch: ${fixture.name} actual=${JSON.stringify(verified)}`);

    if (fixture.expectedValid) {
      const second = tokenBoundary.issueLaunchToken(fixture.claims, fixture.secret);
      assert(second === token, `Launch token issuance must be deterministic: ${fixture.name}`);
    }
  }

  const tamperFixture = launchTokenFixtures[0];
  const token = tokenBoundary.issueLaunchToken(tamperFixture.claims, tamperFixture.secret);
  const tampered = `${token.slice(0, -1)}x`;
  const tamperedVerify = tokenBoundary.verifyLaunchToken(tampered, tamperFixture.secret, tamperFixture.verifyAt);
  assert(tamperedVerify.valid === false && tamperedVerify.reason === "signature_invalid", "Tampered token must fail signature verification.");

  const persistenceFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-persistence-snapshots.json"), "utf-8")
  );
  for (const fixture of persistenceFixtures) {
    const serialized = persistence.serializePersistedControlPlaneState(fixture.state);
    assertEqual(serialized, fixture.expectedSerialized, `Persistence serialization mismatch: ${fixture.name}`);
    const parsed = persistence.parsePersistedControlPlaneState(serialized);
    assert(parsed !== null, `Persistence parser should accept serialized state: ${fixture.name}`);
    assertEqual(parsed, JSON.parse(fixture.expectedSerialized), `Persistence parse result mismatch: ${fixture.name}`);
  }

  const tempDir = mkdtempSync(join(os.tmpdir(), "antiphon-control-plane-smoke-"));
  try {
    const restartFile = join(tempDir, "offline-cache.json");
    const restartState = persistenceFixtures[0].state;
    const serialized = persistence.serializePersistedControlPlaneState(restartState);
    writeFileSync(restartFile, serialized, "utf-8");
    const loaded = persistence.parsePersistedControlPlaneState(readFileSync(restartFile, "utf-8"));
    assert(loaded !== null, "Persistence should restore non-corrupt cache across restart.");
    assertEqual(loaded.offlineCache, restartState.offlineCache, "Offline cache restore mismatch across restart.");
    assertEqual(loaded.installState, JSON.parse(persistenceFixtures[0].expectedSerialized).installState, "Install state restore mismatch across restart.");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  const authorityFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/install-update-authority-snapshots.json"), "utf-8")
  );
  for (const fixture of authorityFixtures) {
    const result = await installUpdateAuthority.runInstallUpdateAuthority(
      fixture.input.snapshot,
      fixture.input.action,
      fixture.input.appId,
      async () => fixture.input.stepResult
    );
    assert(result.result.ok === fixture.expectedOk, `Install/update authority success mismatch: ${fixture.name}`);
    assert(result.result.reasonCode === fixture.expectedReasonCode, `Install/update authority reason mismatch: ${fixture.name}`);
    assert(result.result.lifecycle.to === fixture.expectedLifecycleTo, `Install/update authority lifecycle mismatch: ${fixture.name}`);
    if (result.result.ok) {
      const app = result.snapshot.entitlements.find((candidate) => candidate.id === fixture.input.appId);
      assert(app, `Install/update authority must preserve target app in snapshot: ${fixture.name}`);
    }
  }

  const controlPlaneVmFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-view-model-snapshots.json"), "utf-8")
  );
  for (const fixture of controlPlaneVmFixtures) {
    const actual = controlPlaneViewModel.toControlPlaneViewModel(fixture.hubState);
    assertEqual(actual, fixture.expected, `Control-plane view-model snapshot mismatch: ${fixture.name}`);
    const repeat = controlPlaneViewModel.toControlPlaneViewModel(fixture.hubState);
    assertEqual(repeat, actual, `Control-plane view-model determinism mismatch: ${fixture.name}`);
  }

  const bootstrapFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-bootstrap-snapshots.json"), "utf-8")
  );
  for (const fixture of bootstrapFixtures) {
    const actual = controlPlaneBootstrap.resolveBootstrapFailure(fixture.snapshot, fixture.errorMessage);
    assertEqual(actual.status, fixture.expected.status, `Control-plane bootstrap snapshot mismatch: ${fixture.name}`);
    const repeat = controlPlaneBootstrap.resolveBootstrapFailure(fixture.snapshot, fixture.errorMessage);
    assertEqual(repeat.status, actual.status, `Control-plane bootstrap determinism mismatch: ${fixture.name}`);
  }

  const happyFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-happy-path-snapshots.json"), "utf-8")
  );
  for (const fixture of happyFixtures) {
    const actual = await controlPlaneScenarioRunner.runHappyPathScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane happy path snapshot mismatch: ${fixture.name}`);
    const repeat = await controlPlaneScenarioRunner.runHappyPathScenario(fixture.seed);
    assertEqual(repeat, actual, `Control-plane happy path determinism mismatch: ${fixture.name}`);
  }

  const offlineMatrix = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-offline-matrix-snapshots.json"), "utf-8")
  );
  for (const fixture of offlineMatrix) {
    const projection = controlPlaneViewModel.toControlPlaneViewModel(fixture.hubState);
    assertEqual(projection.entitlement, fixture.expectedEntitlement, `Control-plane offline matrix mismatch: ${fixture.name}`);
  }

  const failureMatrix = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-failure-matrix-snapshots.json"), "utf-8")
  );
  for (const fixture of failureMatrix) {
    const actual = await controlPlaneScenarioRunner.runFailureScenario(fixture.seed, fixture.action, fixture.reasonCode);
    assertEqual(actual, fixture.expected, `Control-plane failure matrix mismatch: ${fixture.name}`);
  }

  const antiGatingFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-anti-gating-snapshots.json"), "utf-8")
  );
  for (const fixture of antiGatingFixtures) {
    const actual = controlPlaneScenarioRunner.runAntiGatingScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane anti-gating snapshot mismatch: ${fixture.name}`);
  }

  const launchReadinessFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-launch-readiness-snapshots.json"), "utf-8")
  );
  for (const fixture of launchReadinessFixtures) {
    const actual = launchReadinessMatrix.toLaunchReadinessMatrix(fixture.snapshot);
    assertEqual(actual, fixture.expected, `Control-plane launch readiness snapshot mismatch: ${fixture.name}`);
    const repeat = launchReadinessMatrix.toLaunchReadinessMatrix(fixture.snapshot);
    assertEqual(repeat, actual, `Control-plane launch readiness determinism mismatch: ${fixture.name}`);
  }

  const operationsFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-operations-snapshots.json"), "utf-8")
  );
  for (const fixture of operationsFixtures) {
    const actual = controlPlaneOperations.toControlPlaneOperations(fixture.snapshot, 5);
    assertEqual(actual, fixture.expected, `Control-plane operations snapshot mismatch: ${fixture.name}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

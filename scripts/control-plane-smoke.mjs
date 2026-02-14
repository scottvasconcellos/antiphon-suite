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
  let authoritySource = readFileSync(authorityPath, "utf-8");
  authoritySource = authoritySource.replace(
    'from "../domain/installUpdateStateMachine";',
    'from "../domain/installUpdateStateMachine.js";'
  );
  authoritySource = authoritySource.replace(
    'from "./downloadInstallerBoundary";',
    'from "./downloadInstallerBoundary.js";'
  );
  authoritySource = authoritySource.replace(
    'from "./artifactInstallerExecution";',
    'from "./artifactInstallerExecution.js";'
  );
  writeFileSync(authorityPath, authoritySource, "utf-8");
  const artifactExecPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactInstallerExecution.js");
  let artifactExecSource = readFileSync(artifactExecPath, "utf-8");
  artifactExecSource = artifactExecSource.replace(
    'from "./artifactManifestContract";',
    'from "./artifactManifestContract.js";'
  );
  writeFileSync(artifactExecPath, artifactExecSource, "utf-8");
  const artifactTrustPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js");
  let artifactTrustSource = readFileSync(artifactTrustPath, "utf-8");
  artifactTrustSource = artifactTrustSource.replace(
    'from "./artifactManifestContract";',
    'from "./artifactManifestContract.js";'
  );
  writeFileSync(artifactTrustPath, artifactTrustSource, "utf-8");
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
  controlPlaneVmSource = controlPlaneVmSource.replace(
    'from "./controlPlaneTrustEnvelope";',
    'from "./controlPlaneTrustEnvelope.js";'
  );
  writeFileSync(controlPlaneVmPath, controlPlaneVmSource, "utf-8");
  const launchReadinessPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/launchReadinessMatrix.js");
  let launchReadinessSource = readFileSync(launchReadinessPath, "utf-8");
  launchReadinessSource = launchReadinessSource.replace(
    'from "../domain/launchTokenBoundary";',
    'from "../domain/launchTokenBoundary.js";'
  );
  writeFileSync(launchReadinessPath, launchReadinessSource, "utf-8");
  const publicControlPlanePath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/publicControlPlane.js");
  let publicControlPlaneSource = readFileSync(publicControlPlanePath, "utf-8");
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlaneAuthority";', 'from "./controlPlaneAuthority.js";');
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlaneContracts";', 'from "./controlPlaneContracts.js";');
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlanePersistence";', 'from "./controlPlanePersistence.js";');
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlaneViewModel";', 'from "./controlPlaneViewModel.js";');
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlaneTrustEnvelope";', 'from "./controlPlaneTrustEnvelope.js";');
  publicControlPlaneSource = publicControlPlaneSource.replaceAll('from "./controlPlaneScenarioRunner";', 'from "./controlPlaneScenarioRunner.js";');
  writeFileSync(publicControlPlanePath, publicControlPlaneSource, "utf-8");
  const authorityIndexPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneAuthority.js");
  let authorityIndexSource = readFileSync(authorityIndexPath, "utf-8");
  authorityIndexSource = authorityIndexSource.replaceAll('from "../domain/entitlementDecision";', 'from "../domain/entitlementDecision.js";');
  authorityIndexSource = authorityIndexSource.replaceAll('from "./installUpdateAuthority";', 'from "./installUpdateAuthority.js";');
  authorityIndexSource = authorityIndexSource.replaceAll('from "../domain/launchTokenBoundary";', 'from "../domain/launchTokenBoundary.js";');
  authorityIndexSource = authorityIndexSource.replaceAll('from "./controlPlaneBootstrap";', 'from "./controlPlaneBootstrap.js";');
  authorityIndexSource = authorityIndexSource.replaceAll('from "./controlPlanePersistence";', 'from "./controlPlanePersistence.js";');
  writeFileSync(authorityIndexPath, authorityIndexSource, "utf-8");
  const persistencePath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlanePersistence.js");
  let persistenceSource = readFileSync(persistencePath, "utf-8");
  persistenceSource = persistenceSource.replace(
    'from "./appCatalog";',
    'from "./appCatalog.js";'
  );
  writeFileSync(persistencePath, persistenceSource, "utf-8");
  const multiAppPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/multiAppEntitlement.js");
  let multiAppSource = readFileSync(multiAppPath, "utf-8");
  multiAppSource = multiAppSource.replace(
    'from "../domain/entitlementDecision";',
    'from "../domain/entitlementDecision.js";'
  );
  multiAppSource = multiAppSource.replace(
    'from "./controlPlaneReasonTaxonomy";',
    'from "./controlPlaneReasonTaxonomy.js";'
  );
  multiAppSource = multiAppSource.replace(
    'from "./appCatalog";',
    'from "./appCatalog.js";'
  );
  writeFileSync(multiAppPath, multiAppSource, "utf-8");
  const updateChannelPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateChannelPolicy.js");
  let updateChannelSource = readFileSync(updateChannelPath, "utf-8");
  updateChannelSource = updateChannelSource.replace(
    'from "./controlPlaneReasonTaxonomy";',
    'from "./controlPlaneReasonTaxonomy.js";'
  );
  updateChannelSource = updateChannelSource.replace(
    'from "./appCatalog";',
    'from "./appCatalog.js";'
  );
  writeFileSync(updateChannelPath, updateChannelSource, "utf-8");
  const updateRecoveryPath = join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateRecoveryPolicy.js");
  let updateRecoverySource = readFileSync(updateRecoveryPath, "utf-8");
  updateRecoverySource = updateRecoverySource.replace(
    'from "./controlPlaneReasonTaxonomy";',
    'from "./controlPlaneReasonTaxonomy.js";'
  );
  writeFileSync(updateRecoveryPath, updateRecoverySource, "utf-8");
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
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./controlPlaneReasonTaxonomy";',
    'from "./controlPlaneReasonTaxonomy.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./controlPlaneTrustArtifact";',
    'from "./controlPlaneTrustArtifact.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./clockDriftPolicy";',
    'from "./clockDriftPolicy.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./artifactTrustVerification";',
    'from "./artifactTrustVerification.js";'
  );
  scenarioRunnerSource = scenarioRunnerSource.replace(
    'from "./updateRecoveryPolicy";',
    'from "./updateRecoveryPolicy.js";'
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
  const controlPlaneContracts = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneContracts.js")).href
  );
  const controlPlaneReasonTaxonomy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneReasonTaxonomy.js")).href
  );
  const installUpdateAuthorityModule = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/installUpdateAuthority.js")).href
  );
  const launchTokenBoundaryModule = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/domain/launchTokenBoundary.js")).href
  );
  const controlPlaneTrustEnvelope = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustEnvelope.js")).href
  );
  const controlPlaneUiContract = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneUiContract.js")).href
  );
  const controlPlaneTrustArtifact = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/controlPlaneTrustArtifact.js")).href
  );
  const appCatalog = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/appCatalog.js")).href
  );
  const multiAppEntitlement = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/multiAppEntitlement.js")).href
  );
  const updateChannelPolicy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateChannelPolicy.js")).href
  );
  const updateRecoveryPolicy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/updateRecoveryPolicy.js")).href
  );
  const clockDriftPolicy = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/clockDriftPolicy.js")).href
  );
  const downloadInstallerBoundary = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/downloadInstallerBoundary.js")).href
  );
  const publicControlPlane = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/publicControlPlane.js")).href
  );
  const artifactManifestContract = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactManifestContract.js")).href
  );
  const artifactInstallerExecution = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactInstallerExecution.js")).href
  );
  const artifactTrustVerification = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/artifactTrustVerification.js")).href
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

  const appCatalogFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-app-catalog-snapshots.json"), "utf-8")
  );
  for (const fixture of appCatalogFixtures) {
    const normalized = appCatalog.normalizeAppCatalog(fixture.catalog);
    assertEqual(normalized, fixture.expected, `App catalog normalization mismatch: ${fixture.name}`);
  }

  const artifactManifestFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-artifact-manifest-snapshots.json"), "utf-8")
  );
  for (const fixture of artifactManifestFixtures) {
    const normalized = artifactManifestContract.normalizeArtifactManifest(fixture.input);
    assertEqual(normalized, fixture.expectedNormalized, `Artifact manifest normalization mismatch: ${fixture.name}`);
    const serialized = artifactManifestContract.serializeArtifactManifest(fixture.input);
    assertEqual(serialized, fixture.expectedSerialized, `Artifact manifest serialization mismatch: ${fixture.name}`);
    const parsed = artifactManifestContract.parseArtifactManifest(serialized);
    assertEqual(parsed, fixture.expectedParse, `Artifact manifest parse mismatch: ${fixture.name}`);
  }

  const artifactTrustFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-artifact-trust-matrix-snapshots.json"), "utf-8")
  );
  for (const fixture of artifactTrustFixtures) {
    const actual = artifactTrustVerification.verifyArtifactTrust(fixture.input);
    assertEqual(actual, fixture.expected, `Artifact trust verification mismatch: ${fixture.name}`);
  }

  const layerArtifactInputFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-layer-artifact-input-snapshots.json"), "utf-8")
  );
  for (const fixture of layerArtifactInputFixtures) {
    const installManifestRaw = readFileSync(join(process.cwd(), fixture.install.manifestPath), "utf-8");
    const updateManifestRaw = readFileSync(join(process.cwd(), fixture.update.manifestPath), "utf-8");
    const installManifest = artifactManifestContract.parseArtifactManifest(installManifestRaw);
    const updateManifest = artifactManifestContract.parseArtifactManifest(updateManifestRaw);
    assert(installManifest.manifest !== null && updateManifest.manifest !== null, `Layer artifact manifests must parse: ${fixture.name}`);
    const actual = {
      appId: installManifest.manifest.appId,
      installVersion: installManifest.manifest.appVersion,
      updateVersion: updateManifest.manifest.appVersion,
      channel: installManifest.manifest.channel,
      installDigest: installManifest.manifest.files[0]?.sha256 ?? "",
      updateDigest: updateManifest.manifest.files[0]?.sha256 ?? ""
    };
    assertEqual(actual, fixture.expected, `Layer artifact input fixture mismatch: ${fixture.name}`);
  }

  const artifactInstallerFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-artifact-installer-snapshots.json"), "utf-8")
  );
  for (const fixture of artifactInstallerFixtures) {
    const actual = artifactInstallerExecution.applyArtifactManifest(fixture.input);
    if (fixture.expected.ok) {
      assertEqual(actual, fixture.expected, `Artifact installer snapshot mismatch: ${fixture.name}`);
    } else {
      assertEqual(
        { ok: actual.ok, reasonCode: actual.reasonCode, remediation: actual.remediation },
        fixture.expected,
        `Artifact installer failure mismatch: ${fixture.name}`
      );
    }
  }

  const artifactTransactionFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-artifact-transaction-snapshots.json"), "utf-8")
  );
  for (const fixture of artifactTransactionFixtures) {
    const actual = artifactInstallerExecution.executeAtomicArtifactTransaction(fixture.input);
    assertEqual(
      { applied: { ok: actual.applied.ok, reasonCode: actual.applied.reasonCode }, atomicity: actual.atomicity },
      fixture.expected,
      `Artifact atomic transaction mismatch: ${fixture.name}`
    );
  }

  const layerManifestFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-layer-app-manifest-snapshots.json"), "utf-8")
  );
  for (const fixture of layerManifestFixtures) {
    const normalized = appCatalog.normalizeLayerAppManifests(fixture.manifests);
    assertEqual(normalized, fixture.expectedNormalizedManifests, `Layer app manifest normalization mismatch: ${fixture.name}`);
    const catalog = appCatalog.layerManifestsToCatalogEntries(fixture.manifests, fixture.installedVersions);
    assertEqual(catalog, fixture.expectedCatalog, `Layer app manifest catalog bridge mismatch: ${fixture.name}`);
    const decisions = multiAppEntitlement.decideMultiAppEntitlementsFromManifests(
      fixture.manifests,
      fixture.grantedEntitlements,
      fixture.decisionInput
    );
    assertEqual(decisions, fixture.expectedEntitlements, `Layer app manifest entitlement bridge mismatch: ${fixture.name}`);
    const updateManifest = fixture.manifests.find((manifest) => manifest.id === fixture.expectedUpdateSelection.appId);
    assert(updateManifest, `Layer app manifest update target missing: ${fixture.name}`);
    const updateDecision = updateChannelPolicy.selectUpdateByManifestPolicy(updateManifest, fixture.updateCandidates);
    assertEqual(updateDecision, fixture.expectedUpdateSelection, `Layer app manifest update policy mismatch: ${fixture.name}`);
  }

  const multiAppFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-multi-app-entitlement-snapshots.json"), "utf-8")
  );
  for (const fixture of multiAppFixtures) {
    const actual = multiAppEntitlement.decideMultiAppEntitlements(fixture.input);
    assertEqual(actual, fixture.expected, `Multi-app entitlement snapshot mismatch: ${fixture.name}`);
  }

  const updateChannelFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-update-channel-snapshots.json"), "utf-8")
  );
  for (const fixture of updateChannelFixtures) {
    const actual = updateChannelPolicy.selectUpdateByChannelPolicy(fixture.input);
    assertEqual(actual, fixture.expected, `Update channel policy snapshot mismatch: ${fixture.name}`);
  }

  const updateRollbackFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-update-rollback-snapshots.json"), "utf-8")
  );
  for (const fixture of updateRollbackFixtures) {
    const actual = updateRecoveryPolicy.applyUpdateRollback(fixture.app, fixture.options);
    assertEqual(actual, fixture.expected, `Update rollback snapshot mismatch: ${fixture.name}`);
  }

  const downloadInstallerFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-download-installer-snapshots.json"), "utf-8")
  );
  for (const fixture of downloadInstallerFixtures) {
    const boundary = downloadInstallerBoundary.createDeterministicStubBoundary(fixture.outputs);
    const first = await installUpdateAuthority.runInstallUpdateAuthorityWithBoundary(
      fixture.snapshot,
      "install",
      fixture.snapshot.entitlements[0].id,
      boundary
    );
    const second = await installUpdateAuthority.runInstallUpdateAuthorityWithBoundary(
      fixture.snapshot,
      "install",
      fixture.snapshot.entitlements[0].id,
      boundary
    );
    assertEqual(first.result.reasonCode, fixture.expectedReasonCode, `Download/installer reason mismatch: ${fixture.name}`);
    assertEqual(first, second, `Download/installer determinism mismatch: ${fixture.name}`);
  }

  const persistenceTortureFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-persistence-torture-snapshots.json"), "utf-8")
  );
  for (const fixture of persistenceTortureFixtures) {
    const report = persistence.parsePersistedControlPlaneStateWithReport(
      fixture.raw,
      fixture.nowIso ? { nowIso: fixture.nowIso, maxSkewSeconds: fixture.maxSkewSeconds } : undefined
    );
    assertEqual(report.reasonCode, fixture.expected.reasonCode, `Persistence torture reason mismatch: ${fixture.name}`);
    assertEqual(report.remediation, fixture.expected.remediation, `Persistence torture remediation mismatch: ${fixture.name}`);
    if ("state" in fixture.expected) {
      assertEqual(report.state, fixture.expected.state, `Persistence torture state mismatch: ${fixture.name}`);
    } else {
      assert(report.state !== null, `Persistence torture should produce valid state: ${fixture.name}`);
    }
  }

  const atomicPersistenceFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-atomic-persistence-snapshots.json"), "utf-8")
  );
  for (const fixture of atomicPersistenceFixtures) {
    const actual = persistence.simulateAtomicPersist(fixture.input.state, fixture.input.mode);
    assertEqual(actual, fixture.expected, `Atomic persistence snapshot mismatch: ${fixture.name}`);
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

  const hubOptionalFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-hub-optional-snapshots.json"), "utf-8")
  );
  for (const fixture of hubOptionalFixtures) {
    const actual = controlPlaneScenarioRunner.runHubOptionalScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane hub-optional snapshot mismatch: ${fixture.name}`);
  }

  const coldBootFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-cold-boot-snapshots.json"), "utf-8")
  );
  for (const fixture of coldBootFixtures) {
    const actual = controlPlaneScenarioRunner.runColdBootScenario(fixture.seed);
    assertEqual(actual.deterministic, fixture.expected.deterministic, `Control-plane cold-boot determinism mismatch: ${fixture.name}`);
    assertEqual(actual.firstBoot, actual.secondBoot, `Control-plane cold-boot projections diverged: ${fixture.name}`);
  }

  const longRunFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-long-run-determinism-snapshots.json"), "utf-8")
  );
  for (const fixture of longRunFixtures) {
    const actual = await controlPlaneScenarioRunner.runLongRunDeterminismScenario(fixture.seed, fixture.cycles);
    assertEqual(actual, fixture.expected, `Control-plane long-run determinism mismatch: ${fixture.name}`);
  }

  const concurrencyFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-concurrency-snapshots.json"), "utf-8")
  );
  for (const fixture of concurrencyFixtures) {
    const actual = await controlPlaneScenarioRunner.runConcurrencyScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane concurrency snapshot mismatch: ${fixture.name}`);
  }

  const trustArtifactFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-artifact-snapshots.json"), "utf-8")
  );
  for (const fixture of trustArtifactFixtures) {
    const actual = controlPlaneScenarioRunner.runTrustArtifactScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane trust artifact snapshot mismatch: ${fixture.name}`);
  }

  const artifactFlowFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-artifact-flow-snapshots.json"), "utf-8")
  );
  for (const fixture of artifactFlowFixtures) {
    const actual = await controlPlaneScenarioRunner.runArtifactInstallUpdateScenario(fixture.input);
    assertEqual(actual, fixture.expected, `Control-plane artifact flow mismatch: ${fixture.name}`);
  }

  const realLayerPipelineFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-real-layer-app-pipeline-snapshots.json"), "utf-8")
  );
  for (const fixture of realLayerPipelineFixtures) {
    const actual = await controlPlaneScenarioRunner.runRealLayerAppPipelineScenario(fixture.input);
    assertEqual(actual, fixture.expected, `Control-plane real layer app pipeline mismatch: ${fixture.name}`);
  }

  const clockDriftFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-clock-drift-snapshots.json"), "utf-8")
  );
  for (const fixture of clockDriftFixtures) {
    const actual = controlPlaneScenarioRunner.runClockDriftScenario(fixture.input);
    assertEqual(actual, fixture.expected, `Control-plane clock drift snapshot mismatch: ${fixture.name}`);
  }

  const antiGateValidationFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-envelope-validation-snapshots.json"), "utf-8")
  );
  for (const fixture of antiGateValidationFixtures) {
    const actual = controlPlaneScenarioRunner.runTrustEnvelopeValidationScenario(fixture.seed);
    assertEqual(actual, fixture.expected, `Control-plane anti-gating trust envelope mismatch: ${fixture.name}`);
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

  const contractFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-contract-compat-snapshots.json"), "utf-8")
  );
  for (const fixture of contractFixtures) {
    const actual = controlPlaneContracts.evaluateContractCompatibility(
      fixture.contract,
      fixture.requestedVersion
    );
    assertEqual(actual, fixture.expected, `Control-plane contract compatibility mismatch: ${fixture.name}`);
  }

  const legacyContractFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-contract-legacy-compat-snapshots.json"), "utf-8")
  );
  for (const fixture of legacyContractFixtures) {
    const actual = controlPlaneContracts.evaluateContractCompatibility(fixture.contract, fixture.requestedVersion);
    assertEqual(actual, fixture.expected, `Control-plane legacy contract compatibility mismatch: ${fixture.name}`);
  }

  const uiContractFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-ui-contract-snapshots.json"), "utf-8")
  );
  for (const fixture of uiContractFixtures) {
    const actual = controlPlaneUiContract.toControlPlaneUiContract(
      fixture.hubVm,
      fixture.controlPlaneVm,
      fixture.opsVm
    );
    assertEqual(actual, fixture.expected, `Control-plane UI contract mismatch: ${fixture.name}`);
    assertEqual(Object.keys(actual).sort(), fixture.expectedKeysSorted, `Control-plane UI key surface mismatch: ${fixture.name}`);
  }

  const appSource = readFileSync(join(process.cwd(), "apps/layer0-hub/src/App.tsx"), "utf-8");
  assert(!appSource.includes("SectionCard"), "App should remain minimal and not render rich control surfaces.");
  assert(!appSource.includes("runAction("), "App should not contain policy/action orchestration logic.");

  const trustEnvelopeFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-envelope-snapshots.json"), "utf-8")
  );
  for (const fixture of trustEnvelopeFixtures) {
    const actual = controlPlaneTrustEnvelope.toTrustEnvelopeView();
    assertEqual(actual, fixture.expected, `Control-plane trust envelope snapshot mismatch: ${fixture.name}`);
  }

  const publicSurfaceFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-public-surface-snapshots.json"), "utf-8")
  );
  for (const fixture of publicSurfaceFixtures) {
    const actual = Object.keys(publicControlPlane).sort();
    assertEqual(actual, fixture.expected, `Control-plane public surface mismatch: ${fixture.name}`);
  }

  const consumerHarness = await import(
    pathToFileURL(join(process.cwd(), "scripts/control-plane-consumer-harness.mjs")).href
  );
  await consumerHarness.runControlPlaneConsumerHarness();
  const demoLayer = await import(
    pathToFileURL(join(process.cwd(), "scripts/demo-layer.mjs")).href
  );
  const demoSnapshot = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-demo-output-snapshots.json"), "utf-8")
  )[0];
  const demoActual = await demoLayer.buildDemoOutput();
  assertEqual(demoActual, demoSnapshot.expected, `Control-plane demo output snapshot mismatch: ${demoSnapshot.name}`);
  const layerAppHarness = await import(
    pathToFileURL(join(process.cwd(), "scripts/layer-app-example-harness.mjs")).href
  );
  await layerAppHarness.runLayerAppExampleHarness();

  const reasonCoverageFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-reason-coverage-snapshots.json"), "utf-8")
  );
  for (const fixture of reasonCoverageFixtures) {
    const actual = [...new Set([
      ...controlPlaneContracts.CONTRACT_COMPAT_REASON_CODES,
      ...persistence.PERSISTENCE_REASON_CODES,
      ...installUpdateAuthorityModule.INSTALL_UPDATE_REASON_CODES,
      ...launchTokenBoundaryModule.LAUNCH_TOKEN_REASON_CODES,
      ...controlPlaneTrustArtifact.TRUST_ARTIFACT_REASON_CODES,
      ...updateChannelPolicy.UPDATE_CHANNEL_REASON_CODES,
      ...updateRecoveryPolicy.UPDATE_ROLLBACK_REASON_CODES,
      ...clockDriftPolicy.CLOCK_DRIFT_POLICY_REASON_CODES
      ,
      ...artifactManifestContract.ARTIFACT_MANIFEST_REASON_CODES,
      ...artifactInstallerExecution.ARTIFACT_INSTALLER_REASON_CODES,
      ...artifactTrustVerification.ARTIFACT_TRUST_REASON_CODES
    ])].sort();
    assertEqual(actual, fixture.expectedReasonCodes, `Control-plane reason coverage mismatch: ${fixture.name}`);
    for (const code of actual) {
      const remediation = controlPlaneReasonTaxonomy.remediationForReason(code);
      assert(typeof remediation === "string" && remediation.length > 0, `Missing remediation mapping for reason code: ${code}`);
    }
  }

  const trustArtifactCompatFixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-trust-artifact-compat-snapshots.json"), "utf-8")
  );
  for (const fixture of trustArtifactCompatFixtures) {
    const actual = controlPlaneTrustArtifact.parseTrustArtifactWithReport(
      fixture.raw,
      fixture.nowIso ? { nowIso: fixture.nowIso, maxSkewSeconds: fixture.maxSkewSeconds } : undefined
    );
    assertEqual(actual, fixture.expected, `Control-plane trust artifact compat mismatch: ${fixture.name}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

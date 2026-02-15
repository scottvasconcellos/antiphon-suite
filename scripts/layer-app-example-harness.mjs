import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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

function assertEqual(actual, expected, message) {
  if (JSON.stringify(stable(actual)) !== JSON.stringify(stable(expected))) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

export async function runLayerAppExampleHarness() {
  const publicControlPlane = await import(
    pathToFileURL(join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/publicControlPlane.js")).href
  );

  const fixtures = JSON.parse(
    readFileSync(join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-layer-app-harness-snapshots.json"), "utf-8")
  );

  for (const fixture of fixtures) {
    const entitlement = publicControlPlane.ControlPlaneAuthority.decideEntitlement(fixture.input.entitlementInput);
    const contract = publicControlPlane.ControlPlaneContracts.evaluateContractCompatibility(
      fixture.input.contractName,
      fixture.input.requestedVersion
    );

    const persistedRaw = publicControlPlane.ControlPlaneAuthority.serializePersistedControlPlaneState(
      publicControlPlane.ControlPlaneAuthority.toPersistedControlPlaneState(
        fixture.input.persistenceSeed,
        fixture.input.persistenceDecision
      )
    );

    const persistedReport = publicControlPlane.ControlPlaneAuthority.parsePersistedControlPlaneState(persistedRaw)
      ? { reasonCode: "ok_cache_loaded", remediation: "none" }
      : { reasonCode: "invalid_json", remediation: "rebuild_cache" };

    const trust = publicControlPlane.ControlPlaneScenarioRunner.runTrustArtifactScenario(fixture.input.trustSeed);

    const actual = {
      entitlement: {
        outcome: entitlement.outcome,
        reasonCode: entitlement.reason,
        remediation: entitlement.reason === "owned_active_identity" ? "none" : "refresh_online_session"
      },
      contract,
      persistence: persistedReport,
      trustArtifact: {
        artifactRestoredAfterRestart: trust.artifactRestoredAfterRestart,
        runnableWithoutHub: trust.runnableWithoutHub,
        deterministic: trust.deterministic
      }
    };

    assertEqual(actual, fixture.expected, `Layer app harness mismatch: ${fixture.name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLayerAppExampleHarness().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

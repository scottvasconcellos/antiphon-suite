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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runControlPlaneConsumerHarness() {
  const publicControlPlane = await import(
    pathToFileURL(
      join(process.cwd(), "apps/layer0-hub/.tmp-control-plane-smoke/services/publicControlPlane.js")
    ).href
  );

  const fixtures = JSON.parse(
    readFileSync(
      join(process.cwd(), "apps/layer0-hub/fixtures/control-plane-consumer-harness-snapshots.json"),
      "utf-8"
    )
  );

  for (const fixture of fixtures) {
    const entitlement = publicControlPlane.ControlPlaneAuthority.decideEntitlement(fixture.input.entitlementInput);
    const installResult = await publicControlPlane.ControlPlaneAuthority.runInstallUpdateAuthority(
      fixture.input.installSeed,
      fixture.input.installAction,
      fixture.input.installAppId,
      async () => fixture.input.installStepResult
    );
    const token = publicControlPlane.ControlPlaneAuthority.issueLaunchToken(
      fixture.input.launchClaims,
      fixture.input.launchSecret
    );
    const tokenVerify = publicControlPlane.ControlPlaneAuthority.verifyLaunchToken(
      token,
      fixture.input.launchSecret,
      fixture.input.launchVerifyAt
    );
    const trustArtifact = publicControlPlane.ControlPlaneScenarioRunner.runTrustArtifactScenario(
      fixture.input.trustSeed
    );

    const actual = {
      entitlement,
      installReason: installResult.result.reasonCode,
      launchValid: tokenVerify.valid,
      trustArtifact
    };
    assertEqual(actual, fixture.expected, `Consumer harness snapshot mismatch: ${fixture.name}`);
  }

  const harnessSource = readFileSync(
    join(process.cwd(), "scripts/control-plane-consumer-harness.mjs"),
    "utf-8"
  );
  const forbiddenStaticImport = /import\s+[^;]*from\s+["'][^"']*domain\//.test(harnessSource);
  const forbiddenDynamicImport = /import\(\s*["'][^"']*domain\//.test(harnessSource);
  assert(
    !forbiddenStaticImport && !forbiddenDynamicImport,
    "Consumer harness must not import internal domain modules directly."
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runControlPlaneConsumerHarness().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

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

  const entitlement = await import(pathToFileURL(join(domainRoot, "entitlementDecision.js")).href);
  const lifecycle = await import(pathToFileURL(join(domainRoot, "installUpdateStateMachine.js")).href);
  const tokenBoundary = await import(pathToFileURL(join(domainRoot, "launchTokenBoundary.js")).href);

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
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

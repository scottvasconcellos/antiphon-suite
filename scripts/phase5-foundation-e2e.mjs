import { spawnSync } from "node:child_process";

function runStep(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`Step failed: ${command} ${args.join(" ")}`);
  }
}

async function run() {
  // 1) Run the foundation artifact fetch/install test for layer0-hub.
  // This exercises:
  // - fetchArtifactFromFilesystem (appId/version → manifest + payloadFiles)
  // - installArtifactToDisk (real disk install under a temp ANTIPHON_APPS_DIR)
  // - digest + size verification for demo artifacts
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "test:foundation:artifacts"]);

  // 2) (Optional) A future extension can add launch-token verification here by
  // importing the compiled launchTokenBoundary and issuing/verifying a token
  // against a fixed snapshot. For now, launch tokens are already exercised by
  // scripts/control-plane-smoke.mjs; this script focuses on the new real-disk
  // installation path introduced in Phase 5.
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});


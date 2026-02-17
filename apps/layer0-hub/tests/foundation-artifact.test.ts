import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

import { fetchArtifactFromFilesystem } from "../src/services/artifactFetcher";
import { installArtifactToDisk } from "../src/services/diskArtifactInstaller";

async function run() {
  const tempRoot = mkdtempSync(join(os.tmpdir(), "antiphon-foundation-artifact-"));
  try {
    process.env.ANTIPHON_APPS_DIR = tempRoot;

    // Happy path: hello-world latest version
    {
      const result = fetchArtifactFromFilesystem("antiphon.layer.hello-world", "1.1.0");
      assert(result.ok, "Expected fetchArtifactFromFilesystem to succeed for hello-world 1.1.0");

      const install = installArtifactToDisk("antiphon.layer.hello-world", "1.1.0", result.manifestRaw, result.payloadFiles);
      assert(install.ok, `Expected installArtifactToDisk to succeed, got ${JSON.stringify(install)}`);

      const appTxt = join(install.installedPath, "app.txt");
      assert(existsSync(appTxt), "Expected app.txt to exist after install for hello-world");
      const content = readFileSync(appTxt, "utf-8");
      assert(content.includes("hello layer app"), "Installed hello-world payload should look like the artifact content");
    }

    // Happy path: rhythm latest version
    {
      const result = fetchArtifactFromFilesystem("antiphon.layer.rhythm", "1.1.0-beta.1");
      assert(result.ok, "Expected fetchArtifactFromFilesystem to succeed for rhythm 1.1.0-beta.1");

      const install = installArtifactToDisk("antiphon.layer.rhythm", "1.1.0-beta.1", result.manifestRaw, result.payloadFiles);
      assert(install.ok, `Expected installArtifactToDisk to succeed, got ${JSON.stringify(install)}`);

      const appTxt = join(install.installedPath, "app.txt");
      assert(existsSync(appTxt), "Expected app.txt to exist after install for rhythm");
      const content = readFileSync(appTxt, "utf-8");
      assert(content.includes("rhythm app"), "Installed rhythm payload should look like the artifact content");
    }

    // Happy path: chord-scale-helper v1
    {
      const result = fetchArtifactFromFilesystem("antiphon.layer.chord-scale-helper", "1.0.0");
      assert(result.ok, "Expected fetchArtifactFromFilesystem to succeed for chord-scale-helper 1.0.0");

      const install = installArtifactToDisk("antiphon.layer.chord-scale-helper", "1.0.0", result.manifestRaw, result.payloadFiles);
      assert(install.ok, `Expected installArtifactToDisk to succeed, got ${JSON.stringify(install)}`);

      const appTxt = join(install.installedPath, "app.txt");
      assert(existsSync(appTxt), "Expected app.txt to exist after install for chord-scale-helper");
      const content = readFileSync(appTxt, "utf-8");
      assert(content.includes("chord scale helper"), "Installed chord-scale-helper payload should look like the artifact content");
    }

    // Failure: digest mismatch on first file
    {
      const result = fetchArtifactFromFilesystem("antiphon.layer.hello-world", "1.1.0");
      assert(result.ok, "Expected fetchArtifactFromFilesystem to succeed for failure case setup");

      // Corrupt the payload content while keeping manifest the same
      const corruptedPayloads = { ...result.payloadFiles, ["app.txt"]: result.payloadFiles["app.txt"] + "corrupt" };
      const install = installArtifactToDisk("antiphon.layer.hello-world", "1.1.0", result.manifestRaw, corruptedPayloads);
      assert(!install.ok, "Expected installArtifactToDisk to fail for corrupted payload");
      assert.strictEqual(
        install.reasonCode,
        "artifact_digest_mismatch",
        `Expected artifact_digest_mismatch, got ${install.reasonCode}`
      );
    }
  } finally {
    try {
      rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
    delete process.env.ANTIPHON_APPS_DIR;
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});


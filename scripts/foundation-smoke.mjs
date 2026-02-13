import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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

async function waitForHealth(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        if (payload.status === "ok") {
          return;
        }
      }
    } catch {
      // retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Health check timed out for ${url}`);
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { response, payload };
}

function verifyHubBuildOutput() {
  const hubDist = join(process.cwd(), "apps/layer0-hub/dist");
  const indexPath = join(hubDist, "index.html");
  assert(existsSync(indexPath), "Hub dist/index.html missing after build.");
  const indexHtml = readFileSync(indexPath, "utf-8");
  assert(indexHtml.includes('<div id="root"></div>'), "Hub index.html missing #root mount.");
  const assetsDir = join(hubDist, "assets");
  assert(existsSync(assetsDir), "Hub dist/assets missing after build.");
  const assets = readdirSync(assetsDir);
  assert(assets.length > 0, "Hub dist/assets is empty after build.");
}

async function runAuthorityContracts(baseUrl) {
  const health = await fetchJson(`${baseUrl}/health`);
  assert(health.response.ok, "Authority /health failed.");
  assert(health.payload?.status === "ok", "Authority /health payload contract mismatch.");

  const unauthEntitlements = await fetchJson(`${baseUrl}/entitlements`);
  assert(unauthEntitlements.response.status === 401, "Authority /entitlements must require auth.");

  const invalidAuth = await fetchJson(`${baseUrl}/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "invalid" })
  });
  assert(invalidAuth.response.status === 400, "Authority /auth/session must validate email.");

  const auth = await fetchJson(`${baseUrl}/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "foundation.smoke@antiphon.dev" })
  });
  assert(auth.response.ok, "Authority /auth/session login failed.");
  assert(typeof auth.payload?.userId === "string", "Authority session missing userId.");

  const entitlements = await fetchJson(`${baseUrl}/entitlements`);
  assert(entitlements.response.ok, "Authority /entitlements failed after auth.");
  assert(Array.isArray(entitlements.payload), "Authority /entitlements contract mismatch.");
}

async function run() {
  const authorityStatePath = join(process.cwd(), "apps/layer0-authority/data/state.json");
  const initialState = readFileSync(authorityStatePath, "utf-8");

  runStep("pnpm", ["build"]);
  runStep("pnpm", ["typecheck"]);
  verifyHubBuildOutput();

  const port = 8799;
  const child = spawn("node", ["dist/server.js"], {
    stdio: "inherit",
    cwd: join(process.cwd(), "apps/layer0-authority"),
    env: {
      ...process.env,
      PORT: String(port)
    }
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(`${baseUrl}/health`);
    await runAuthorityContracts(baseUrl);
  } finally {
    child.kill("SIGTERM");
    writeFileSync(authorityStatePath, initialState, "utf-8");
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

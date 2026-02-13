import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
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

function expectThrows(action, message) {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

async function run() {
  runStep("pnpm", ["--filter", "@antiphon/layer0-hub", "exec", "tsc", "-p", "tsconfig.structure-smoke.json"]);

  const basePath = join(process.cwd(), "apps/layer0-hub/.tmp-structure-smoke/services");
  const gatewayPath = join(basePath, "httpHubGateway.js");
  const gatewaySource = readFileSync(gatewayPath, "utf-8").replace(
    'from "./authorityContracts";',
    'from "./authorityContracts.js";'
  );
  writeFileSync(gatewayPath, gatewaySource, "utf-8");
  const contracts = await import(pathToFileURL(join(basePath, "authorityContracts.js")).href);
  const runtime = await import(pathToFileURL(join(basePath, "hubRuntime.js")).href);
  const gatewayModule = await import(pathToFileURL(gatewayPath).href);

  const session = contracts.parseSession({
    userId: "usr_123",
    email: "producer@antiphon.audio",
    displayName: "Producer",
    signedInAt: "2026-02-13T00:00:00.000Z"
  });
  assert(session.userId === "usr_123", "parseSession should parse valid payload.");
  expectThrows(
    () => contracts.parseSession({ userId: "usr_123" }),
    "parseSession should reject incomplete payload."
  );

  const entitlements = contracts.parseEntitlements([
    {
      id: "app.test",
      name: "App Test",
      version: "1.0.0",
      installedVersion: null,
      owned: true,
      installState: "not-installed",
      updateAvailable: false
    }
  ]);
  assert(entitlements.length === 1 && entitlements[0].id === "app.test", "parseEntitlements should parse list payload.");

  const readyState = {
    snapshot: {
      session: null,
      entitlements: [],
      offlineCache: { lastValidatedAt: null, maxOfflineDays: 21, offlineDaysRemaining: 0, cacheState: "empty" },
      transactions: []
    },
    status: { mode: "ready", message: "ok" }
  };

  const completed = await runtime.runHubTask(
    null,
    async () => ({ ...readyState, status: { mode: "ready", message: "completed" } }),
    () => readyState
  );
  assert(completed.status.message === "completed", "runHubTask should return successful task state.");

  const engine = {
    async syncTransactions() {
      return { ...readyState, status: { mode: "ready", message: "synced" } };
    }
  };
  const recovered = await runtime.runHubTask(
    engine,
    async () => {
      throw new Error("boom");
    },
    () => readyState
  );
  assert(recovered.status.mode === "runtime-error", "runHubTask should set runtime-error on failure.");
  assert(recovered.status.message === "boom", "runHubTask should preserve error message.");

  const fixtures = {
    session: {
      userId: "usr_fixture",
      email: "fixture@antiphon.audio",
      displayName: "Fixture",
      signedInAt: "2026-02-13T00:00:00.000Z"
    },
    entitlements: [
      {
        id: "antiphon.hub.test",
        name: "Hub Test",
        version: "1.0.0",
        installedVersion: null,
        owned: true,
        installState: "not-installed",
        updateAvailable: false
      }
    ],
    offlineCache: {
      lastValidatedAt: "2026-02-13T00:00:00.000Z",
      maxOfflineDays: 21,
      offlineDaysRemaining: 21,
      cacheState: "valid"
    },
    transactions: []
  };

  const server = createServer((req, res) => {
    const url = req.url ?? "";
    if (req.method === "POST" && url === "/auth/session") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(fixtures.session));
      return;
    }
    if (req.method === "GET" && url === "/entitlements") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(fixtures.entitlements));
      return;
    }
    if (req.method === "POST" && url === "/entitlements/refresh") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(fixtures.offlineCache));
      return;
    }
    if (req.method === "GET" && url === "/offline-cache/status") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(fixtures.offlineCache));
      return;
    }
    if (req.method === "GET" && url === "/transactions") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(fixtures.transactions));
      return;
    }
    if (req.method === "POST" && url === "/installs/antiphon.hub.test") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ...fixtures.entitlements[0], installedVersion: "1.0.0" }));
      return;
    }
    if (req.method === "POST" && url === "/updates/antiphon.hub.test") {
      res.writeHead(403, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "blocked" }));
      return;
    }
    if (req.method === "DELETE" && url === "/auth/session") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "not found" }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("structure smoke server failed to bind.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const gateway = new gatewayModule.HttpHubGateway({ apiBaseUrl: baseUrl });

  try {
    const signIn = await gateway.signIn("fixture@antiphon.audio");
    assert(signIn.userId === fixtures.session.userId, "HttpHubGateway signIn contract failed.");
    const fetched = await gateway.fetchEntitlements();
    assert(fetched.length === 1 && fetched[0].id === fixtures.entitlements[0].id, "HttpHubGateway entitlements contract failed.");
    const refreshed = await gateway.refreshEntitlements();
    assert(refreshed.cacheState === "valid", "HttpHubGateway refresh contract failed.");
    await gateway.signOut();
    const installed = await gateway.installApp("antiphon.hub.test");
    assert(installed.installedVersion === "1.0.0", "HttpHubGateway install contract failed.");
    let blocked = false;
    try {
      await gateway.applyUpdate("antiphon.hub.test");
    } catch (error) {
      blocked = error instanceof Error && error.message.includes("blocked");
    }
    assert(blocked, "HttpHubGateway should surface API errors.");
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

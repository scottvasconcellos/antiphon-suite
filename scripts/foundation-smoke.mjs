import { spawn, spawnSync } from "node:child_process";

function runStep(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`Step failed: ${command} ${args.join(" ")}`);
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

async function run() {
  runStep("pnpm", ["build"]);
  runStep("pnpm", ["typecheck"]);

  const port = 8799;
  const child = spawn("pnpm", ["--filter", "@antiphon/layer0-authority", "start"], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port)
    }
  });

  try {
    await waitForHealth(`http://127.0.0.1:${port}/health`);
  } finally {
    child.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

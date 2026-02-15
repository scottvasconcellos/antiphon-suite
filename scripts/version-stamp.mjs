import { readFileSync } from "node:fs";
import { join } from "node:path";

const VERSION_STAMP_PATH = join(process.cwd(), "apps", "layer0-hub", "fixtures", "version.json");

function assertString(value, key) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`version_stamp_invalid:${key}`);
  }
}

export function readVersionStamp() {
  const raw = JSON.parse(readFileSync(VERSION_STAMP_PATH, "utf-8"));
  assertString(raw.contract_version, "contract_version");
  assertString(raw.layer0_version, "layer0_version");
  assertString(raw.release_channel, "release_channel");

  return {
    contractVersion: raw.contract_version,
    layer0Version: raw.layer0_version,
    releaseChannel: raw.release_channel,
    raw
  };
}

export { VERSION_STAMP_PATH };

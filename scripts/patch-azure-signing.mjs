/**
 * Injects Azure Trusted Signing options from env into apps/layer0-hub/package.json
 * so electron-builder can sign Windows builds without storing secrets in the repo.
 * Run from repo root. Requires: AZURE_CODE_SIGNING_ACCOUNT_NAME, AZURE_CERT_PROFILE_NAME,
 * AZURE_PUBLISHER_NAME, AZURE_ENDPOINT (optional; has a default).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "apps", "layer0-hub", "package.json");

const accountName = process.env.AZURE_CODE_SIGNING_ACCOUNT_NAME;
const profileName = process.env.AZURE_CERT_PROFILE_NAME;
const publisherName = process.env.AZURE_PUBLISHER_NAME;
const endpoint = process.env.AZURE_ENDPOINT || "https://localhost";

if (!accountName || !profileName || !publisherName) {
  console.error(
    "Missing env: AZURE_CODE_SIGNING_ACCOUNT_NAME, AZURE_CERT_PROFILE_NAME, AZURE_PUBLISHER_NAME"
  );
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.build.win = pkg.build.win || {};
pkg.build.win.azureSignOptions = {
  codeSigningAccountName: accountName,
  certificateProfileName: profileName,
  publisherName,
  endpoint,
  TimestampRfc3161: "http://timestamp.acs.microsoft.com",
  TimestampDigest: "SHA256",
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
console.log("Patched win.azureSignOptions from env.");

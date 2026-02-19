#!/usr/bin/env node
/**
 * Copies shared brand assets from repo assets/brand to Hub's public/brand
 * so the Hub app can serve them at /brand/*. Run from monorepo root or via
 * Hub's prebuild/predev.
 */
import { cpSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const src = join(repoRoot, "assets", "brand");
const dest = join(repoRoot, "apps", "layer0-hub", "public", "brand");
const designSystemLogo = join(repoRoot, "packages", "design-system", "src", "assets", "logo.png");

mkdirSync(dest, { recursive: true });
if (existsSync(src)) {
  cpSync(src, dest, { recursive: true });
  console.log("copy-brand-to-hub: copied assets/brand → apps/layer0-hub/public/brand");
}
if (existsSync(designSystemLogo)) {
  cpSync(designSystemLogo, join(dest, "logo-mark.png"));
  console.log("copy-brand-to-hub: copied design-system logo → apps/layer0-hub/public/brand/logo-mark.png");
}
process.exit(0);

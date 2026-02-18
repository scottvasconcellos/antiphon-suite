#!/usr/bin/env node
/**
 * Design System Update Script
 * 
 * Updates the design system package from a new Figma export ZIP.
 * 
 * Usage:
 *   node scripts/update-design-system.mjs /path/to/new-figma-export.zip
 * 
 * Process:
 * 1. Extract the new Figma ZIP to a temporary location
 * 2. Read current design system manifest/fingerprint (if exists)
 * 3. Compare new export with current state
 * 4. Generate change report
 * 5. Apply changes
 * 6. Update version in package.json
 */

import { createReadStream, readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DESIGN_SYSTEM_DIR = join(REPO_ROOT, 'packages', 'design-system');
const MANIFEST_PATH = join(DESIGN_SYSTEM_DIR, '.design-system-manifest.json');
const WARNINGS_PATH = join(DESIGN_SYSTEM_DIR, '.migration-warnings.md');
const UPDATE_HISTORY_DIR = join(DESIGN_SYSTEM_DIR, '.update-history');

/**
 * Calculate SHA-256 hash of a file
 */
function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Load current manifest if it exists
 */
function loadCurrentManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch (e) {
    console.warn('Failed to load manifest:', e.message);
    return null;
  }
}

/**
 * Extract ZIP file (using unzip command)
 */
function extractZip(zipPath, destDir) {
  try {
    execSync(`unzip -qo "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error('Failed to extract ZIP:', e.message);
    return false;
  }
}

/**
 * Build manifest from extracted files
 */
function buildManifest(extractedDir, zipPath, zipHash) {
  const manifest = {
    version: '0.1.0',
    sourceZipHash: zipHash,
    lastUpdated: new Date().toISOString(),
    fingerprint: {
      components: [],
      icons: [],
      tokens: [],
      styles: [],
      guidelines: [],
      assets: [],
    },
    fileHashes: {},
  };

  // Walk through extracted directory and catalog files
  const walkDir = (dir, basePath = '') => {
    const files = execSync(`find "${dir}" -type f`, { encoding: 'utf-8' }).trim().split('\n');
    
    for (const file of files) {
      const relPath = file.replace(extractedDir + '/', '');
      const content = readFileSync(file);
      const hash = sha256Hex(content);
      
      manifest.fileHashes[relPath] = hash;
      
      // Categorize files
      if (relPath.includes('components/ui/') || relPath.includes('components/audio/')) {
        manifest.fingerprint.components.push(relPath);
      } else if (relPath.includes('icons/')) {
        manifest.fingerprint.icons.push(relPath);
      } else if (relPath.includes('tokens/') || relPath.includes('styles/')) {
        manifest.fingerprint.tokens.push(relPath);
      } else if (relPath.endsWith('.css')) {
        manifest.fingerprint.styles.push(relPath);
      } else if (relPath.includes('guidelines/') || relPath.endsWith('.md')) {
        manifest.fingerprint.guidelines.push(relPath);
      } else if (/\.(png|jpg|jpeg|svg|woff2?|ttf|ico)$/i.test(relPath)) {
        manifest.fingerprint.assets.push(relPath);
      }
    }
  };

  walkDir(extractedDir);
  return manifest;
}

/**
 * Compare manifests and detect changes
 */
function compareManifests(oldManifest, newManifest) {
  const changes = {
    added: [],
    removed: [],
    changed: [],
  };

  if (!oldManifest) {
    // First import - everything is added
    changes.added = Object.keys(newManifest.fileHashes);
    return changes;
  }

  const oldHashes = oldManifest.fileHashes || {};
  const newHashes = newManifest.fileHashes || {};

  // Find added files
  for (const file of Object.keys(newHashes)) {
    if (!oldHashes[file]) {
      changes.added.push(file);
    } else if (oldHashes[file] !== newHashes[file]) {
      changes.changed.push(file);
    }
  }

  // Find removed files
  for (const file of Object.keys(oldHashes)) {
    if (!newHashes[file]) {
      changes.removed.push(file);
    }
  }

  return changes;
}

/**
 * Generate migration warnings
 */
function generateWarnings(changes, oldManifest, newManifest) {
  const warnings = [];
  warnings.push('# Design System Update Warnings\n');
  warnings.push(`**Update Date:** ${new Date().toISOString()}\n`);
  warnings.push(`**Source:** ${newManifest.sourceZipHash.substring(0, 16)}...\n\n`);

  if (changes.removed.length > 0) {
    warnings.push('## Removed Items\n\n');
    for (const file of changes.removed) {
      warnings.push(`- ⚠️ **${file}** - Removed in new export. Check if replaced by new component.\n`);
    }
    warnings.push('\n');
  }

  if (changes.changed.length > 0) {
    warnings.push('## Changed Items\n\n');
    for (const file of changes.changed) {
      warnings.push(`- 📝 **${file}** - Modified in new export.\n`);
    }
    warnings.push('\n');
  }

  if (changes.added.length > 0) {
    warnings.push('## Added Items\n\n');
    for (const file of changes.added.slice(0, 20)) { // Limit to first 20
      warnings.push(`- ✅ **${file}** - Added in new export.\n`);
    }
    if (changes.added.length > 20) {
      warnings.push(`\n... and ${changes.added.length - 20} more files.\n`);
    }
    warnings.push('\n');
  }

  return warnings.join('');
}

/**
 * Apply updates by copying files from extracted directory
 */
function applyUpdates(extractedDir, changes) {
  const srcDir = join(extractedDir, 'src');
  const destSrcDir = join(DESIGN_SYSTEM_DIR, 'src');

  // Copy components
  if (existsSync(join(srcDir, 'components'))) {
    cpSync(join(srcDir, 'components'), join(destSrcDir, 'components'), { recursive: true });
  }

  // Copy icons
  if (existsSync(join(srcDir, 'components', 'icons'))) {
    cpSync(join(srcDir, 'components', 'icons'), join(destSrcDir, 'icons'), { recursive: true });
  }

  // Copy styles
  if (existsSync(join(srcDir, 'styles'))) {
    cpSync(join(srcDir, 'styles'), join(destSrcDir, 'styles'), { recursive: true });
  }
  if (existsSync(join(srcDir, 'index.css'))) {
    // Use globals.css if available, otherwise index.css
    if (existsSync(join(srcDir, 'styles', 'globals.css'))) {
      cpSync(join(srcDir, 'styles', 'globals.css'), join(destSrcDir, 'styles', 'globals.css'));
    }
  }

  // Copy guidelines
  if (existsSync(join(srcDir, 'guidelines'))) {
    cpSync(join(srcDir, 'guidelines'), join(destSrcDir, 'guidelines'), { recursive: true });
  }

  // Copy assets
  if (existsSync(join(srcDir, 'assets'))) {
    cpSync(join(srcDir, 'assets'), join(destSrcDir, 'assets'), { recursive: true });
  }

  console.log('✅ Files copied successfully');
}

/**
 * Main update function
 */
async function updateDesignSystem(zipPath) {
  console.log(`📦 Updating design system from: ${zipPath}\n`);

  // Read ZIP file and calculate hash
  const zipBuffer = readFileSync(zipPath);
  const zipHash = sha256Hex(zipBuffer);
  console.log(`📋 Source ZIP hash: ${zipHash.substring(0, 16)}...\n`);

  // Load current manifest
  const oldManifest = loadCurrentManifest();
  if (oldManifest) {
    console.log(`📄 Current version: ${oldManifest.version || 'unknown'}\n`);
  } else {
    console.log('📄 No existing manifest found (first import)\n');
  }

  // Extract ZIP to temporary directory
  const tempDir = join(__dirname, '..', '.tmp-figma-export');
  mkdirSync(tempDir, { recursive: true });
  
  console.log('📂 Extracting ZIP...');
  if (!extractZip(zipPath, tempDir)) {
    console.error('❌ Failed to extract ZIP');
    process.exit(1);
  }

  // Build new manifest
  console.log('🔍 Analyzing extracted files...');
  const newManifest = buildManifest(tempDir, zipPath, zipHash);

  // Compare manifests
  const changes = compareManifests(oldManifest, newManifest);
  
  console.log('\n📊 Changes detected:');
  console.log(`   Added: ${changes.added.length}`);
  console.log(`   Changed: ${changes.changed.length}`);
  console.log(`   Removed: ${changes.removed.length}\n`);

  // Generate warnings
  const warnings = generateWarnings(changes, oldManifest, newManifest);
  writeFileSync(WARNINGS_PATH, warnings);
  console.log(`📝 Migration warnings written to: ${WARNINGS_PATH}\n`);

  // Apply updates
  console.log('🔄 Applying updates...');
  applyUpdates(tempDir, changes);

  // Save new manifest
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  console.log(`💾 Manifest saved to: ${MANIFEST_PATH}\n`);

  // Update version in package.json
  const packageJsonPath = join(DESIGN_SYSTEM_DIR, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = packageJson.version || '0.1.0';
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  packageJson.version = `${major}.${minor + 1}.${patch}`;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`📌 Version updated: ${currentVersion} → ${packageJson.version}\n`);

  console.log('✅ Design system update complete!\n');
  console.log('📋 Next steps:');
  console.log('   1. Review migration warnings:', WARNINGS_PATH);
  console.log('   2. Test components in consuming apps');
  console.log('   3. Update imports if needed');
  console.log('   4. Commit changes\n');
}

// Main execution
const zipPath = process.argv[2];
if (!zipPath) {
  console.error('Usage: node scripts/update-design-system.mjs /path/to/figma-export.zip');
  process.exit(1);
}

if (!existsSync(zipPath)) {
  console.error(`Error: ZIP file not found: ${zipPath}`);
  process.exit(1);
}

updateDesignSystem(zipPath).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

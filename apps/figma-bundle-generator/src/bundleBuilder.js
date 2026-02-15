/**
 * Builds the Handoff Bundle from a Figma export ZIP per layer0_figma_cursor_handoff spec.
 * Non-destructive, deterministic, authoritative fidelity.
 */

import JSZip from 'jszip';

const UTF8 = { type: 'string', compression: 'DEFLATE', compressionOptions: { level: 6 } };
const BINARY = { compression: 'DEFLATE', compressionOptions: { level: 6 } };

/** @param {ArrayBuffer} buf */
async function sha256Hex(buf) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @param {JSZip} zip
 * @returns {{ name: string, paths: string[] }[]}
 */
function inventory(zip) {
  const components = [];
  const styles = [];
  const tokens = [];
  const assets = [];
  const docs = [];
  const other = [];

  zip.forEach((path) => {
    const n = path.replace(/\/$/, '');
    if (!n) return;
    const lower = n.toLowerCase();
    if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) components.push(n);
    else if (lower.endsWith('.css') || lower.endsWith('.scss')) styles.push(n);
    else if (lower.includes('token') || lower.endsWith('-tokens') || lower.includes('variables')) tokens.push(n);
    else if (/\.(png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(n) || n.includes('assets')) assets.push(n);
    else if (lower.endsWith('.md')) docs.push(n);
    else other.push(n);
  });

  return [
    { name: 'components', paths: components.sort() },
    { name: 'styles', paths: styles.sort() },
    { name: 'tokens', paths: tokens.sort() },
    { name: 'assets', paths: assets.sort() },
    { name: 'docs', paths: docs.sort() },
    { name: 'other', paths: other.sort() },
  ];
}

/**
 * @param {JSZip} zip
 * @returns {Promise<{ manifest: object, fingerprint: object, fileHashes: Record<string, string> }>}
 */
async function buildManifestAndFingerprint(zip, zipName, sourceZipHash) {
  const fileHashes = {};
  const inv = inventory(zip);
  const invMap = Object.fromEntries(inv.map((i) => [i.name, i.paths]));

  for (const entry of inv.flatMap((i) => i.paths)) {
    const f = zip.file(entry);
    if (!f) continue;
    const buf = await f.async('arraybuffer');
    fileHashes[entry] = await sha256Hex(buf);
  }

  let pkg = {};
  {
    const f = zip.file('package.json');
    if (f) {
      const text = await f.async('string');
      try {
        pkg = JSON.parse(text);
      } catch (_) {}
    }
  }

  const frameworkSignals = [];
  if (zip.file('vite.config.ts') || zip.file('vite.config.js')) frameworkSignals.push('Vite');
  if (invMap.components.length || zip.file('src/App.tsx') || zip.file('src/App.jsx')) frameworkSignals.push('React');
  if (invMap.components.some((p) => p.endsWith('.tsx'))) frameworkSignals.push('TSX');

  const manifest = {
    sourceIdentification: {
      exportName: zipName.replace(/\.zip$/i, ''),
      frameworkBuildSignals: frameworkSignals.length ? frameworkSignals : ['unknown'],
    },
    inventory: {
      components: invMap.components,
      styles: invMap.styles,
      tokens: invMap.tokens,
      assets: invMap.assets,
      docs: invMap.docs,
      dependencies: pkg.dependencies ? Object.entries(pkg.dependencies).map(([k, v]) => ({ name: k, version: v })) : [],
    },
    integrity: {
      sourceZipSha256: sourceZipHash,
      perFileSha256: fileHashes,
    },
    authorityNotes:
      'TSX, CSS, and assets in this export are authoritative. Do not "fix" or reinterpret them; apply as-is.',
  };

  const fingerprint = {
    generatedAt: new Date().toISOString(),
    sourceZipName: zipName,
    sourceZipSha256: sourceZipHash,
    fileCount: Object.keys(fileHashes).length,
    exportName: zipName.replace(/\.zip$/i, ''),
  };

  return { manifest, fingerprint, fileHashes };
}

/**
 * First import: no prior. diff = initial.
 */
function buildDiff(manifest, priorFingerprint = null) {
  if (!priorFingerprint) {
    return {
      mode: 'initial',
      added: manifest.inventory.components.concat(manifest.inventory.styles).concat(manifest.inventory.assets).concat(manifest.inventory.docs),
      removed: [],
      changed: [],
    };
  }
  return {
    mode: 'update',
    added: [],
    removed: [],
    changed: [],
    priorFingerprint: priorFingerprint.sourceZipSha256,
  };
}

const CURSOR_PLAYBOOK = `# Cursor playbook — Design system handoff

## What this bundle is
This is an **Antiphon Layer 0 Handoff Bundle**. It contains a Figma-exported design system (Vite/React/TSX) as a single source of truth for the monorepo. Cursor should use it to keep all apps on the latest brand skin.

## Authoritative payload
- **Components**: \`MANIFEST/manifest.json\` → \`inventory.components\` (paths inside the original export).
- **Styles**: \`inventory.styles\`
- **Tokens**: \`inventory.tokens\`
- **Assets**: \`inventory.assets\`
- **Docs**: \`inventory.docs\`

The actual file contents are in the **INPUT** copy of the export (extract INPUT/source.zip or use the extracted copy if present). Do not modify TSX/CSS/assets; apply them as-is.

## How to apply (supersede prior)
1. Identify the design-system target in the repo (e.g. \`packages/design-system\` or app-specific \`src/design\`).
2. Replace the active design system with the contents of this bundle's export (from INPUT). Last import wins; there is only one active version.
3. Update imports in consuming apps so they point to the single design system location. Remove any duplicate or legacy copies to avoid residue/conflicts.
4. Do not rewrite or "fix" exported code; preserve fidelity.

## Rollback
Prior inputs and fingerprints may be in \`history/\` for inspection only. To roll back, re-apply a prior Handoff Bundle.
`;

const START_HERE = `# Layer 0 Handoff Bundle — Start here

This folder is a **Cursor-ingestible Handoff Bundle** produced from a Figma design system export.

## What to do
1. Open your monorepo in Cursor.
2. Use the \`CURSOR/\` playbook (or run the "Ingest Design System Bundle" task if configured) so Cursor knows what to update and where.
3. Cursor will apply the design system from this bundle and keep a single active version (last import wins).

## Structure
- \`INPUT/\` — Original Figma export (ZIP or extracted). Authoritative TSX/CSS/assets.
- \`MANIFEST/\` — manifest.json (inventory), fingerprint.json (hashes, identity).
- \`DIFF/\` — diff.json (and optional diff.md) vs prior import.
- \`DOCS/\` — Guideline docs from the export (unchanged).
- \`CURSOR/\` — Playbook and task definition for Cursor.

## First-time setup
See \`CURSOR/FIRST_TIME_SETUP.md\` if you need to configure Cursor to look for this playbook.
`;

const FIRST_TIME_SETUP = `# First-time setup for Cursor

1. Add a project convention so Cursor knows to look for Handoff Bundles: e.g. place this repo's \`.cursor/rules\` or docs to reference \`CURSOR/playbook.md\` when a Handoff Bundle is present.
2. Alternatively, create a Cursor task (e.g. "Ingest Design System Bundle") that runs the steps in \`playbook.md\`.
3. After setup, future bundles are promptless: drop bundle → run task or follow playbook.
`;

/**
 * @param {File} file - The Figma export ZIP file
 * @returns {Promise<Blob>} - The Handoff Bundle as a ZIP Blob
 */
export async function buildHandoffBundle(file) {
  const zipName = file.name || 'figma-export.zip';
  const arrayBuffer = await file.arrayBuffer();
  const sourceZipHash = await sha256Hex(arrayBuffer);

  const zip = await JSZip.loadAsync(arrayBuffer);

  // Validation
  if (!zip.file('package.json')) {
    throw new Error('Missing package.json in the export.');
  }
  const hasSrc = Object.keys(zip.files).some((p) => p.startsWith('src/') && !p.endsWith('/'));
  if (!hasSrc) {
    throw new Error('Missing src/ in the export.');
  }

  const { manifest, fingerprint, fileHashes } = await buildManifestAndFingerprint(
    zip,
    zipName,
    sourceZipHash
  );
  const diff = buildDiff(manifest, null);

  const out = new JSZip();

  // INPUT: preserve original ZIP
  out.file('INPUT/source.zip', arrayBuffer, BINARY);

  // MANIFEST
  out.file('MANIFEST/manifest.json', JSON.stringify(manifest, null, 2), UTF8);
  out.file('MANIFEST/fingerprint.json', JSON.stringify(fingerprint, null, 2), UTF8);

  // DIFF
  out.file('DIFF/diff.json', JSON.stringify(diff, null, 2), UTF8);
  const diffMd = `# Diff summary\n\nMode: ${diff.mode}\nAdded: ${diff.added.length} files.\n`;
  out.file('DIFF/diff.md', diffMd, UTF8);

  // DOCS: copy MD files from export
  const docPaths = manifest.inventory.docs || [];
  for (const path of docPaths) {
    const f = zip.file(path);
    if (f) {
      const content = await f.async('string');
      out.file(`DOCS/${path}`, content, UTF8);
    }
  }

  // CURSOR
  out.file('CURSOR/playbook.md', CURSOR_PLAYBOOK, UTF8);
  out.file('CURSOR/FIRST_TIME_SETUP.md', FIRST_TIME_SETUP, UTF8);

  // START_HERE at root
  out.file('START_HERE.md', START_HERE, UTF8);

  return out.generateAsync({ type: 'blob' });
}

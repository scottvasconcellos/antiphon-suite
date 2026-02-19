#!/usr/bin/env node
/**
 * Read extracted ChatGPT conversation JSON, split into assistant responses,
 * derive title/slug per response, preserve equations and formatting,
 * write one Markdown file per response to the given output directory.
 *
 * Usage: node scripts/chatgpt-responses-to-docs.mjs <path-to-extracted.json> <output-dir>
 * Example: node scripts/chatgpt-responses-to-docs.mjs "/Users/.../High testings/chatgpt-extracted.json" "/Users/.../High testings"
 */

import fs from 'fs';
import path from 'path';

const jsonPath = process.argv[2];
const outDir = process.argv[3];

if (!jsonPath || !outDir) {
  console.error('Usage: node chatgpt-responses-to-docs.mjs <path-to-extracted.json> <output-dir>');
  process.exit(1);
}

const raw = fs.readFileSync(jsonPath, 'utf8');
let messages;
try {
  messages = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

const assistantOnly = messages.filter((m) => m.role === 'assistant');

const SIMPLE_TITLES = [
  'Metrics Summary and Path to 90',
  'Tonicization Shield',
  'Home-Key Inertia',
  'Span and Cadence Gating',
  'Promotion Rule',
  'Secondary-Dominant Resolver',
  'Cadence Strength Weighting',
  'Short-Visit Demotion',
  'Tonicization Budget',
  'Parallel Major-Minor Tie-Breaker',
  'Picardy and Anti-Picardy',
  'Two-Track Key Output',
  'Phrase-Level Segmentation',
  'Name vs Function Split',
  'Hysteresis and Cooldown',
  'Rule-Conflict Resolver',
  'Dominant-Chain Collapsing',
  'Adjudication Scorecard',
  'Modal and Ambiguous Loop',
  'Unit Rules for Failures',
  'Converting Soft Fails First',
  'Key Decision Pipeline',
  'Parameter Starter Kit',
  'Conclusion',
];

function deriveTitle(text, index) {
  if (SIMPLE_TITLES[index]) return SIMPLE_TITLES[index];
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) || '';
  let title = firstLine.trim().replace(/\s+/g, ' ').slice(0, 50);
  return title || 'Untitled';
}

function slugify(title) {
  return title
    .replace(/[/\\:*?"<>|%]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'document';
}

function escapeFrontmatterString(s) {
  if (s.includes('"') || s.includes('\n')) return JSON.stringify(s);
  return s;
}

const outPath = path.resolve(outDir);
if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });

assistantOnly.forEach((msg, index) => {
  const oneBased = index + 1;
  const nn = String(oneBased).padStart(2, '0');
  const title = deriveTitle(msg.text, index);
  const slug = slugify(title);
  const filename = `${nn}-${slug}.md`;
  const filePath = path.join(outPath, filename);

  const frontmatter = `---
title: ${escapeFrontmatterString(title)}
order: ${oneBased}
---

`;
  const body = msg.text.trim();
  const content = frontmatter + body + '\n';

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Wrote', filename);
});

console.log('Done. Wrote', assistantOnly.length, 'documents to', outPath);

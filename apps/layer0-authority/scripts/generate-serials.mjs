#!/usr/bin/env node
/**
 * Generate license serials for products using cryptographically secure generation.
 * 
 * Usage:
 *   node scripts/generate-serials.mjs <productId> <count> [--checksum]
 * 
 * Example:
 *   node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10
 *   node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10 --checksum
 * 
 * Serials are formatted as: XXXX-XXXX-XXXX-XXXX
 * With checksum: XXXX-XXXX-XXXX-XXXX-CCCC
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash, randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "../../data/authority.db");

const SERIAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SERIAL_SEGMENT_LENGTH = 4;
const SERIAL_SEGMENTS = 4;
const CHECKSUM_LENGTH = 4;

/**
 * Generate a cryptographically secure random serial.
 */
function generateSecureSerial(): string {
  const parts = [];
  
  for (let i = 0; i < SERIAL_SEGMENTS; i++) {
    const segment = [];
    // Use crypto.randomBytes for cryptographically secure randomness
    const bytes = randomBytes(SERIAL_SEGMENT_LENGTH);
    
    for (let j = 0; j < SERIAL_SEGMENT_LENGTH; j++) {
      const index = bytes[j] % SERIAL_CHARS.length;
      segment.push(SERIAL_CHARS[index]);
    }
    
    parts.push(segment.join(""));
  }
  
  return parts.join("-");
}

/**
 * Generate a serial with checksum for validation.
 */
function generateSerialWithChecksum(): string {
  const baseSerial = generateSecureSerial();
  const baseWithoutDashes = baseSerial.replace(/-/g, "");
  
  // Generate checksum: SHA-256 hash of base, take first 4 chars
  const hash = createHash("sha256").update(baseWithoutDashes).digest("hex");
  const checksum = hash
    .substring(0, CHECKSUM_LENGTH)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "A");
  
  return `${baseSerial}-${checksum}`;
}

/**
 * Generate SHA-256 hash of a serial for storage.
 */
function hashSerial(serial: string): string {
  const normalized = serial.trim().replace(/\s+/g, "-").toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

function main() {
  const productId = process.argv[2];
  const count = parseInt(process.argv[3] || "1", 10);
  const useChecksum = process.argv.includes("--checksum");

  if (!productId) {
    console.error("Usage: node scripts/generate-serials.mjs <productId> <count> [--checksum]");
    console.error("Example: node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10");
    console.error("Example: node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10 --checksum");
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Check if product exists
  const product = db.prepare("SELECT id, name FROM products WHERE id = ?").get(productId);
  if (!product) {
    console.error(`Product "${productId}" not found in catalog.`);
    console.error("Available products:");
    const products = db.prepare("SELECT id, name FROM products").all();
    for (const p of products) {
      console.error(`  - ${p.id} (${p.name})`);
    }
    db.close();
    process.exit(1);
  }

  console.log(`Generating ${count} cryptographically secure serial(s) for ${product.name} (${productId})...`);
  if (useChecksum) {
    console.log("Using checksum validation (format: XXXX-XXXX-XXXX-XXXX-CCCC)");
  }

  const insert = db.prepare(`
    INSERT INTO serials (serial, product_id, serial_hash, generated_by, source)
    VALUES (?, ?, ?, ?, 'manual')
  `);
  const serials = [];
  const generatedBy = process.env.USER || "system";

  for (let i = 0; i < count; i++) {
    let serial;
    let attempts = 0;
    do {
      serial = useChecksum ? generateSerialWithChecksum() : generateSecureSerial();
      attempts++;
      if (attempts > 100) {
        console.error("Failed to generate unique serial after 100 attempts");
        db.close();
        process.exit(1);
      }
    } while (db.prepare("SELECT 1 FROM serials WHERE serial = ?").get(serial));

    const serialHash = hashSerial(serial);
    insert.run(serial, productId, serialHash, generatedBy);
    serials.push(serial);
    console.log(`  ${i + 1}. ${serial}`);
  }

  console.log(`\n✓ Generated ${count} serial(s) for ${product.name}`);
  console.log("\nCopy these serials to send to customers or store in your purchase system.");
  console.log("\nTo redeem, customers paste the serial in Hub → Licenses → Redeem license key.");

  db.close();
}

main();

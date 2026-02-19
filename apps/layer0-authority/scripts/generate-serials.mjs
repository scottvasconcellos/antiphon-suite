#!/usr/bin/env node
/**
 * Generate license serials for products.
 * 
 * Usage:
 *   node scripts/generate-serials.mjs <productId> <count>
 * 
 * Example:
 *   node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10
 * 
 * Serials are formatted as: XXXX-XXXX-XXXX-XXXX
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "../../data/authority.db");

function generateSerial(): string {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const segment = Array.from({ length: 4 }, () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude I, O, 0, 1 for clarity
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");
    parts.push(segment);
  }
  return parts.join("-");
}

function main() {
  const productId = process.argv[2];
  const count = parseInt(process.argv[3] || "1", 10);

  if (!productId) {
    console.error("Usage: node scripts/generate-serials.mjs <productId> <count>");
    console.error("Example: node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10");
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

  console.log(`Generating ${count} serial(s) for ${product.name} (${productId})...`);

  const insert = db.prepare("INSERT INTO serials (serial, product_id) VALUES (?, ?)");
  const serials = [];

  for (let i = 0; i < count; i++) {
    let serial;
    let attempts = 0;
    do {
      serial = generateSerial();
      attempts++;
      if (attempts > 100) {
        console.error("Failed to generate unique serial after 100 attempts");
        db.close();
        process.exit(1);
      }
    } while (db.prepare("SELECT 1 FROM serials WHERE serial = ?").get(serial));

    insert.run(serial, productId);
    serials.push(serial);
    console.log(`  ${i + 1}. ${serial}`);
  }

  console.log(`\n✓ Generated ${count} serial(s) for ${product.name}`);
  console.log("\nCopy these serials to send to customers or store in your purchase system.");
  console.log("\nTo redeem, customers paste the serial in Hub → Licenses → Redeem license key.");

  db.close();
}

main();

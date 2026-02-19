import Database from "better-sqlite3";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "../../data/authority.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database) {
  // Products: canonical catalog of all available apps
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('stable', 'beta')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Entitlements: user ownership of products
  database.exec(`
    CREATE TABLE IF NOT EXISTS entitlements (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      granted_via TEXT NOT NULL CHECK(granted_via IN ('serial', 'stripe', 'manual')),
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Serials: valid license keys that can be redeemed
  database.exec(`
    CREATE TABLE IF NOT EXISTS serials (
      serial TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      redeemed_at TEXT,
      redeemed_by_user_id TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (redeemed_by_user_id) REFERENCES entitlements(user_id)
    )
  `);

  // Sessions: user authentication state
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      signed_in_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Offline cache: per-user offline trust state
  database.exec(`
    CREATE TABLE IF NOT EXISTS offline_cache (
      user_id TEXT PRIMARY KEY,
      last_validated_at TEXT,
      max_offline_days INTEGER NOT NULL DEFAULT 21,
      FOREIGN KEY (user_id) REFERENCES sessions(user_id)
    )
  `);

  // Transactions: install/update history
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('install', 'update')),
      status TEXT NOT NULL CHECK(status IN ('succeeded', 'failed')),
      message TEXT NOT NULL,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES sessions(user_id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
    CREATE INDEX IF NOT EXISTS idx_serials_product ON serials(product_id);
    CREATE INDEX IF NOT EXISTS idx_serials_redeemed ON serials(redeemed_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

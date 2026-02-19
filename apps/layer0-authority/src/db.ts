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
      granted_via TEXT NOT NULL CHECK(granted_via IN ('serial', 'stripe', 'coinbase', 'manual')),
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
      serial_hash TEXT,
      generated_by TEXT,
      source TEXT CHECK(source IN ('manual', 'stripe', 'coinbase')) DEFAULT 'manual',
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

  // Payments: track all payment transactions to prevent duplicates
  database.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      payment_provider TEXT NOT NULL CHECK(payment_provider IN ('stripe', 'coinbase', 'serial', 'manual')),
      customer_email TEXT NOT NULL,
      product_id TEXT NOT NULL,
      amount REAL,
      currency TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
      granted_entitlement INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(payment_id, payment_provider)
    )
  `);

  // Fraud log: track suspicious activity
  database.exec(`
    CREATE TABLE IF NOT EXISTS fraud_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip_address TEXT,
      action TEXT NOT NULL CHECK(action IN ('redeem_attempt', 'webhook_replay', 'rate_limit_exceeded', 'duplicate_serial', 'invalid_pattern')),
      reason TEXT NOT NULL,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES sessions(user_id)
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
    CREATE INDEX IF NOT EXISTS idx_serials_product ON serials(product_id);
    CREATE INDEX IF NOT EXISTS idx_serials_redeemed ON serials(redeemed_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(payment_provider);
    CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(customer_email);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_fraud_log_user ON fraud_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_fraud_log_ip ON fraud_log(ip_address);
    CREATE INDEX IF NOT EXISTS idx_fraud_log_action ON fraud_log(action);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

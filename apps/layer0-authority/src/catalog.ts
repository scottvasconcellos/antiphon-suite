/**
 * Canonical product catalog.
 * This is the source of truth for all available products.
 * Ownership is derived from entitlements table, not stored here.
 */
export type Product = {
  id: string;
  name: string;
  version: string;
  channel: "stable" | "beta";
  price?: number; // USD price
  stripe_price_id?: string; // Stripe Price ID (e.g., price_xxx)
  coinbase_product_id?: string; // Coinbase Commerce product ID
  available?: boolean; // Can disable products without deleting
  requires_entitlement?: boolean; // Free vs paid (default: true)
};

export const CANONICAL_PRODUCTS: Product[] = [
  {
    id: "antiphon.layer.hello-world",
    name: "Hello World",
    version: "1.1.0",
    channel: "stable",
    available: true,
    requires_entitlement: false // Free demo
  },
  {
    id: "antiphon.layer.rhythm",
    name: "Rhythm",
    version: "1.1.0-beta.1",
    channel: "beta",
    available: true,
    requires_entitlement: true
  },
  {
    id: "antiphon.layer.chord-scale-helper",
    name: "Chord Scale Helper",
    version: "1.0.0",
    channel: "stable",
    available: true,
    requires_entitlement: true,
    price: 79 // USD
    // stripe_price_id and coinbase_product_id set when you create products in Stripe/Coinbase
  },
  {
    id: "hub-synth",
    name: "Antiphon Synth",
    version: "3.2.0",
    channel: "stable",
    available: true,
    requires_entitlement: true
  },
  {
    id: "hub-delay",
    name: "Antiphon Delay",
    version: "1.4.0",
    channel: "stable",
    available: true,
    requires_entitlement: true
  },
  {
    id: "hub-chorus",
    name: "Antiphon Chorus",
    version: "1.1.3",
    channel: "stable",
    available: true,
    requires_entitlement: true
  }
];

/**
 * Initialize products in database if they don't exist.
 * Note: Payment metadata (stripe_price_id, coinbase_product_id) is stored
 * in catalog.ts, not in database. Database only stores core product info.
 */
export function seedProducts(db: ReturnType<typeof import("./db.js").getDb>) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO products (id, name, version, channel)
    VALUES (?, ?, ?, ?)
  `);

  for (const product of CANONICAL_PRODUCTS) {
    // Only insert if available (allows disabling products)
    if (product.available !== false) {
      insert.run(product.id, product.name, product.version, product.channel);
    }
  }
}

/**
 * Get product by ID with full metadata (including payment info).
 */
export function getProduct(productId: string): Product | undefined {
  return CANONICAL_PRODUCTS.find((p) => p.id === productId && p.available !== false);
}

/**
 * Map Stripe price ID to product ID.
 */
export function getProductByStripePriceId(stripePriceId: string): Product | undefined {
  return CANONICAL_PRODUCTS.find(
    (p) => p.stripe_price_id === stripePriceId && p.available !== false
  );
}

/**
 * Map Coinbase product ID to product ID.
 */
export function getProductByCoinbaseProductId(coinbaseProductId: string): Product | undefined {
  return CANONICAL_PRODUCTS.find(
    (p) => p.coinbase_product_id === coinbaseProductId && p.available !== false
  );
}

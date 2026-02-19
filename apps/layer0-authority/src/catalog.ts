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
};

export const CANONICAL_PRODUCTS: Product[] = [
  {
    id: "antiphon.layer.hello-world",
    name: "Hello World",
    version: "1.1.0",
    channel: "stable"
  },
  {
    id: "antiphon.layer.rhythm",
    name: "Rhythm",
    version: "1.1.0-beta.1",
    channel: "beta"
  },
  {
    id: "antiphon.layer.chord-scale-helper",
    name: "Chord Scale Helper",
    version: "1.0.0",
    channel: "stable"
  },
  {
    id: "hub-synth",
    name: "Antiphon Synth",
    version: "3.2.0",
    channel: "stable"
  },
  {
    id: "hub-delay",
    name: "Antiphon Delay",
    version: "1.4.0",
    channel: "stable"
  },
  {
    id: "hub-chorus",
    name: "Antiphon Chorus",
    version: "1.1.3",
    channel: "stable"
  }
];

/**
 * Initialize products in database if they don't exist.
 */
export function seedProducts(db: ReturnType<typeof import("./db.js").getDb>) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO products (id, name, version, channel)
    VALUES (?, ?, ?, ?)
  `);

  for (const product of CANONICAL_PRODUCTS) {
    insert.run(product.id, product.name, product.version, product.channel);
  }
}

import Database from "better-sqlite3";

/**
 * Payment deduplication service.
 * Prevents double-granting entitlements from webhook replays or multiple payment methods.
 */

type PaymentProvider = "stripe" | "coinbase" | "serial" | "manual";

type PaymentRecord = {
  payment_id: string;
  payment_provider: PaymentProvider;
  customer_email: string;
  product_id: string;
  amount?: number;
  currency?: string;
};

/**
 * Check if a payment already exists (prevents duplicate grants).
 */
export function checkPaymentExists(
  db: Database.Database,
  paymentId: string,
  provider: PaymentProvider
): { exists: boolean; alreadyGranted: boolean } {
  const payment = db.prepare(`
    SELECT granted_entitlement FROM payments
    WHERE payment_id = ? AND payment_provider = ?
  `).get(paymentId, provider) as { granted_entitlement: number } | undefined;
  
  if (!payment) {
    return { exists: false, alreadyGranted: false };
  }
  
  return {
    exists: true,
    alreadyGranted: payment.granted_entitlement === 1
  };
}

/**
 * Record a payment transaction.
 */
export function recordPayment(
  db: Database.Database,
  payment: PaymentRecord,
  status: "pending" | "completed" | "failed" | "refunded" = "pending"
): string {
  const id = `pay_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT OR IGNORE INTO payments (
      id, payment_id, payment_provider, customer_email, product_id,
      amount, currency, status, granted_entitlement, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    payment.payment_id,
    payment.payment_provider,
    payment.customer_email,
    payment.product_id,
    payment.amount || null,
    payment.currency || null,
    status,
    now
  );
  
  return id;
}

/**
 * Grant entitlement from a payment and mark it as granted.
 * Uses database transaction to ensure atomicity.
 */
export function grantEntitlementFromPayment(
  db: Database.Database,
  paymentId: string,
  provider: PaymentProvider,
  userId: string,
  productId: string
): { success: boolean; reason?: string } {
  // Use transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // Check if already granted
    const check = checkPaymentExists(db, paymentId, provider);
    if (check.exists && check.alreadyGranted) {
      return { success: false, reason: "Entitlement already granted for this payment" };
    }
    
    // Record payment if not exists
    if (!check.exists) {
      // This shouldn't happen in normal flow, but handle it
      const payment = db.prepare(`
        SELECT customer_email FROM payments
        WHERE payment_id = ? AND payment_provider = ?
      `).get(paymentId, provider) as { customer_email: string } | undefined;
      
      if (!payment) {
        return { success: false, reason: "Payment record not found" };
      }
      
      recordPayment(db, {
        payment_id: paymentId,
        payment_provider: provider,
        customer_email: payment.customer_email,
        product_id: productId
      }, "completed");
    }
    
    // Grant entitlement
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO entitlements (user_id, product_id, granted_at, granted_via)
      VALUES (?, ?, ?, ?)
    `).run(userId, productId, now, provider);
    
    // Mark payment as granted
    db.prepare(`
      UPDATE payments
      SET granted_entitlement = 1, completed_at = ?, status = 'completed'
      WHERE payment_id = ? AND payment_provider = ?
    `).run(now, paymentId, provider);
    
    return { success: true };
  });
  
  return transaction();
}

/**
 * Get payment record by ID and provider.
 */
export function getPayment(
  db: Database.Database,
  paymentId: string,
  provider: PaymentProvider
): {
  id: string;
  payment_id: string;
  payment_provider: string;
  customer_email: string;
  product_id: string;
  amount: number | null;
  currency: string | null;
  status: string;
  granted_entitlement: number;
  created_at: string;
  completed_at: string | null;
} | null {
  return db.prepare(`
    SELECT * FROM payments
    WHERE payment_id = ? AND payment_provider = ?
  `).get(paymentId, provider) as any;
}

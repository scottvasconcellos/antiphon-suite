import Database from "better-sqlite3";

/**
 * Fraud detection and logging.
 */

type FraudAction = "redeem_attempt" | "webhook_replay" | "rate_limit_exceeded" | "duplicate_serial" | "invalid_pattern";

type FraudLogEntry = {
  user_id: string | null;
  ip_address: string | null;
  action: FraudAction;
  reason: string;
};

/**
 * Log suspicious activity to fraud_log table.
 */
export function logFraud(
  db: Database.Database,
  entry: FraudLogEntry
): void {
  const id = `fraud_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO fraud_log (id, user_id, ip_address, action, reason, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    entry.user_id,
    entry.ip_address,
    entry.action,
    entry.reason,
    now
  );
}

/**
 * Check if user has exceeded fraud threshold (3+ fraud entries in last hour).
 */
export function checkFraudThreshold(
  db: Database.Database,
  userId: string | null,
  ipAddress: string | null
): { exceeded: boolean; count: number } {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  
  let count = 0;
  
  if (userId) {
    const userCount = db.prepare(`
      SELECT COUNT(*) as count FROM fraud_log
      WHERE user_id = ? AND occurred_at > ?
    `).get(userId, oneHourAgo) as { count: number } | undefined;
    count += userCount?.count || 0;
  }
  
  if (ipAddress) {
    const ipCount = db.prepare(`
      SELECT COUNT(*) as count FROM fraud_log
      WHERE ip_address = ? AND occurred_at > ?
    `).get(ipAddress, oneHourAgo) as { count: number } | undefined;
    count += ipCount?.count || 0;
  }
  
  return {
    exceeded: count >= 3,
    count
  };
}

/**
 * Detect duplicate serial redemption attempts (same serial, different users).
 */
export function detectDuplicateSerialAttempt(
  db: Database.Database,
  serial: string,
  userId: string,
  ipAddress: string | null
): boolean {
  // Check if this serial was already redeemed by a different user
  const redeemed = db.prepare(`
    SELECT redeemed_by_user_id FROM serials
    WHERE serial = ? AND redeemed_at IS NOT NULL
  `).get(serial) as { redeemed_by_user_id: string } | undefined;
  
  if (redeemed && redeemed.redeemed_by_user_id !== userId) {
    logFraud(db, {
      user_id: userId,
      ip_address: ipAddress,
      action: "duplicate_serial",
      reason: `Serial ${serial} already redeemed by different user`
    });
    return true;
  }
  
  return false;
}

/**
 * Detect rapid-fire redemption attempts from same IP.
 */
export function detectRapidRedeems(
  db: Database.Database,
  ipAddress: string | null
): boolean {
  if (!ipAddress) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const recentAttempts = db.prepare(`
    SELECT COUNT(*) as count FROM fraud_log
    WHERE ip_address = ? AND action = 'redeem_attempt' AND occurred_at > ?
  `).get(ipAddress, fiveMinutesAgo) as { count: number } | undefined;
  
  if (recentAttempts && recentAttempts.count >= 10) {
    logFraud(db, {
      user_id: null,
      ip_address: ipAddress,
      action: "invalid_pattern",
      reason: `Rapid redemption attempts from IP: ${recentAttempts.count} in 5 minutes`
    });
    return true;
  }
  
  return false;
}

/**
 * Get client IP address from request.
 */
export function getClientIp(req: any): string | null {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress ||
    null
  );
}

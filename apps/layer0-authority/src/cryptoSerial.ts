import { createHash, randomBytes } from "node:crypto";

/**
 * Cryptographically secure serial generation and validation.
 * Uses crypto.randomBytes() instead of Math.random() for security.
 */

const SERIAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude I, O, 0, 1 for clarity
const SERIAL_SEGMENT_LENGTH = 4;
const SERIAL_SEGMENTS = 4;
const CHECKSUM_LENGTH = 4;

/**
 * Generate a cryptographically secure random serial.
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export function generateSecureSerial(): string {
  const parts: string[] = [];
  
  for (let i = 0; i < SERIAL_SEGMENTS; i++) {
    const segment: string[] = [];
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
 * Format: XXXX-XXXX-XXXX-XXXX-CCCC
 * Checksum is last 4 chars = hash of first 16 chars
 */
export function generateSerialWithChecksum(): string {
  const baseSerial = generateSecureSerial();
  const baseWithoutDashes = baseSerial.replace(/-/g, "");
  
  // Generate checksum: SHA-256 hash of base, take first 4 chars
  const hash = createHash("sha256").update(baseWithoutDashes).digest("hex");
  const checksum = hash
    .substring(0, CHECKSUM_LENGTH)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "A"); // Ensure only valid chars
  
  return `${baseSerial}-${checksum}`;
}

/**
 * Validate checksum on a serial.
 * Returns true if checksum is valid or serial has no checksum.
 */
export function validateChecksum(serial: string): boolean {
  const parts = serial.split("-");
  
  // If no checksum segment, consider valid (backward compatibility)
  if (parts.length < 5) {
    return true;
  }
  
  if (parts.length !== 5) {
    return false;
  }
  
  const baseParts = parts.slice(0, 4);
  const checksum = parts[4];
  const baseWithoutDashes = baseParts.join("");
  
  // Calculate expected checksum
  const hash = createHash("sha256").update(baseWithoutDashes).digest("hex");
  const expectedChecksum = hash
    .substring(0, CHECKSUM_LENGTH)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "A");
  
  return checksum.toUpperCase() === expectedChecksum;
}

/**
 * Generate SHA-256 hash of a serial for storage/validation.
 */
export function hashSerial(serial: string): string {
  const normalized = serial.trim().replace(/\s+/g, "-").toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalize serial: remove spaces, convert to uppercase, remove checksum for lookup.
 */
export function normalizeSerial(serial: string): string {
  const normalized = serial.trim().replace(/\s+/g, "-").toUpperCase();
  // Remove checksum if present (last segment after 4th dash)
  const parts = normalized.split("-");
  if (parts.length === 5) {
    return parts.slice(0, 4).join("-");
  }
  return normalized;
}

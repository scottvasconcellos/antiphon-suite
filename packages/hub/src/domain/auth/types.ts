/** A unique identifier for a user in the authentication domain. */
export type UserId = string;

/** A unique identifier for an app in the Antiphon suite. */
export type AppId = string;

/**
 * Raw license properties used by the domain entity.
 */
export interface LicenseProps {
  appId: AppId;
  userId: UserId;
  expiresAt: Date | null;
  isActive: boolean;
}

/**
 * Abstraction for deterministic password hashing used by the User entity.
 */
export interface PasswordHasher {
  hash(value: string): string;
}

/**
 * Domain error codes emitted by authentication modules.
 */
export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_LICENSE_EXPIRED'
  | 'AUTH_NETWORK_ERROR';

/** Additional diagnostic metadata carried by auth domain errors. */
export type AuthErrorMetadata = Readonly<Record<string, unknown>>;

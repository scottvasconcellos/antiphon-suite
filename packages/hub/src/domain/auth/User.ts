import { License } from './License';
import type { AppId, PasswordHasher, UserId } from './types';

/**
 * Domain constructor parameters for User.
 */
export interface UserProps {
  id: UserId;
  email: string;
  passwordHash: string;
  licenses: License[];
}

/**
 * Domain entity that models a Hub user and their license entitlements.
 */
export class User {
  /** Immutable user identifier. */
  public readonly id: UserId;

  /** User email address used for authentication and account identity. */
  public readonly email: string;

  /** Persisted password hash used for credential comparison. */
  public readonly passwordHash: string;

  /** Mutable in-memory license set for this user. */
  public readonly licenses: License[];

  private readonly hasher: PasswordHasher;

  /**
   * Creates a user entity with domain-safe defaults.
   */
  public constructor(props: UserProps, hasher: PasswordHasher = DEFAULT_HASHER) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.licenses = [...props.licenses];
    this.hasher = hasher;
  }

  /**
   * Compares a plaintext password against this user's stored hash.
   */
  public validate(password: string): boolean {
    const hashedCandidate = this.hasher.hash(password);
    return hashedCandidate === this.passwordHash;
  }

  /**
   * Returns true when the user has a currently valid license for the app.
   */
  public hasLicense(appId: AppId): boolean {
    return this.licenses.some(
      (license) =>
        license.appId === appId &&
        license.userId === this.id &&
        license.isValid(),
    );
  }

  /**
   * Adds or replaces a license for this user.
   */
  public addLicense(license: License): void {
    if (license.userId !== this.id) {
      throw new Error('Cannot attach license for another user.');
    }

    const existingIndex = this.licenses.findIndex(
      (existing) => existing.appId === license.appId,
    );

    if (existingIndex === -1) {
      this.licenses.push(license);
      return;
    }

    this.licenses[existingIndex] = license;
  }

  /**
   * Deterministic domain hash function used for tests and lightweight checks.
   */
  public static hashPassword(password: string): string {
    return DEFAULT_HASHER.hash(password);
  }
}

const DEFAULT_HASHER: PasswordHasher = {
  hash(value: string): string {
    let accumulator = 0;

    for (const symbol of value) {
      accumulator = (accumulator * 31 + symbol.charCodeAt(0)) >>> 0;
    }

    return accumulator.toString(16).padStart(8, '0');
  },
};

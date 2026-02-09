import type { AppId, LicenseProps, UserId } from './types';

/**
 * Represents a single app license owned by a user.
 *
 * Business rules:
 * - A license is valid only when active and not expired.
 * - Lifetime licenses are modeled with `expiresAt = null`.
 */
export class License {
  /** App identifier this license grants access to. */
  public readonly appId: AppId;

  /** Owner of this license. */
  public readonly userId: UserId;

  /** Expiration date or `null` for lifetime licenses. */
  public readonly expiresAt: Date | null;

  /** Whether this license is currently active. */
  public readonly isActive: boolean;

  /**
   * Creates a new domain license instance.
   */
  public constructor(props: LicenseProps) {
    this.appId = props.appId;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.isActive = props.isActive;
  }

  /**
   * Returns true when the license expiration date has passed.
   */
  public isExpired(): boolean {
    if (this.expiresAt === null) {
      return false;
    }

    return this.expiresAt.getTime() <= Date.now();
  }

  /**
   * Returns true when the license is active and not expired.
   */
  public isValid(): boolean {
    return this.isActive && !this.isExpired();
  }
}

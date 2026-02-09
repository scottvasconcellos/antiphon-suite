import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { License } from '../auth/License';
import { User } from '../auth/User';

/** Unit tests for the User authentication domain entity. */
describe('User', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates a matching password hash', () => {
    const user = createUser();

    expect(user.validate('secret-pass')).toBe(true);
    expect(user.validate('wrong-pass')).toBe(false);
  });

  it('returns false when no licenses exist', () => {
    const user = createUser();

    expect(user.hasLicense('melody-engine')).toBe(false);
  });

  it('returns true when user has a valid license for app', () => {
    const user = createUser();

    user.addLicense(
      new License({
        appId: 'melody-engine',
        userId: user.id,
        expiresAt: null,
        isActive: true,
      }),
    );

    expect(user.hasLicense('melody-engine')).toBe(true);
  });

  it('returns false for expired or inactive licenses', () => {
    const user = createUser();

    user.addLicense(
      new License({
        appId: 'expired-app',
        userId: user.id,
        expiresAt: new Date('2026-01-01T00:00:00.000Z'),
        isActive: true,
      }),
    );

    user.addLicense(
      new License({
        appId: 'inactive-app',
        userId: user.id,
        expiresAt: null,
        isActive: false,
      }),
    );

    expect(user.hasLicense('expired-app')).toBe(false);
    expect(user.hasLicense('inactive-app')).toBe(false);
  });

  it('replaces existing license for the same app on add', () => {
    const user = createUser();

    user.addLicense(
      new License({
        appId: 'melody-engine',
        userId: user.id,
        expiresAt: new Date('2026-03-01T00:00:00.000Z'),
        isActive: false,
      }),
    );

    user.addLicense(
      new License({
        appId: 'melody-engine',
        userId: user.id,
        expiresAt: null,
        isActive: true,
      }),
    );

    expect(user.licenses).toHaveLength(1);
    expect(user.hasLicense('melody-engine')).toBe(true);
  });

  it('throws when adding a license for a different user', () => {
    const user = createUser();

    expect(() => {
      user.addLicense(
        new License({
          appId: 'melody-engine',
          userId: 'another-user',
          expiresAt: null,
          isActive: true,
        }),
      );
    }).toThrow('Cannot attach license for another user.');
  });
});

function createUser(): User {
  return new User({
    id: 'user-1',
    email: 'producer@antiphon.com',
    passwordHash: User.hashPassword('secret-pass'),
    licenses: [],
  });
}

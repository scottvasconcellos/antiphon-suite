import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { License } from '../auth/License';

/** Unit tests for license validation domain logic. */
describe('License', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats lifetime license as valid when active', () => {
    const license = new License({
      appId: 'melody-engine',
      userId: 'user-1',
      expiresAt: null,
      isActive: true,
    });

    expect(license.isExpired()).toBe(false);
    expect(license.isValid()).toBe(true);
  });

  it('marks future expiration as valid', () => {
    const license = new License({
      appId: 'melody-engine',
      userId: 'user-1',
      expiresAt: new Date('2026-02-15T00:00:00.000Z'),
      isActive: true,
    });

    expect(license.isExpired()).toBe(false);
    expect(license.isValid()).toBe(true);
  });

  it('marks past expiration as invalid', () => {
    const license = new License({
      appId: 'melody-engine',
      userId: 'user-1',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      isActive: true,
    });

    expect(license.isExpired()).toBe(true);
    expect(license.isValid()).toBe(false);
  });

  it('marks inactive license as invalid even when not expired', () => {
    const license = new License({
      appId: 'melody-engine',
      userId: 'user-1',
      expiresAt: new Date('2026-03-01T00:00:00.000Z'),
      isActive: false,
    });

    expect(license.isExpired()).toBe(false);
    expect(license.isValid()).toBe(false);
  });
});

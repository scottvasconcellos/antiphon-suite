import { describe, expect, it, vi } from 'vitest';

import {
  ExpiredLicenseError,
  InvalidCredentialsError,
  NetworkError,
} from '../../domain/auth/AuthError';
import { License } from '../../domain/auth/License';
import { User } from '../../domain/auth/User';
import { AuthService } from '../auth/AuthService';
import type {
  AuthApiClient,
  LicenseStore,
  TokenStore,
  UserDTO,
} from '../auth/types';

/** Integration-like tests for AuthService with mocked dependencies. */
describe('AuthService', () => {
  it('authenticates user, loads licenses, and stores them', async () => {
    const userDto: UserDTO = {
      id: 'user-1',
      email: 'producer@antiphon.com',
      passwordHash: User.hashPassword('secret-pass'),
    };

    const apiClient = createApiClient({
      login: vi.fn(async () => ({ token: 'token-1', user: userDto })),
      fetchLicenses: vi.fn(async () => [
        {
          appId: 'melody-engine',
          userId: 'user-1',
          expiresAt: null,
          isActive: true,
        },
      ]),
    });

    const store = createLicenseStore();
    const service = new AuthService(store, apiClient);

    const user = await service.authenticate('producer@antiphon.com', 'secret-pass');

    expect(user).toBeInstanceOf(User);
    expect(user.hasLicense('melody-engine')).toBe(true);
    expect(apiClient.login).toHaveBeenCalledWith(
      'producer@antiphon.com',
      'secret-pass',
    );
    expect(apiClient.fetchLicenses).toHaveBeenCalledWith('user-1');
    expect(store.save).toHaveBeenCalledTimes(1);
  });

  it('propagates invalid credentials as domain error', async () => {
    const apiClient = createApiClient({
      login: vi.fn(async () => {
        throw new InvalidCredentialsError();
      }),
    });

    const service = new AuthService(createLicenseStore(), apiClient);

    await expect(service.authenticate('x@x.com', 'bad')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('converts generic failures to NetworkError', async () => {
    const apiClient = createApiClient({
      login: vi.fn(async () => {
        throw new Error('socket hang up');
      }),
    });

    const service = new AuthService(createLicenseStore(), apiClient);

    await expect(service.authenticate('x@x.com', 'bad')).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it('returns false when license does not exist', async () => {
    const store = createLicenseStore({
      load: vi.fn(async () => []),
    });

    const service = new AuthService(store, createApiClient());

    await expect(service.validateLicense('user-1', 'melody-engine')).resolves.toBe(
      false,
    );
  });

  it('throws ExpiredLicenseError for expired license', async () => {
    const store = createLicenseStore({
      load: vi.fn(async () => [
        new License({
          appId: 'melody-engine',
          userId: 'user-1',
          expiresAt: new Date('2025-01-01T00:00:00.000Z'),
          isActive: true,
        }),
      ]),
    });

    const service = new AuthService(store, createApiClient());

    await expect(
      service.validateLicense('user-1', 'melody-engine'),
    ).rejects.toBeInstanceOf(ExpiredLicenseError);
  });

  it('refreshes token through api client and token store', async () => {
    const tokenStore = createTokenStore();
    await tokenStore.setToken('old-token');

    const apiClient = createApiClient({
      refreshToken: vi.fn(async () => 'new-token'),
    });

    const service = new AuthService(createLicenseStore(), apiClient, tokenStore);
    await service.refreshToken();

    await expect(tokenStore.getToken()).resolves.toBe('new-token');
    expect(apiClient.refreshToken).toHaveBeenCalledWith('old-token');
  });
});

function createApiClient(
  overrides: Partial<AuthApiClient> = {},
): AuthApiClient & {
  login: ReturnType<typeof vi.fn>;
  fetchLicenses: ReturnType<typeof vi.fn>;
  refreshToken: ReturnType<typeof vi.fn>;
} {
  const client = {
    login: vi.fn(async () => ({
      token: 'token-1',
      user: {
        id: 'user-1',
        email: 'producer@antiphon.com',
        passwordHash: User.hashPassword('secret-pass'),
      },
    })),
    fetchLicenses: vi.fn(async () => []),
    refreshToken: vi.fn(async (token: string) => token),
    ...overrides,
  };

  return client as AuthApiClient & {
    login: ReturnType<typeof vi.fn>;
    fetchLicenses: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
  };
}

function createLicenseStore(
  overrides: Partial<LicenseStore> = {},
): LicenseStore & {
  save: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
} {
  const store = {
    save: vi.fn(async () => undefined),
    load: vi.fn(async () => []),
    delete: vi.fn(async () => undefined),
    ...overrides,
  };

  return store as LicenseStore & {
    save: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

function createTokenStore(
  seed: string | null = null,
): TokenStore & {
  setToken: ReturnType<typeof vi.fn>;
  getToken: ReturnType<typeof vi.fn>;
  clearToken: ReturnType<typeof vi.fn>;
} {
  let token = seed;

  const tokenStore = {
    setToken: vi.fn(async (nextToken: string) => {
      token = nextToken;
    }),
    getToken: vi.fn(async () => token),
    clearToken: vi.fn(async () => {
      token = null;
    }),
  };

  return tokenStore;
}

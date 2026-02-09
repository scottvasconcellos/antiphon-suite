import { InvalidCredentialsError, NetworkError } from '../../domain/auth/AuthError';
import type { AuthApiClient, LicenseDTO, UserDTO } from './types';

/**
 * HTTP implementation of AuthApiClient backed by fetch.
 */
export class HttpAuthApiClient implements AuthApiClient {
  private readonly baseUrl: string;

  /**
   * Creates a new API client.
   */
  public constructor(baseUrl = 'https://api.antiphon.com/auth') {
    this.baseUrl = baseUrl;
  }

  /**
   * Performs email/password authentication.
   */
  public async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: UserDTO }> {
    const response = await this.safeFetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 401) {
      throw new InvalidCredentialsError();
    }

    if (!response.ok) {
      throw new NetworkError('Authentication request failed.', {
        status: response.status,
      });
    }

    const payload = (await response.json()) as unknown;
    if (!isLoginPayload(payload)) {
      throw new NetworkError('Authentication response payload is invalid.');
    }

    return payload;
  }

  /**
   * Fetches all licenses for a user.
   */
  public async fetchLicenses(userId: string): Promise<LicenseDTO[]> {
    const response = await this.safeFetch(`${this.baseUrl}/licenses/${userId}`);

    if (!response.ok) {
      throw new NetworkError('License fetch request failed.', {
        status: response.status,
      });
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || !payload.every(isLicenseDTO)) {
      throw new NetworkError('License response payload is invalid.');
    }

    return payload;
  }

  /**
   * Exchanges the current session token for a fresh token.
   */
  public async refreshToken(token: string): Promise<string> {
    const response = await this.safeFetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new NetworkError('Token refresh request failed.', {
        status: response.status,
      });
    }

    const payload = (await response.json()) as unknown;
    if (!isRefreshPayload(payload)) {
      throw new NetworkError('Refresh token response payload is invalid.');
    }

    return payload.token;
  }

  private async safeFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      return await fetch(input, init);
    } catch (error) {
      throw new NetworkError('Unable to reach auth API.', {
        cause:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : String(error),
      });
    }
  }
}

function isUserDTO(value: unknown): value is UserDTO {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.passwordHash === 'string'
  );
}

function isLicenseDTO(value: unknown): value is LicenseDTO {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.appId === 'string' &&
    typeof value.userId === 'string' &&
    (typeof value.expiresAt === 'string' || value.expiresAt === null) &&
    typeof value.isActive === 'boolean'
  );
}

function isLoginPayload(
  value: unknown,
): value is { token: string; user: UserDTO } {
  if (!isObject(value)) {
    return false;
  }

  return typeof value.token === 'string' && isUserDTO(value.user);
}

function isRefreshPayload(value: unknown): value is { token: string } {
  return isObject(value) && typeof value.token === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

import {
  ExpiredLicenseError,
  InvalidCredentialsError,
  NetworkError,
} from '../../domain/auth/AuthError';
import { License } from '../../domain/auth/License';
import { User } from '../../domain/auth/User';
import { HttpAuthApiClient } from './AuthApiClient';
import { TauriLicenseStore } from './LicenseStore';
import type {
  AuthApiClient,
  LicenseDTO,
  LicenseStore,
  TokenStore,
} from './types';

/**
 * Coordinates authentication workflows between domain and infrastructure.
 */
export class AuthService {
  private readonly licenseStore: LicenseStore;
  private readonly authApiClient: AuthApiClient;
  private readonly tokenStore: TokenStore;

  /**
   * Creates a new service with explicit dependency injection.
   */
  public constructor(
    licenseStore: LicenseStore,
    authApiClient: AuthApiClient,
    tokenStore: TokenStore = new InMemoryTokenStore(),
  ) {
    this.licenseStore = licenseStore;
    this.authApiClient = authApiClient;
    this.tokenStore = tokenStore;
  }

  /**
   * Authenticates the user and persists licenses locally.
   */
  public async authenticate(email: string, password: string): Promise<User> {
    try {
      const { token, user: userDto } = await this.authApiClient.login(email, password);

      const user = new User({
        id: userDto.id,
        email: userDto.email,
        passwordHash: userDto.passwordHash,
        licenses: [],
      });

      if (!user.validate(password)) {
        throw new InvalidCredentialsError();
      }

      await this.tokenStore.setToken(token);

      const licenseDtos = await this.authApiClient.fetchLicenses(user.id);
      await this.persistLicenses(user, licenseDtos);

      return user;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Validates a specific app license for a user.
   */
  public async validateLicense(userId: string, appId: string): Promise<boolean> {
    try {
      const licenses = await this.licenseStore.load(userId);
      const candidate = licenses.find((license) => license.appId === appId);

      if (!candidate) {
        return false;
      }

      if (candidate.isExpired()) {
        throw new ExpiredLicenseError('License has expired for requested app.', {
          appId,
          userId,
        });
      }

      return candidate.isValid();
    } catch (error) {
      if (error instanceof ExpiredLicenseError) {
        throw error;
      }

      throw this.normalizeError(error);
    }
  }

  /**
   * Refreshes the active auth token.
   */
  public async refreshToken(): Promise<void> {
    const currentToken = await this.tokenStore.getToken();

    if (!currentToken) {
      throw new InvalidCredentialsError(
        'Cannot refresh token without an authenticated session.',
      );
    }

    if (!this.authApiClient.refreshToken) {
      throw new NetworkError('Auth API client does not support token refresh.');
    }

    try {
      const nextToken = await this.authApiClient.refreshToken(currentToken);
      await this.tokenStore.setToken(nextToken);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private async persistLicenses(user: User, licenseDtos: LicenseDTO[]): Promise<void> {
    for (const dto of licenseDtos) {
      const license = new License({
        appId: dto.appId,
        userId: dto.userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive,
      });

      user.addLicense(license);
      await this.licenseStore.save(license);
    }
  }

  private normalizeError(error: unknown): Error {
    if (
      error instanceof InvalidCredentialsError ||
      error instanceof ExpiredLicenseError ||
      error instanceof NetworkError
    ) {
      return error;
    }

    if (error instanceof Error) {
      return new NetworkError(error.message, {
        cause: { message: error.message, name: error.name },
      });
    }

    return new NetworkError('Unexpected authentication error.', {
      cause: String(error),
    });
  }
}

/**
 * Creates the default auth service using production infrastructure adapters.
 */
export function createAuthService(): AuthService {
  return new AuthService(new TauriLicenseStore(), new HttpAuthApiClient());
}

class InMemoryTokenStore implements TokenStore {
  private token: string | null = null;

  public async setToken(token: string): Promise<void> {
    this.token = token;
  }

  public async getToken(): Promise<string | null> {
    return this.token;
  }

  public async clearToken(): Promise<void> {
    this.token = null;
  }
}

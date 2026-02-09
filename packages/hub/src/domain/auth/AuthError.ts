import type { AuthErrorCode, AuthErrorMetadata } from './types';

/**
 * Base class for all authentication domain errors.
 */
export class AuthError extends Error {
  /** Stable machine-readable error code. */
  public readonly code: AuthErrorCode;

  /** Optional metadata for debugging and telemetry. */
  public readonly metadata?: AuthErrorMetadata;

  /**
   * Creates a typed domain auth error.
   */
  public constructor(
    message: string,
    code: AuthErrorCode,
    metadata?: AuthErrorMetadata,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
  }
}

/** Error for failed email/password authentication attempts. */
export class InvalidCredentialsError extends AuthError {
  public constructor(
    message = 'Invalid email or password.',
    metadata?: AuthErrorMetadata,
  ) {
    super(message, 'AUTH_INVALID_CREDENTIALS', metadata);
  }
}

/** Error for access attempts with expired licenses. */
export class ExpiredLicenseError extends AuthError {
  public constructor(
    message = 'License is expired.',
    metadata?: AuthErrorMetadata,
  ) {
    super(message, 'AUTH_LICENSE_EXPIRED', metadata);
  }
}

/** Error for network/API communication failures. */
export class NetworkError extends AuthError {
  public constructor(
    message = 'Network request failed.',
    metadata?: AuthErrorMetadata,
  ) {
    super(message, 'AUTH_NETWORK_ERROR', metadata);
  }
}

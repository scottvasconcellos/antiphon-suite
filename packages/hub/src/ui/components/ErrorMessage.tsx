import {
  ExpiredLicenseError,
  InvalidCredentialsError,
  NetworkError,
} from '../../domain/auth/AuthError';

/**
 * Props for rendering a human-readable auth error.
 */
export interface ErrorMessageProps {
  error: Error | null;
}

/**
 * Converts domain/infrastructure errors to user-facing text.
 */
export function ErrorMessage({ error }: ErrorMessageProps): JSX.Element | null {
  if (!error) {
    return null;
  }

  const message = getFriendlyMessage(error);

  return (
    <p role="alert" style={{ color: '#b91c1c' }}>
      {message}
    </p>
  );
}

function getFriendlyMessage(error: Error): string {
  if (error instanceof InvalidCredentialsError) {
    return 'Email or password is incorrect.';
  }

  if (error instanceof ExpiredLicenseError) {
    return 'Your license is expired. Please renew to continue.';
  }

  if (error instanceof NetworkError) {
    return 'We could not reach the server. Please try again.';
  }

  return error.message || 'Something went wrong.';
}

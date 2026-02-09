import { FormEvent, useRef, useState } from 'react';

import { User } from '../../domain/auth/User';
import { AuthService, createAuthService } from '../../services/auth/AuthService';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage } from './ErrorMessage';

/**
 * Public props for the login form.
 */
export interface LoginFormProps {
  onLogin: (user: User) => void;
  onError: (error: Error) => void;
  authService?: Pick<AuthService, 'authenticate'>;
}

/**
 * Pure presentation component for login data capture.
 */
export function LoginForm({
  onLogin,
  onError,
  authService,
}: LoginFormProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);

  const serviceRef = useRef<Pick<AuthService, 'authenticate'> | null>(
    authService ?? null,
  );

  const resolveService = (): Pick<AuthService, 'authenticate'> => {
    if (serviceRef.current) {
      return serviceRef.current;
    }

    serviceRef.current = createAuthService();
    return serviceRef.current;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setSubmissionError(null);

    try {
      const user = await resolveService().authenticate(email, password);
      onLogin(user);
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error('Unknown authentication error.');

      setSubmissionError(normalized);
      onError(normalized);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <ErrorMessage error={submissionError} />
      </form>
    </AuthLayout>
  );
}

/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { User } from '../../domain/auth/User';
import { LoginForm } from '../components/LoginForm';

/** UI tests for the pure presentational login form component. */
describe('LoginForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('submits credentials and emits onLogin with user', async () => {
    const user = new User({
      id: 'user-1',
      email: 'producer@antiphon.com',
      passwordHash: User.hashPassword('secret-pass'),
      licenses: [],
    });

    const authenticate = vi.fn(async () => user);
    const onLogin = vi.fn();
    const onError = vi.fn();

    render(
      <LoginForm
        authService={{ authenticate }}
        onLogin={onLogin}
        onError={onError}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'producer@antiphon.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-pass' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(user);
    });

    expect(onError).not.toHaveBeenCalled();
    expect(authenticate).toHaveBeenCalledWith('producer@antiphon.com', 'secret-pass');
  });

  it('shows loading state while submit is in progress', async () => {
    let resolveAuth: ((user: User) => void) | null = null;

    const authenticate = vi.fn(
      () =>
        new Promise<User>((resolve) => {
          resolveAuth = resolve;
        }),
    );

    const onLogin = vi.fn();

    render(
      <LoginForm
        authService={{ authenticate }}
        onLogin={onLogin}
        onError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'producer@antiphon.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-pass' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

    const button = screen.getByRole('button', { name: 'Signing in...' });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(true);

    resolveAuth?.(
      new User({
        id: 'user-1',
        email: 'producer@antiphon.com',
        passwordHash: User.hashPassword('secret-pass'),
        licenses: [],
      }),
    );

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('emits onError and renders message on failed submit', async () => {
    const authenticate = vi.fn(async () => {
      throw new Error('Authentication failed.');
    });

    const onError = vi.fn();

    render(
      <LoginForm
        authService={{ authenticate }}
        onLogin={vi.fn()}
        onError={onError}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'producer@antiphon.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-pass' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('alert').textContent).toContain(
      'Authentication failed.',
    );
  });
});

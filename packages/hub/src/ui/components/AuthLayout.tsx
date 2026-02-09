import type { ReactNode } from 'react';

/**
 * Layout wrapper for auth-facing screens.
 */
export interface AuthLayoutProps {
  title?: string;
  children: ReactNode;
}

/**
 * Basic presentational shell for auth forms.
 */
export function AuthLayout({
  title = 'Sign in to Antiphon Hub',
  children,
}: AuthLayoutProps): JSX.Element {
  return (
    <section
      aria-label="Authentication"
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '2rem',
        border: '1px solid #d4d4d8',
        borderRadius: 12,
      }}
    >
      <h1>{title}</h1>
      {children}
    </section>
  );
}

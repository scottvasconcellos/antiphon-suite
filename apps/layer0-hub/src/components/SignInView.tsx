import { useState, useCallback } from "react";
import { isFirebaseConfigured } from "../config/firebaseConfig";
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  createAccountWithEmail,
  getIdToken
} from "../services/firebaseAuth";
import { Button, Input, Card, CardHeader } from "@antiphon/design-system/components";

function GoogleIcon() {
  return (
    <span className="sign-in-provider-icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 6.168-2.18l-2.908-2.258c-.806.54-1.837.86-3.26.86-2.513 0-4.646-1.697-5.41-3.985H.957v2.332C2.438 15.983 5.482 18 9 18z" />
        <path fill="#FBBC05" d="M3.59 10.741c-.18-.54-.282-1.117-.282-1.695 0-.578.102-1.155.282-1.694V5.02H.957C.347 6.113 0 7.31 0 8.546c0 1.236.348 2.433.957 3.525l2.633-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 5.019L3.59 7.351C4.354 5.063 6.487 3.58 9 3.58z" />
      </svg>
    </span>
  );
}

function AppleIcon() {
  return (
    <span className="sign-in-provider-icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    </span>
  );
}

type SignInViewProps = {
  onSignInWithFirebase: (idToken: string) => Promise<void>;
  onSignInWithEmail: (email: string) => Promise<void>;
  engineReady: boolean;
};

export function SignInView({
  onSignInWithFirebase,
  onSignInWithEmail,
  engineReady
}: SignInViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = useCallback(async () => {
    if (!engineReady || busy) return;
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithGoogle();
      if (!cred) {
        setError("Firebase not configured.");
        return;
      }
      const token = await getIdToken(cred.user);
      await onSignInWithFirebase(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }, [engineReady, busy, onSignInWithFirebase]);

  const handleApple = useCallback(async () => {
    if (!engineReady || busy) return;
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithApple();
      if (!cred) {
        setError("Firebase not configured.");
        return;
      }
      const token = await getIdToken(cred.user);
      await onSignInWithFirebase(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apple sign-in failed.");
    } finally {
      setBusy(false);
    }
  }, [engineReady, busy, onSignInWithFirebase]);

  const handleEmailPassword = useCallback(async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (!engineReady || busy) return;
    setError(null);
    setBusy(true);
    try {
      const cred = isCreateAccount
        ? await createAccountWithEmail(e, password)
        : await signInWithEmail(e, password);
      if (!cred) {
        setError("Firebase not configured.");
        return;
      }
      const token = await getIdToken(cred.user);
      await onSignInWithFirebase(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email sign-in failed.");
    } finally {
      setBusy(false);
    }
  }, [email, password, isCreateAccount, engineReady, busy, onSignInWithFirebase]);

  const handleEmailOnlySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const val = email.trim().toLowerCase();
      if (!val || !val.includes("@")) {
        setError("Enter a valid email.");
        return;
      }
      if (!engineReady || busy) return;
      setError(null);
      setBusy(true);
      try {
        await onSignInWithEmail(val);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      } finally {
        setBusy(false);
      }
    },
    [email, engineReady, busy, onSignInWithEmail]
  );

  const useFirebase = isFirebaseConfigured();

  if (useFirebase) {
    return (
      <section aria-label="Sign in">
        <Card variant="raised" padding="default">
          <CardHeader title="Sign in" subtitle="Connect to your Antiphon account." />
          {error && (
            <p className="note-text error-message" role="alert">
              {error}
            </p>
          )}
          <div className="sign-in-email-block">
            <Input
              id="signin-email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              autoComplete="email"
              className="mb-2_5"
            />
            <Input
              id="signin-password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={busy}
              autoComplete={isCreateAccount ? "new-password" : "current-password"}
              className="mb-3"
            />
            <div className="button-row">
              <Button
                variant="primary"
                onClick={handleEmailPassword}
                disabled={!engineReady || busy}
              >
                {busy ? "Signing in…" : isCreateAccount ? "Create account" : "Sign in with email"}
              </Button>
            </div>
            <Button
              variant="link"
              onClick={() => setIsCreateAccount((v) => !v)}
              disabled={busy}
              className="sign-in-toggle-create"
            >
              {isCreateAccount ? "Already have an account? Sign in" : "Create an account"}
            </Button>
          </div>
          <div className="sign-in-divider">
            <span className="sign-in-divider-text">or sign in with</span>
          </div>
          <div className="sign-in-provider-buttons">
            <button
              type="button"
              className="sign-in-provider-btn"
              onClick={handleGoogle}
              disabled={!engineReady || busy}
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <button
              type="button"
              className="sign-in-provider-btn"
              onClick={handleApple}
              disabled={!engineReady || busy}
            >
              <AppleIcon />
              Sign in with Apple
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Sign in">
      <Card variant="raised" padding="default">
        <CardHeader title="Sign in" subtitle="Sign in with your email (stub or authority session)." />
        {error && (
          <p className="note-text error-message" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleEmailOnlySubmit}>
          <Input
            id="signin-email-only"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={busy}
            autoComplete="email"
            className="mb-2_5"
          />
          <div className="button-row">
            <Button type="submit" variant="primary" disabled={!engineReady || busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

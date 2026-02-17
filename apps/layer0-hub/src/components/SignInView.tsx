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

  const handleFirebaseSuccess = useCallback(
    async (idToken: string) => {
      setError(null);
      setBusy(true);
      try {
        await onSignInWithFirebase(idToken);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed.");
      } finally {
        setBusy(false);
      }
    },
    [onSignInWithFirebase]
  );

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
          <CardHeader title="Sign in" subtitle="Use Google, Apple, or email to connect to the entitlement authority." />
          {error && (
            <p className="note-text error-message" role="alert">
              {error}
            </p>
          )}
          <div className="button-row button-row-wrap">
            <Button
              variant="primary"
              onClick={handleGoogle}
              disabled={!engineReady || busy}
            >
              {busy ? "Signing in…" : "Sign in with Google"}
            </Button>
            <Button
              variant="primary"
              onClick={handleApple}
              disabled={!engineReady || busy}
            >
              {busy ? "Signing in…" : "Sign in with Apple"}
            </Button>
          </div>
          <div className="sign-in-divider">
            <Input
              id="signin-email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={busy}
              autoComplete="email"
              className="mb-2.5"
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
              className="p-1"
            >
              {isCreateAccount ? "Already have an account? Sign in" : "Create an account"}
            </Button>
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
            className="mb-2.5"
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

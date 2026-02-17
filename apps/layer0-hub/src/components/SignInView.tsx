import { useState, useCallback } from "react";
import { isFirebaseConfigured } from "../config/firebaseConfig";
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  createAccountWithEmail,
  getIdToken
} from "../services/firebaseAuth";

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
      <section className="section-card sign-in-section" aria-label="Sign in">
        <h2 className="section-header" style={{ margin: "0 0 12px" }}>
          Sign in
        </h2>
        <p className="note-text" style={{ marginBottom: 16 }}>
          Use Google, Apple, or email to connect to the entitlement authority.
        </p>
        {error && (
          <p className="note-text" style={{ color: "var(--color-text-danger)", marginBottom: 12 }} role="alert">
            {error}
          </p>
        )}
        <div className="button-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoogle}
            disabled={!engineReady || busy}
          >
            {busy ? "Signing in…" : "Sign in with Google"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApple}
            disabled={!engineReady || busy}
          >
            {busy ? "Signing in…" : "Sign in with Apple"}
          </button>
        </div>
        <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 16 }}>
          <label className="field-label" htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={busy}
            autoComplete="email"
            style={{ marginBottom: 10, marginTop: 4 }}
          />
          <label className="field-label" htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={busy}
            autoComplete={isCreateAccount ? "new-password" : "current-password"}
            style={{ marginBottom: 12, marginTop: 4 }}
          />
          <div className="button-row" style={{ gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEmailPassword}
              disabled={!engineReady || busy}
            >
              {busy ? "Signing in…" : isCreateAccount ? "Create account" : "Sign in with email"}
            </button>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "transparent", border: "none", color: "var(--color-text-link)", cursor: "pointer", padding: 4 }}
            onClick={() => setIsCreateAccount((v) => !v)}
            disabled={busy}
          >
            {isCreateAccount ? "Already have an account? Sign in" : "Create an account"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card sign-in-section" aria-label="Sign in">
      <h2 className="section-header" style={{ margin: "0 0 12px" }}>
        Sign in
      </h2>
      <p className="note-text" style={{ marginBottom: 12 }}>
        Sign in with your email (stub or authority session).
      </p>
      {error && (
        <p className="note-text" style={{ color: "var(--color-text-danger)", marginBottom: 12 }} role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleEmailOnlySubmit}>
        <label className="field-label" htmlFor="signin-email-only">
          Email
        </label>
        <input
          id="signin-email-only"
          type="email"
          className="text-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={busy}
          autoComplete="email"
          style={{ marginBottom: 10, marginTop: 4 }}
        />
        <div className="button-row">
          <button type="submit" className="btn btn-primary" disabled={!engineReady || busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </section>
  );
}

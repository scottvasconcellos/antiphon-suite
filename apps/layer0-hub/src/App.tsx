import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { type HubState, type HubSession } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { AppCatalog } from "./components/AppCatalog";

const SignInView = lazy(() => import("./components/SignInView").then((m) => ({ default: m.SignInView })));
const SettingsView = lazy(() => import("./components/SettingsView").then((m) => ({ default: m.SettingsView })));
const LicensesView = lazy(() => import("./components/LicensesView").then((m) => ({ default: m.LicensesView })));
const SupportView = lazy(() => import("./components/SupportView").then((m) => ({ default: m.SupportView })));
const AddSerialView = lazy(() => import("./components/AddSerialView").then((m) => ({ default: m.AddSerialView })));

const built = buildHubEngine();

type View = "library" | "licenses-keys" | "support" | "preferences";

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);
  const [view, setView] = useState<View>("library");
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (!built.engine) return;
    void built.engine.bootstrap().then(setHubState);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electron) {
      document.body.classList.add("electron-window", `electron-${window.electron.platform}`);
      setIsElectron(true);
      return () => {
        document.body.classList.remove("electron-window", `electron-${window.electron?.platform ?? ""}`);
      };
    }
  }, []);

  const handleSignInWithFirebase = useCallback(async (idToken: string) => {
    if (!built.engine) return;
    const next = await built.engine.signInWithFirebase(idToken);
    setHubState(next);
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string) => {
    if (!built.engine) return;
    const next = await built.engine.signIn(email);
    setHubState(next);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!built.engine) return;
    const next = await built.engine.signOut();
    setHubState(next);
  }, []);

  const handleSessionUpdate = useCallback((updated: HubSession) => {
    setHubState((prev) => ({
      ...prev,
      snapshot: {
        ...prev.snapshot,
        session: updated
      }
    }));
  }, []);

  const handleInstall = useCallback(async (appId: string) => {
    if (!built.engine) return;
    setBusyAppId(appId);
    try {
      const next = await built.engine.installApp(appId);
      setHubState(next);
    } finally {
      setBusyAppId(null);
    }
  }, []);

  const handleUpdate = useCallback(async (appId: string) => {
    if (!built.engine) return;
    setBusyAppId(appId);
    try {
      const next = await built.engine.applyUpdate(appId);
      setHubState(next);
    } finally {
      setBusyAppId(null);
    }
  }, []);

  const handleLaunch = useCallback(
    async (appId: string) => {
      if (!built.engine) return;
      try {
        const token = await built.engine.getLaunchToken(appId);
        if (!token) {
          alert("Failed to get launch token. Make sure the app is installed and you are signed in.");
          return;
        }
        try {
          await navigator.clipboard.writeText(token);
          const app = hubState.snapshot.entitlements.find((a) => a.id === appId);
          const appName = app?.name || appId;
          alert(`Launch token copied to clipboard for ${appName}.\n\nToken: ${token.substring(0, 50)}...`);
        } catch {
          alert(`Launch token for ${appId}:\n\n${token}`);
        }
      } catch (error) {
        console.error("Launch failed:", error);
        alert("Failed to generate launch token.");
      }
    },
    [hubState]
  );

  const handleRedeemSerial = useCallback(
    async (serial: string) => {
      if (!built.engine) return { success: false as const, reason: "Engine not ready" };
      try {
        const result = await built.engine.redeemSerial(serial);
        if (result.success) {
          // Refresh entitlements to show the new license
          const refreshed = await built.engine.refreshEntitlements();
          setHubState(refreshed);
        }
        return result;
      } catch (error) {
        return { success: false as const, reason: error instanceof Error ? error.message : "Redeem failed" };
      }
    },
    []
  );

  const engineReady = built.engine !== null && hubState.status.mode === "ready";
  const session = hubState.snapshot.session;

  return (
    <div className="hub-shell">
      {/* Topbar per design principles: logo left, nav, pill, actions */}
      <header className="hub-topbar">
        {isElectron && window.electron?.platform === "win32" && (
          <div className="hub-win-controls" aria-hidden="true">
            <button type="button" className="hub-win-btn hub-win-minimize" onClick={() => window.electron?.minimize()} aria-label="Minimize" />
            <button type="button" className="hub-win-btn hub-win-maximize" onClick={() => window.electron?.maximize()} aria-label="Maximize" />
            <button type="button" className="hub-win-btn hub-win-close" onClick={() => window.electron?.close()} aria-label="Close" />
          </div>
        )}
        <button
          type="button"
          className="hub-brand"
          onClick={() => setView("library")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <img src="/brand/logo-mark.png" alt="" className="hub-logo" aria-hidden="true" />
          <span className="hub-wordmark">ANTIPHON MANAGER</span>
        </button>
        <nav className="hub-nav">
          {session && (
            <>
              <button
                type="button"
                className={`hub-nav-link ${view === "library" ? "hub-nav-link-active" : ""}`}
                onClick={() => setView("library")}
                aria-current={view === "library" ? "page" : undefined}
              >
                Library
              </button>
              <button
                type="button"
                className={`hub-nav-link ${view === "licenses-keys" ? "hub-nav-link-active" : ""}`}
                onClick={() => setView("licenses-keys")}
                aria-current={view === "licenses-keys" ? "page" : undefined}
              >
                Licenses & Keys
              </button>
            </>
          )}
          <button
            type="button"
            className={`hub-nav-link ${view === "support" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("support")}
            aria-current={view === "support" ? "page" : undefined}
          >
            Support
          </button>
          <button
            type="button"
            className={`hub-nav-link ${view === "preferences" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("preferences")}
            aria-current={view === "preferences" ? "page" : undefined}
          >
            Preferences
          </button>
        </nav>
        <div className="hub-topbar-right">
          <a
            href={import.meta.env.VITE_SHOP_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-link-button"
          >
            Go to Shop
          </a>
        </div>
      </header>

      <main className="hub-main">
        <Suspense fallback={<div className="hub-section" aria-busy="true">Loading…</div>}>
        {!session ? (
          view === "library" ? (
            <section className="hub-section hub-signin-wrapper" aria-label="Sign in">
              <div className="hub-signin">
                <SignInView
                  onSignInWithFirebase={handleSignInWithFirebase}
                  onSignInWithEmail={handleSignInWithEmail}
                  engineReady={engineReady}
                />
              </div>
            </section>
          ) : view === "preferences" ? (
            <section className="hub-section" aria-label="Preferences">
              <h2 className="section-title">Preferences</h2>
              <SettingsView session={null} onSignOut={handleSignOut} onSessionUpdate={handleSessionUpdate} />
            </section>
          ) : view === "support" ? (
            <section className="hub-section" aria-label="Support">
              <SupportView />
            </section>
          ) : view === "licenses-keys" ? (
            <section className="hub-section" aria-label="Licenses and keys">
              <AddSerialView onRedeem={handleRedeemSerial} engineReady={engineReady} />
              <LicensesView entitlements={hubState.snapshot.entitlements} session={null} />
            </section>
          ) : (
            <section className="hub-section hub-signin-wrapper" aria-label="Sign in">
              <div className="hub-signin">
                <SignInView
                  onSignInWithFirebase={handleSignInWithFirebase}
                  onSignInWithEmail={handleSignInWithEmail}
                  engineReady={engineReady}
                />
              </div>
            </section>
          )
        ) : view === "library" ? (
          <section className="hub-section" aria-label="Library">
            <AppCatalog
              entitlements={hubState.snapshot.entitlements}
              onInstall={handleInstall}
              onUpdate={handleUpdate}
              onLaunch={handleLaunch}
              engineReady={engineReady}
              busyAppId={busyAppId}
            />
          </section>
        ) : view === "licenses-keys" ? (
          <section className="hub-section" aria-label="Licenses and keys">
            <AddSerialView onRedeem={handleRedeemSerial} engineReady={engineReady} />
            <LicensesView entitlements={hubState.snapshot.entitlements} session={session} />
          </section>
        ) : view === "support" ? (
          <section className="hub-section" aria-label="Support">
            <SupportView />
          </section>
        ) : (
          <section className="hub-section" aria-label="Preferences">
            <h2 className="section-title">Preferences</h2>
            <SettingsView session={session} onSignOut={handleSignOut} onSessionUpdate={handleSessionUpdate} />
          </section>
        )}
        </Suspense>

        {/* Footer: Antiphon Studios branding, social, newsletter */}
        <footer className="hub-footer hub-footer-branding">
          <div className="hub-footer-content">
            <div className="hub-footer-brand">
              <img src="/brand/logo-mark.png" alt="" className="hub-logo hub-logo-small" aria-hidden="true" />
              <span>Antiphon Studios</span>
            </div>
            <div className="hub-footer-social">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hub-social-icon" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hub-social-icon" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hub-social-icon" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.766 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hub-social-icon" aria-label="X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="hub-social-icon" aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </a>
            </div>
            <div className="hub-footer-newsletter">
              <label htmlFor="newsletter-email" className="hub-newsletter-label">
                Get updates on new products and news
              </label>
              <form className="hub-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@example.com"
                  className="hub-newsletter-input"
                  aria-label="Email for newsletter"
                />
                <button type="submit" className="hub-newsletter-btn">
                  Subscribe
                </button>
              </form>
            </div>
            <div className="hub-footer-donate">
              <p className="hub-donate-note">A solo developer building tools for musicians. Your purchase is greatly appreciated. If you're interested, consider donating towards coffee or new strings. 🤍</p>
              <div className="hub-donate-links">
                <a href="https://venmo.com/u/Scott-Vasconcellos" target="_blank" rel="noopener noreferrer" className="hub-donate-link">Venmo</a>
                <span className="hub-donate-separator">•</span>
                <a href="https://cash.app/$scottvasconcellos" target="_blank" rel="noopener noreferrer" className="hub-donate-link">Cash App</a>
              </div>
            </div>
            <p className="hub-footer-legal">
              © {new Date().getFullYear()} Antiphon Studios. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { type HubState } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { AppCatalog } from "./components/AppCatalog";
import { SignInView } from "./components/SignInView";
import { SettingsView } from "./components/SettingsView";
import { LicensesView } from "./components/LicensesView";
import { SupportView } from "./components/SupportView";
import { AddSerialView } from "./components/AddSerialView";
import { UpdatesView } from "./components/UpdatesView";

const built = buildHubEngine();

type View = "library" | "updates" | "licenses" | "add-serial" | "support" | "preferences";

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);
  const [view, setView] = useState<View>("library");
  useEffect(() => {
    if (!built.engine) return;
    void built.engine.bootstrap().then(setHubState);
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

  const engineReady = built.engine !== null && hubState.status.mode === "ready";
  const session = hubState.snapshot.session;

  return (
    <div className="hub-shell">
      {/* Topbar per design principles: logo left, nav, pill, actions */}
      <header className="hub-topbar">
        <div className="hub-brand">
          {/* Logo: add public/logo.svg or public/logo.png and use <img src="/logo.svg" alt="Antiphon" className="hub-logo" /> instead of the fallback (see docs/DESIGN_PRINCIPLES.md). */}
          <div className="hub-logo-fallback" aria-hidden="true" />
          <span className="hub-wordmark">ANTIPHON MANAGER</span>
        </div>
        <nav className="hub-nav">
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
            className={`hub-nav-link ${view === "updates" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("updates")}
            aria-current={view === "updates" ? "page" : undefined}
          >
            Updates
          </button>
          <button
            type="button"
            className={`hub-nav-link ${view === "licenses" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("licenses")}
            aria-current={view === "licenses" ? "page" : undefined}
          >
            Licenses
          </button>
          <button
            type="button"
            className={`hub-nav-link ${view === "add-serial" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("add-serial")}
            aria-current={view === "add-serial" ? "page" : undefined}
          >
            Add Serial
          </button>
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
              <SettingsView session={null} onSignOut={handleSignOut} />
              <p className="note-text settings-signin-cta">
                Sign in to see account, licenses, and billing.
              </p>
            </section>
          ) : view === "support" ? (
            <section className="hub-section" aria-label="Support">
              <SupportView />
            </section>
          ) : view === "add-serial" ? (
            <section className="hub-section" aria-label="Add Serial">
              <AddSerialView />
            </section>
          ) : view === "licenses" ? (
            <section className="hub-section" aria-label="Licenses">
              <LicensesView entitlements={hubState.snapshot.entitlements} session={null} />
            </section>
          ) : view === "updates" ? (
            <section className="hub-section" aria-label="Updates">
              <UpdatesView
                entitlements={hubState.snapshot.entitlements}
                onUpdate={handleUpdate}
                engineReady={engineReady}
                busyAppId={busyAppId}
              />
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
        ) : view === "updates" ? (
          <section className="hub-section" aria-label="Updates">
            <UpdatesView
              entitlements={hubState.snapshot.entitlements}
              onUpdate={handleUpdate}
              engineReady={engineReady}
              busyAppId={busyAppId}
            />
          </section>
        ) : view === "licenses" ? (
          <section className="hub-section" aria-label="Licenses">
            <LicensesView entitlements={hubState.snapshot.entitlements} session={session} />
          </section>
        ) : view === "add-serial" ? (
          <section className="hub-section" aria-label="Add Serial">
            <AddSerialView />
          </section>
        ) : view === "support" ? (
          <section className="hub-section" aria-label="Support">
            <SupportView />
          </section>
        ) : (
          <section className="hub-section" aria-label="Preferences">
            <h2 className="section-title">Preferences</h2>
            <SettingsView session={session} onSignOut={handleSignOut} />
          </section>
        )}

        {/* Footer: Antiphon Studios branding — no internal status shown to users */}
        <footer className="hub-footer hub-footer-branding">
          <div className="hub-footer-content">
            <div className="hub-footer-brand">
              <div className="hub-logo-fallback hub-logo-small" aria-hidden="true" />
              <span>Antiphon Studios</span>
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

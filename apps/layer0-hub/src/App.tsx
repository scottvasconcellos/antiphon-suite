import { useCallback, useEffect, useState } from "react";
import { type HubState } from "./domain/types";
import { buildHubEngine } from "./services/buildHubEngine";
import { toControlPlaneUiContract } from "./services/controlPlaneUiContract";
import { toHubViewModel } from "./services/hubViewModel";
import { toControlPlaneViewModel } from "./services/controlPlaneViewModel";
import { toControlPlaneOperations } from "./services/controlPlaneOperationsViewModel";
import { AppCatalog } from "./components/AppCatalog";
import { SignInView } from "./components/SignInView";
import { SettingsView } from "./components/SettingsView";
import { LicensesView } from "./components/LicensesView";
import { Button } from "@antiphon/design-system/components";

const built = buildHubEngine();

type View = "apps" | "licenses" | "settings";

export default function App() {
  const [hubState, setHubState] = useState<HubState>(built.initialState);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);
  const [view, setView] = useState<View>("apps");
  const [statusCollapsed, setStatusCollapsed] = useState(true);

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

  const uiContract = toControlPlaneUiContract(
    toHubViewModel(hubState),
    toControlPlaneViewModel(hubState),
    toControlPlaneOperations(hubState.snapshot)
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
          <span className="hub-wordmark">ANTIPHON HUB</span>
        </div>
        <nav className="hub-nav">
          <button
            type="button"
            className={`hub-nav-link ${view === "apps" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("apps")}
            aria-current={view === "apps" ? "page" : undefined}
          >
            Apps
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
            className={`hub-nav-link ${view === "settings" ? "hub-nav-link-active" : ""}`}
            onClick={() => setView("settings")}
            aria-current={view === "settings" ? "page" : undefined}
          >
            Settings
          </button>
        </nav>
        <div className="hub-topbar-right">
          <span className="hub-pill hub-pill-beta">Beta</span>
          <span className="hub-pill">{hubState.status.mode === "ready" ? "Connected" : hubState.status.code}</span>
          {session && (
            <Button variant="secondary" size="compact" onClick={handleSignOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      <main className="hub-main">
        {!session ? (
          view === "settings" ? (
            <section className="hub-section" aria-label="Settings">
              <h2 className="section-title">Settings</h2>
              <SettingsView session={null} />
              <p className="note-text settings-signin-cta">
                Sign in to see account, licenses, and billing.
              </p>
            </section>
          ) : view === "licenses" ? (
            <section className="hub-section" aria-label="Licenses">
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
        ) : view === "apps" ? (
          <section className="hub-section" aria-label="App catalog">
            <AppCatalog
              entitlements={hubState.snapshot.entitlements}
              onInstall={handleInstall}
              onUpdate={handleUpdate}
              onLaunch={handleLaunch}
              engineReady={engineReady}
              busyAppId={busyAppId}
            />
          </section>
        ) : view === "licenses" ? (
          <section className="hub-section" aria-label="Licenses">
            <LicensesView entitlements={hubState.snapshot.entitlements} session={session} />
          </section>
        ) : (
          <section className="hub-section" aria-label="Settings">
            <h2 className="section-title">Settings</h2>
            <SettingsView session={session} />
          </section>
        )}

        {/* Collapsible status footer — minimal by default */}
        <footer className="hub-footer">
          <button
            type="button"
            className="hub-footer-toggle"
            onClick={() => setStatusCollapsed((v) => !v)}
            aria-expanded={!statusCollapsed}
          >
            {statusCollapsed ? "Show status" : "Hide status"}
          </button>
          {!statusCollapsed && (
            <div className="hub-status-lines">
              <p>{uiContract.cacheLine}</p>
              <p>{uiContract.identityLine}</p>
              <p>{uiContract.entitlementLine}</p>
              <p>{uiContract.statusLine}</p>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}

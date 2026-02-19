import { useMemo, useCallback } from "react";
import { Card, CardHeader, Button } from "@antiphon/design-system/components";
import type { EntitledApp } from "../domain/types";

type HomeViewProps = {
  entitlements: EntitledApp[];
  onNavigate: (view: string) => void;
};

export function HomeView({ entitlements, onNavigate }: HomeViewProps) {
  const { owned, installed, updateAvailable } = useMemo(() => {
    const owned = entitlements.filter((app) => app.owned);
    const installed = owned.filter((app) => app.installedVersion != null);
    const updateAvailable = owned.filter((app) => app.updateAvailable);
    return { owned, installed, updateAvailable };
  }, [entitlements]);

  const handleNavigateLibrary = useCallback(() => onNavigate("library"), [onNavigate]);
  const handleNavigateUpdates = useCallback(() => onNavigate("updates"), [onNavigate]);
  const handleNavigateLicenses = useCallback(() => onNavigate("licenses-keys"), [onNavigate]);
  const handleNavigateSupport = useCallback(() => onNavigate("support"), [onNavigate]);

  return (
    <div className="home-view">
      <section className="home-hero">
        <h1 className="home-hero-title">Welcome to Antiphon Manager</h1>
        <p className="home-hero-subtitle">
          Your central hub for managing Antiphon Studio products. Install, update, and launch your apps from one place.
        </p>
      </section>

      <div className="home-discover-bar">
        <input
          type="search"
          placeholder="Discover apps…"
          className="home-discover-input"
          aria-label="Search apps"
        />
      </div>

      <div className="home-sections">
        {installed.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Your Installed Apps</h2>
              <Button variant="secondary" size="compact" onClick={handleNavigateLibrary}>
                See all
              </Button>
            </div>
            <div className="home-app-grid">
              {installed.slice(0, 4).map((app) => (
                <Card key={app.id} variant="raised" padding="default" className="home-app-card">
                  <div className="home-app-card-content">
                    <h3 className="home-app-card-title">{app.name}</h3>
                    <p className="home-app-card-status">Installed</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {updateAvailable.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Updates Available</h2>
              <Button variant="secondary" size="compact" onClick={handleNavigateUpdates}>
                See all
              </Button>
            </div>
            <div className="home-app-grid">
              {updateAvailable.slice(0, 4).map((app) => (
                <Card key={app.id} variant="raised" padding="default" className="home-app-card">
                  <div className="home-app-card-content">
                    <h3 className="home-app-card-title">{app.name}</h3>
                    <p className="home-app-card-status update">Update available</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Licenses & Keys</h2>
            <Button variant="secondary" size="compact" onClick={handleNavigateLicenses}>
              Manage
            </Button>
          </div>
          <Card variant="raised" padding="default">
            <CardHeader
              title={`${owned.length} owned`}
              subtitle={owned.length === 0 ? "No licenses yet. Visit the shop to get started." : "Manage your serial numbers and licenses."}
            />
          </Card>
        </section>

        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Support</h2>
            <Button variant="secondary" size="compact" onClick={handleNavigateSupport}>
              Get help
            </Button>
          </div>
          <Card variant="raised" padding="default">
            <CardHeader
              title="Need assistance?"
              subtitle="Find documentation, contact support, or report issues."
            />
          </Card>
        </section>
      </div>
    </div>
  );
}

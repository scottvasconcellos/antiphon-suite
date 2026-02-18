import { useState, useCallback } from "react";
import type { EntitledApp } from "../domain/types";
import { Card, CardHeader, Button } from "@antiphon/design-system/components";
import { APP_METADATA, CATEGORY_LABELS, type AppCategory } from "../data/appMetadata";

type AppCatalogProps = {
  entitlements: EntitledApp[];
  onInstall: (appId: string) => void;
  onUpdate: (appId: string) => void;
  onLaunch: (appId: string) => void;
  engineReady: boolean;
  busyAppId: string | null;
};

export function AppCatalog({ entitlements, onInstall, onUpdate, onLaunch, engineReady, busyAppId }: AppCatalogProps) {
  const owned = entitlements.filter((app) => app.owned);
  if (owned.length === 0) {
    return (
      <Card variant="raised" padding="default">
        <CardHeader title="Your apps" subtitle="Owned apps. Sign in to see and manage." />
        <p className="note-text">No owned apps.</p>
      </Card>
    );
  }

  const byCategory = groupByCategory(owned);

  return (
    <div className="app-catalog">
      <h2 className="section-title">Your apps</h2>
      <p className="section-subtitle">{owned.length} owned · Install, update, or launch from the cards below.</p>
      <div className="app-catalog-sections">
        {(Object.keys(byCategory) as AppCategory[]).map((category) => (
          <section key={category} className="app-catalog-section">
            <h3 className="category-label">{CATEGORY_LABELS[category]}</h3>
            <div className="app-card-grid">
              {byCategory[category].map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onInstall={onInstall}
                  onUpdate={onUpdate}
                  onLaunch={onLaunch}
                  engineReady={engineReady}
                  busy={busyAppId === app.id}
                  anyBusy={busyAppId !== null}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function groupByCategory(apps: EntitledApp[]): Record<AppCategory, EntitledApp[]> {
  const order: AppCategory[] = ["effects", "instruments", "layer-apps", "utilities"];
  const map: Record<string, EntitledApp[]> = {};
  for (const app of apps) {
    const meta = APP_METADATA[app.id];
    const cat = meta?.category ?? "layer-apps";
    (map[cat] ??= []).push(app);
  }
  for (const cat of order) {
    map[cat] ??= [];
  }
  return map as Record<AppCategory, EntitledApp[]>;
}

type AppCardProps = {
  app: EntitledApp;
  onInstall: (appId: string) => void;
  onUpdate: (appId: string) => void;
  onLaunch: (appId: string) => void;
  engineReady: boolean;
  busy: boolean;
  anyBusy: boolean;
};

function AppCard({ app, onInstall, onUpdate, onLaunch, engineReady, busy, anyBusy }: AppCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = APP_METADATA[app.id] ?? {
    id: app.id,
    name: app.name,
    tagline: "",
    description: "",
    category: "layer-apps" as AppCategory,
    useCases: [],
  };

  const canInstall = app.owned && !app.installedVersion && app.installState !== "installing";
  const canUpdate = app.owned && app.installedVersion != null && app.updateAvailable && app.installState !== "installing";
  const canLaunch = app.owned && app.installedVersion != null && app.installState === "installed";
  const disabled = !engineReady || anyBusy;

  const badge = canUpdate
    ? "update-available"
    : canLaunch
      ? "installed"
      : canInstall
        ? "not-installed"
        : app.installedVersion
          ? "up-to-date"
          : "not-installed";

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  return (
    <div
      className={`app-card-wrapper ${expanded ? "app-card-expanded" : ""}`}
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleExpand())}
      aria-expanded={expanded}
    >
    <Card variant="raised" padding="default" className="app-card">
      <div className="app-card-main">
        <div className="app-card-art">
          {meta.iconPath ? (
            <img src={meta.iconPath} alt="" className="app-card-icon" />
          ) : (
            <div className="app-card-icon-fallback" aria-hidden="true" />
          )}
        </div>
        <div className="app-card-info">
          <div className="app-card-header">
            <h3 className="app-card-title">{app.name}</h3>
            <span className={`app-badge app-badge-${badge}`}>{badgeText(badge)}</span>
          </div>
          {meta.tagline ? <p className="app-card-tagline">{meta.tagline}</p> : null}
          <p className="app-card-desc">{meta.description || `Version ${app.version}.`}</p>
        </div>
        <div className="app-card-chevron" aria-hidden="true">
          {expanded ? "−" : "+"}
        </div>
      </div>

      {expanded && (
        <div className="app-card-details">
          {meta.useCases.length > 0 && (
            <div className="app-card-use-cases">
              <span className="hardware-label">Use cases</span>
              <ul>
                {meta.useCases.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          {meta.videoUrl && (
            <a href={meta.videoUrl} target="_blank" rel="noopener noreferrer" className="app-card-link" onClick={(e) => e.stopPropagation()}>
              Learn more →
            </a>
          )}
          <div className="app-card-actions" onClick={(e) => e.stopPropagation()}>
            {canInstall && (
              <Button variant="primary" size="compact" onClick={() => onInstall(app.id)} disabled={disabled}>
                {busy ? "Installing…" : "Install"}
              </Button>
            )}
            {canUpdate && (
              <Button variant="primary" size="compact" onClick={() => onUpdate(app.id)} disabled={disabled}>
                {busy ? "Updating…" : "Update"}
              </Button>
            )}
            {canLaunch && (
              <Button variant="primary" size="compact" onClick={() => onLaunch(app.id)} disabled={disabled}>
                Launch
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
    </div>
  );
}

function badgeText(badge: string): string {
  switch (badge) {
    case "update-available":
      return "Update available";
    case "installed":
      return "Installed";
    case "up-to-date":
      return "Up to date";
    default:
      return "Not installed";
  }
}

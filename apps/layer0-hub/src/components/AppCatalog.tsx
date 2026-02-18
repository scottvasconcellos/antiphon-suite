import { useState, useCallback, useMemo } from "react";
import type { EntitledApp } from "../domain/types";
import { Card, CardHeader, Button } from "@antiphon/design-system/components";
import { APP_METADATA, CATEGORY_LABELS, type AppCategory } from "../data/appMetadata";

type FilterType = "all" | "installed" | "not-installed" | "update-available";
type ViewMode = "tile" | "list";

type AppCatalogProps = {
  entitlements: EntitledApp[];
  onInstall: (appId: string) => void;
  onUpdate: (appId: string) => void;
  onLaunch: (appId: string) => void;
  engineReady: boolean;
  busyAppId: string | null;
};

const SHOP_URL = import.meta.env.VITE_SHOP_URL || "#";

function filterApps(apps: EntitledApp[], filter: FilterType): EntitledApp[] {
  switch (filter) {
    case "installed":
      return apps.filter((a) => a.installedVersion != null);
    case "not-installed":
      return apps.filter((a) => a.owned && !a.installedVersion);
    case "update-available":
      return apps.filter((a) => a.updateAvailable);
    default:
      return apps;
  }
}

function matchesSearch(app: EntitledApp, q: string): boolean {
  const meta = APP_METADATA[app.id];
  const text = [app.name, app.id, meta?.tagline ?? "", meta?.description ?? ""].join(" ").toLowerCase();
  return text.includes(q.toLowerCase());
}

export function AppCatalog({ entitlements, onInstall, onUpdate, onLaunch, engineReady, busyAppId }: AppCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("tile");
  const [search, setSearch] = useState("");

  const owned = entitlements.filter((app) => app.owned);
  const unowned = entitlements.filter((app) => !app.owned);

  const filteredOwned = useMemo(() => {
    let list = filterApps(owned, filter);
    if (search.trim()) list = list.filter((app) => matchesSearch(app, search.trim()));
    return list;
  }, [owned, filter, search]);

  const filteredUnowned = useMemo(() => {
    if (!search.trim()) return unowned;
    return unowned.filter((app) => matchesSearch(app, search.trim()));
  }, [unowned, search]);

  return (
    <div className="app-catalog">
      <h2 className="section-title">Library</h2>
      <p className="section-subtitle">
        {owned.length} owned · Install, update, or launch from the cards below.
      </p>

      <div className="library-toolbar">
        <input
          type="search"
          placeholder="Search apps…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="library-search"
          aria-label="Search apps"
        />
        <div className="library-filters">
          {(["all", "installed", "not-installed", "update-available"] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`library-filter-btn ${filter === f ? "library-filter-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "installed" ? "Installed" : f === "not-installed" ? "Not installed" : "Update available"}
            </button>
          ))}
        </div>
        <div className="library-view-toggle">
          <button
            type="button"
            className={`library-view-btn ${viewMode === "tile" ? "library-view-active" : ""}`}
            onClick={() => setViewMode("tile")}
            aria-pressed={viewMode === "tile"}
            title="Tile view"
          >
            ▦
          </button>
          <button
            type="button"
            className={`library-view-btn ${viewMode === "list" ? "library-view-active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            title="List view"
          >
            ≡
          </button>
        </div>
      </div>

      {filteredOwned.length === 0 ? (
        <Card variant="raised" padding="default">
          <CardHeader title="Your apps" subtitle="Owned apps. Sign in to see and manage." />
          <p className="note-text">No apps match the current filter.</p>
        </Card>
      ) : (
        <div className="app-catalog-sections">
          <section className="app-catalog-section">
            <h3 className="category-label">Your apps</h3>
            <div className={viewMode === "tile" ? "app-card-grid" : "app-card-list"}>
              {filteredOwned.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onInstall={onInstall}
                  onUpdate={onUpdate}
                  onLaunch={onLaunch}
                  engineReady={engineReady}
                  busy={busyAppId === app.id}
                  anyBusy={busyAppId !== null}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {filteredUnowned.length > 0 && (
        <section className="app-catalog-section more-by-antiphon">
          <h3 className="category-label">More by Antiphon Studios</h3>
          <p className="section-subtitle">Products you don't own yet. Get them from our shop.</p>
          <div className={viewMode === "tile" ? "app-card-grid" : "app-card-list"}>
            {filteredUnowned.map((app) => (
              <MoreByAntiphonCard key={app.id} app={app} viewMode={viewMode} />
            ))}
          </div>
        </section>
      )}
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

function MoreByAntiphonCard({ app, viewMode }: { app: EntitledApp; viewMode: ViewMode }) {
  const meta = APP_METADATA[app.id] ?? { tagline: "", description: "", iconPath: undefined };
  return (
    <Card variant="raised" padding="default" className={`app-card app-card-compact ${viewMode}`}>
      <div className="app-card-main">
        <div className="app-card-art">
          {meta.iconPath ? (
            <img src={meta.iconPath} alt="" className="app-card-icon" />
          ) : (
            <div className="app-card-icon-fallback" aria-hidden="true" />
          )}
        </div>
        <div className="app-card-info">
          <h3 className="app-card-title">{app.name}</h3>
          {meta.tagline ? <p className="app-card-tagline">{meta.tagline}</p> : null}
        </div>
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="hub-link-button">
          Get
        </a>
      </div>
    </Card>
  );
}

type AppCardProps = {
  app: EntitledApp;
  onInstall: (appId: string) => void;
  onUpdate: (appId: string) => void;
  onLaunch: (appId: string) => void;
  engineReady: boolean;
  busy: boolean;
  anyBusy: boolean;
  viewMode: ViewMode;
};

function AppCard({ app, onInstall, onUpdate, onLaunch, engineReady, busy, anyBusy, viewMode }: AppCardProps) {
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
      className={`app-card-wrapper ${viewMode} ${expanded ? "app-card-expanded" : ""}`}
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

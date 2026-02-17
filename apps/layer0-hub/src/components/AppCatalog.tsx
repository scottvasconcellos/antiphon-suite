import { type EntitledApp } from "../domain/types";
import { SectionCard } from "./SectionCard";

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
      <SectionCard title="Your apps" subtitle="Owned apps. Sign in to see and manage.">
        <p className="note-text">No owned apps.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Your apps"
      subtitle={`${owned.length} owned · Install or update via buttons below.`}
    >
      <div className="entitlement-list">
        {owned.map((app) => (
          <AppCatalogItem
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
    </SectionCard>
  );
}

type AppCatalogItemProps = {
  app: EntitledApp;
  onInstall: (appId: string) => void;
  onUpdate: (appId: string) => void;
  onLaunch: (appId: string) => void;
  engineReady: boolean;
  busy: boolean;
  anyBusy: boolean;
};

function AppCatalogItem({ app, onInstall, onUpdate, onLaunch, engineReady, busy, anyBusy }: AppCatalogItemProps) {
  const canInstall = app.owned && !app.installedVersion && app.installState !== "installing";
  const canUpdate =
    app.owned &&
    app.installedVersion != null &&
    app.updateAvailable &&
    app.installState !== "installing";
  const canLaunch = app.owned && app.installedVersion != null && app.installState === "installed";
  const disabled = !engineReady || anyBusy;

  return (
    <div className="entitlement-item">
      <div>
        <h3>{app.name}</h3>
        <p>
          {app.installedVersion
            ? `Installed v${app.installedVersion}`
            : "Not installed"}
          {app.updateAvailable && " · Update available"}
        </p>
      </div>
      <div className="item-actions">
        {canInstall && (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => onInstall(app.id)}
            disabled={disabled}
          >
            {busy ? "Installing…" : "Install"}
          </button>
        )}
        {canUpdate && (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => onUpdate(app.id)}
            disabled={disabled}
          >
            {busy ? "Updating…" : "Update"}
          </button>
        )}
        {canLaunch && (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => onLaunch(app.id)}
            disabled={disabled}
          >
            Launch
          </button>
        )}
        {app.installedVersion && !app.updateAvailable && !canLaunch && (
          <span className="pill pill-owned">Up to date</span>
        )}
      </div>
    </div>
  );
}

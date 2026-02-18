import type { EntitledApp } from "../domain/types";
import { Card, CardHeader, Button } from "@antiphon/design-system/components";

type UpdatesViewProps = {
  entitlements: EntitledApp[];
  onUpdate: (appId: string) => void;
  engineReady: boolean;
  busyAppId: string | null;
};

export function UpdatesView({
  entitlements,
  onUpdate,
  engineReady,
  busyAppId,
}: UpdatesViewProps) {
  const withUpdates = entitlements.filter((app) => app.owned && app.updateAvailable);

  if (withUpdates.length === 0) {
    return (
      <div className="updates-view">
        <h2 className="section-title">Updates</h2>
        <p className="section-subtitle">Updates for your installed apps.</p>
        <Card variant="raised" padding="default">
          <CardHeader title="All up to date" subtitle="No updates available." />
          <p className="note-text">Your apps are current. Check back later for new versions.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="updates-view">
      <h2 className="section-title">Updates</h2>
      <p className="section-subtitle">{withUpdates.length} update{withUpdates.length !== 1 ? "s" : ""} available.</p>
      <div className="updates-actions">
        <Button
          variant="primary"
          size="compact"
          onClick={() => withUpdates.forEach((app) => onUpdate(app.id))}
          disabled={!engineReady || busyAppId !== null}
        >
          {busyAppId ? "Updating…" : "Update all"}
        </Button>
      </div>
      <div className="updates-list">
        {withUpdates.map((app) => (
          <Card key={app.id} variant="raised" padding="default" className="update-card">
            <div className="update-card-main">
              <div>
                <h3 className="update-card-title">{app.name}</h3>
                <p className="update-card-version">
                  {app.installedVersion ?? "—"} → {app.version}
                </p>
              </div>
              <Button
                variant="primary"
                size="compact"
                onClick={() => onUpdate(app.id)}
                disabled={!engineReady || busyAppId !== null}
              >
                {busyAppId === app.id ? "Updating…" : "Update"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

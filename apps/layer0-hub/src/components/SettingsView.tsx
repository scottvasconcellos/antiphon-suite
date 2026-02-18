import { useState, useCallback } from "react";
import { Card, CardHeader, Input, Button } from "@antiphon/design-system/components";
import type { HubSession } from "../domain/types";

type SettingsViewProps = {
  session: HubSession | null;
};

export function SettingsView({ session }: SettingsViewProps) {
  const [installPath, setInstallPath] = useState("~/.antiphon/apps");
  const [contactMessage, setContactMessage] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [featureSent, setFeatureSent] = useState(false);

  const handleContactSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!contactMessage.trim()) return;
      setContactSent(true);
      setContactMessage("");
    },
    [contactMessage]
  );

  const handleFeatureSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!featureRequest.trim()) return;
      setFeatureSent(true);
      setFeatureRequest("");
    },
    [featureRequest]
  );

  return (
    <div className="settings-grid">
      <Card variant="raised" padding="default">
        <CardHeader
          title="Install location"
          subtitle="Where apps are installed on this machine."
        />
        <div className="settings-field">
          <Input
            id="install-path"
            type="text"
            label="Install path"
            value={installPath}
            onChange={(e) => setInstallPath(e.target.value)}
            placeholder="~/.antiphon/apps"
          />
          <p className="settings-hint">
            Override with <code>ANTIPHON_APPS_DIR</code> env var.
          </p>
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader
          title="Account"
          subtitle="Your Antiphon account details."
        />
        <div className="settings-field">
          {session ? (
            <div className="settings-account">
              <p className="settings-value">{session.displayName || session.email}</p>
              <p className="settings-muted">{session.email}</p>
            </div>
          ) : (
            <p className="settings-muted">Sign in to see account info.</p>
          )}
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader
          title="Billing"
          subtitle="Manage your subscription."
        />
        <p className="settings-muted">
          Billing management is coming soon. Contact support for changes.
        </p>
      </Card>

      <Card variant="raised" padding="default" className="settings-wide">
        <CardHeader
          title="Contact"
          subtitle="Send us a message."
        />
        <form onSubmit={handleContactSubmit} className="settings-field">
          <label htmlFor="contact-message" className="hardware-label">Message</label>
          <textarea
            id="contact-message"
            value={contactMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactMessage(e.target.value)}
            placeholder="Your message…"
            disabled={contactSent}
            className="hub-textarea"
          />
          <div className="button-row settings-form-actions">
            <Button type="submit" variant="primary" size="compact" disabled={contactSent || !contactMessage.trim()}>
              {contactSent ? "Sent" : "Send"}
            </Button>
          </div>
        </form>
      </Card>

      <Card variant="raised" padding="default" className="settings-wide">
        <CardHeader
          title="Request feature"
          subtitle="Suggest a feature or improvement."
        />
        <form onSubmit={handleFeatureSubmit} className="settings-field">
          <label htmlFor="feature-request" className="hardware-label">Feature request</label>
          <textarea
            id="feature-request"
            value={featureRequest}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeatureRequest(e.target.value)}
            placeholder="Describe the feature…"
            disabled={featureSent}
            className="hub-textarea"
          />
          <div className="button-row settings-form-actions">
            <Button type="submit" variant="primary" size="compact" disabled={featureSent || !featureRequest.trim()}>
              {featureSent ? "Submitted" : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

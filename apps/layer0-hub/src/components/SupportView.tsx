import { useState, useCallback } from "react";
import { Card, Button } from "@antiphon/design-system/components";

const FAQ_ITEMS = [
  {
    q: "How do I install an app?",
    a: "Sign in, go to Library, find the app you own, and click Install. The app will download and install to your chosen Application location.",
  },
  {
    q: "How do I update an app?",
    a: "When an update is available, the app card shows Update. Go to Updates to see all apps with updates, or click Update on an individual app.",
  },
  {
    q: "Where are my apps installed?",
    a: "Go to Preferences → File management to see and change Download, Application, and Content locations. The default Application location is ~/.antiphon/apps.",
  },
  {
    q: "How do I uninstall an app?",
    a: "Remove the app folder from your Application location (see Preferences → File management). On macOS you can also move the app from Applications to Trash if it was installed there.",
  },
  {
    q: "How do I add a serial number?",
    a: "Go to Add Serial, enter your serial, and submit. Your license will be linked to your account.",
  },
  {
    q: "Where can I see my order history?",
    a: "Go to Preferences → Billing and click Manage billing and orders to view past orders and invoices.",
  },
  {
    q: "How do I contact support?",
    a: "Use the Contact form below. We respond within 1–2 business days.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. Contact support with your order details. Refunds are handled in accordance with our terms.",
  },
];

export function SupportView() {
  const [contactMessage, setContactMessage] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [featureSent, setFeatureSent] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

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
    <div className="support-view">
      <h2 className="section-title">Support</h2>
      <p className="section-subtitle">FAQ, how to uninstall, and contact options.</p>

      <Card variant="raised" padding="default">
        <h3 className="category-label">How to uninstall products</h3>
        <p className="note-text">
          To uninstall an Antiphon app: remove its folder from your Application location (Preferences → File
          management). On macOS, you can drag the app from Applications to Trash. On Windows, use Settings → Apps to
          uninstall.
        </p>
      </Card>

      <Card variant="raised" padding="default">
        <h3 className="category-label">Contact support</h3>
        <p className="note-text" style={{ marginBottom: "1rem" }}>
          Email us at{" "}
          <a
            href="mailto:support@antiphon.audio"
            className="hub-link-button"
            style={{ display: "inline" }}
          >
            support@antiphon.audio
          </a>
          {" "}or use the contact form below. We respond within 1–2 business days.
        </p>
      </Card>

      <Card variant="raised" padding="default">
        <h3 className="category-label">Frequently asked questions</h3>
        <dl className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="faq-item">
              <dt className="faq-question">{item.q}</dt>
              <dd className="faq-answer">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card variant="raised" padding="default" className="settings-wide">
        <button
          type="button"
          className="settings-collapse-header"
          onClick={() => setContactOpen((v) => !v)}
          aria-expanded={contactOpen}
        >
          <span>Contact</span>
          <span aria-hidden="true">{contactOpen ? "−" : "+"}</span>
        </button>
        {contactOpen && (
          <div className="settings-collapse-content">
            <p className="settings-muted">
              Send us a message. You can also email{" "}
              <a href="mailto:support@antiphon.audio" className="hub-link-button" style={{ display: "inline" }}>
                support@antiphon.audio
              </a>
              {" "}directly.
            </p>
            <form onSubmit={handleContactSubmit} className="settings-field">
              <label htmlFor="support-contact-message" className="hardware-label">
                Message
              </label>
              <textarea
                id="support-contact-message"
                value={contactMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactMessage(e.target.value)}
                placeholder="Your message…"
                disabled={contactSent}
                className="hub-textarea"
              />
              <div className="button-row settings-form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="compact"
                  disabled={contactSent || !contactMessage.trim()}
                >
                  {contactSent ? "Sent" : "Send"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      <Card variant="raised" padding="default" className="settings-wide">
        <button
          type="button"
          className="settings-collapse-header"
          onClick={() => setFeatureOpen((v) => !v)}
          aria-expanded={featureOpen}
        >
          <span>Request feature</span>
          <span aria-hidden="true">{featureOpen ? "−" : "+"}</span>
        </button>
        {featureOpen && (
          <div className="settings-collapse-content">
            <p className="settings-muted">Suggest a feature or improvement.</p>
            <form onSubmit={handleFeatureSubmit} className="settings-field">
              <label htmlFor="support-feature-request" className="hardware-label">
                Feature request
              </label>
              <textarea
                id="support-feature-request"
                value={featureRequest}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeatureRequest(e.target.value)}
                placeholder="Describe the feature…"
                disabled={featureSent}
                className="hub-textarea"
              />
              <div className="button-row settings-form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="compact"
                  disabled={featureSent || !featureRequest.trim()}
                >
                  {featureSent ? "Submitted" : "Submit"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}

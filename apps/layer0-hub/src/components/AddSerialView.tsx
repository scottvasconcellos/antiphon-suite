import { useState, useCallback } from "react";
import { Card, CardHeader, Input, Button } from "@antiphon/design-system/components";

export function AddSerialView() {
  const [serial, setSerial] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!serial.trim()) return;
      setSubmitted(true);
      setSerial("");
    },
    [serial]
  );

  return (
    <div className="add-serial-view">
      <h2 className="section-title">Paste serial number</h2>
      <p className="section-subtitle">Enter your license key below to link it to your account. Validation is handled by our entitlement service.</p>

      <Card variant="raised" padding="default">
        <CardHeader
          title="Redeem"
          subtitle="Paste one serial at a time; your licenses appear below once linked."
        />
        {submitted ? (
          <p className="note-text">Serial submitted. Your license will be linked shortly. If you don't see it, contact support.</p>
        ) : (
          <form onSubmit={handleSubmit} className="settings-field">
            <label htmlFor="serial-input" className="hardware-label">
              Serial number
            </label>
            <Input
              id="serial-input"
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
            />
            <div className="settings-form-actions">
              <Button type="submit" variant="primary" size="compact" disabled={!serial.trim()}>
                Redeem
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

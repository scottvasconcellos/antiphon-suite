import { useState, useCallback } from "react";
import { Card, CardHeader, Input, Button } from "@antiphon/design-system/components";

type RedeemResult = {
  success: true;
  productId: string;
  productName: string;
} | {
  success: false;
  reason: string;
};

type AddSerialViewProps = {
  onRedeem: (serial: string) => Promise<RedeemResult>;
  engineReady: boolean;
};

export function AddSerialView({ onRedeem, engineReady }: AddSerialViewProps) {
  const [serial, setSerial] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!serial.trim() || isSubmitting || !engineReady) return;

      setIsSubmitting(true);
      setResult(null);

      try {
        const redeemResult = await onRedeem(serial.trim());
        setResult(redeemResult);
        if (redeemResult.success) {
          setSerial("");
        }
      } catch (error) {
        setResult({
          success: false,
          reason: error instanceof Error ? error.message : "Unknown error occurred"
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [serial, isSubmitting, engineReady, onRedeem]
  );

  return (
    <div className="add-serial-view">
      <h2 className="section-title">Redeem license key</h2>
      <p className="section-subtitle">
        Enter your license key below to link it to your account. Your license will appear in your library once redeemed.
      </p>

      <Card variant="raised" padding="default">
        <CardHeader
          title="Redeem"
          subtitle="Paste one serial at a time; your licenses appear below once linked."
        />
        {result?.success ? (
          <div className="settings-field">
            <p className="note-text" style={{ color: "var(--color-success)" }}>
              ✓ License redeemed successfully! {result.productName} is now available in your library.
            </p>
          </div>
        ) : result?.success === false ? (
          <div className="settings-field">
            <p className="note-text" style={{ color: "var(--color-error)" }}>
              ✗ {result.reason || "Failed to redeem serial. Please check the key and try again."}
            </p>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="settings-field">
          <label htmlFor="serial-input" className="hardware-label">
            License key
          </label>
          <Input
            id="serial-input"
            type="text"
            value={serial}
            onChange={(e) => {
              setSerial(e.target.value);
              setResult(null);
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            disabled={isSubmitting || !engineReady}
          />
          <div className="settings-form-actions">
            <Button
              type="submit"
              variant="primary"
              size="compact"
              disabled={!serial.trim() || isSubmitting || !engineReady}
            >
              {isSubmitting ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
          {!engineReady && (
            <p className="note-text" style={{ marginTop: "0.5rem" }}>
              Please sign in to redeem a license key.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}

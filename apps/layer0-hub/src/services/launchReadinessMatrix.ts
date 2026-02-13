import { issueLaunchToken, verifyLaunchToken } from "../domain/launchTokenBoundary";
import { type HubSnapshot } from "../domain/types";

const TOKEN_SECRET = "antiphon.layer1.launch";
const TOKEN_TTL_SECONDS = 3600;

export type LaunchReadinessEntry = {
  appId: string;
  ready: boolean;
  reason: "token_issued" | "not_owned" | "not_installed";
};

function deterministicEpoch(snapshot: HubSnapshot): number {
  const source = snapshot.offlineCache.lastValidatedAt ?? snapshot.session?.signedInAt ?? "2026-02-13T00:00:00.000Z";
  return Math.floor(new Date(source).getTime() / 1000);
}

export function toLaunchReadinessMatrix(snapshot: HubSnapshot): LaunchReadinessEntry[] {
  const issuedAt = deterministicEpoch(snapshot);
  return [...snapshot.entitlements]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((app) => {
      if (!app.owned) {
        return { appId: app.id, ready: false, reason: "not_owned" };
      }
      if (!app.installedVersion) {
        return { appId: app.id, ready: false, reason: "not_installed" };
      }
      const token = issueLaunchToken(
        {
          appId: app.id,
          userId: snapshot.session?.userId ?? "offline-user",
          entitlementOutcome: snapshot.session ? "Authorized" : "OfflineAuthorized",
          issuedAt,
          expiresAt: issuedAt + TOKEN_TTL_SECONDS
        },
        TOKEN_SECRET
      );
      const verified = verifyLaunchToken(token, TOKEN_SECRET, issuedAt);
      return {
        appId: app.id,
        ready: verified.valid,
        reason: "token_issued"
      };
    });
}

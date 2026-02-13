import { decideEntitlement, type EntitlementDecisionInput } from "../domain/entitlementDecision";
import { remediationForReason } from "./controlPlaneReasonTaxonomy";
import { type LayerAppManifest, normalizeLayerAppManifests } from "./appCatalog";

export type MultiAppEntitlementInput = {
  appId: string;
  requiredEntitlements: string[];
  grantedEntitlements: string[];
  decisionInput: EntitlementDecisionInput;
};

export type MultiAppEntitlementDecision = {
  appId: string;
  outcome: "Authorized" | "Denied";
  reasonCode: string;
  remediation: string;
};

export function decideMultiAppEntitlements(inputs: MultiAppEntitlementInput[]): MultiAppEntitlementDecision[] {
  return [...inputs]
    .sort((a, b) => a.appId.localeCompare(b.appId))
    .map((entry) => {
      const base = decideEntitlement(entry.decisionInput);
      if (!(base.outcome === "Authorized" || base.outcome === "OfflineAuthorized")) {
        return {
          appId: entry.appId,
          outcome: "Denied",
          reasonCode: base.reason,
          remediation: remediationForReason("blocked_not_owned")
        };
      }

      const missing = entry.requiredEntitlements.filter(
        (flag) => !entry.grantedEntitlements.includes(flag)
      );
      if (missing.length > 0) {
        return {
          appId: entry.appId,
          outcome: "Denied",
          reasonCode: "blocked_not_owned",
          remediation: remediationForReason("blocked_not_owned")
        };
      }

      return {
        appId: entry.appId,
        outcome: "Authorized",
        reasonCode: "ok_version_supported",
        remediation: remediationForReason("ok_version_supported")
      };
    });
}

export function decideMultiAppEntitlementsFromManifests(
  manifests: LayerAppManifest[],
  grantedEntitlements: string[],
  decisionInput: EntitlementDecisionInput
): MultiAppEntitlementDecision[] {
  return decideMultiAppEntitlements(
    normalizeLayerAppManifests(manifests).map((manifest) => ({
      appId: manifest.id,
      requiredEntitlements: manifest.requiredEntitlements,
      grantedEntitlements,
      decisionInput
    }))
  );
}

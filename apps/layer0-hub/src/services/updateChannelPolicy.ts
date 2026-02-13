import { remediationForReason } from "./controlPlaneReasonTaxonomy";

export type UpdateCandidate = {
  appId: string;
  channel: "stable" | "beta";
  version: string;
};

export type UpdatePolicyInput = {
  appId: string;
  allowedChannel: "stable" | "beta";
  candidates: UpdateCandidate[];
};

export type UpdatePolicyDecision = {
  appId: string;
  selectedVersion: string | null;
  reasonCode: "ok_update_candidate_selected" | "blocked_channel_policy" | "blocked_no_update_available";
  remediation: string;
};

export const UPDATE_CHANNEL_REASON_CODES = [
  "ok_update_candidate_selected",
  "blocked_channel_policy",
  "blocked_no_update_available"
] as const;

function compareVersion(a: string, b: string): number {
  const aParts = a.replace(/[^0-9.]/g, "").split(".").map((p) => Number(p || "0"));
  const bParts = b.replace(/[^0-9.]/g, "").split(".").map((p) => Number(p || "0"));
  const max = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < max; i += 1) {
    const av = aParts[i] ?? 0;
    const bv = bParts[i] ?? 0;
    if (av !== bv) {
      return av - bv;
    }
  }
  return 0;
}

export function selectUpdateByChannelPolicy(input: UpdatePolicyInput): UpdatePolicyDecision {
  const sorted = [...input.candidates]
    .filter((candidate) => candidate.appId === input.appId)
    .sort((a, b) => {
      if (a.channel !== b.channel) {
        return a.channel.localeCompare(b.channel);
      }
      const versionOrder = compareVersion(b.version, a.version);
      if (versionOrder !== 0) {
        return versionOrder;
      }
      return a.version.localeCompare(b.version);
    });

  const allowed = sorted.filter((candidate) =>
    input.allowedChannel === "beta" ? true : candidate.channel === "stable"
  );
  if (allowed.length === 0) {
    if (sorted.length > 0) {
      return {
        appId: input.appId,
        selectedVersion: null,
        reasonCode: "blocked_channel_policy",
        remediation: remediationForReason("blocked_no_update_available")
      };
    }
    return {
      appId: input.appId,
      selectedVersion: null,
      reasonCode: "blocked_no_update_available",
      remediation: remediationForReason("blocked_no_update_available")
    };
  }

  return {
    appId: input.appId,
    selectedVersion: allowed[0].version,
    reasonCode: "ok_update_candidate_selected",
    remediation: remediationForReason("ok_version_supported")
  };
}

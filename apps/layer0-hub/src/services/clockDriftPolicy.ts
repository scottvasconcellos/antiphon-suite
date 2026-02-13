export type ClockDriftInput = {
  nowIso: string;
  lastValidatedAt: string | null;
  offlineDaysRemaining: number;
  maxClockSkewSeconds?: number;
};

export type ClockDriftDecision = {
  outcome: "OfflineFresh" | "OfflineExpired" | "ClockSkewDetected";
  reasonCode: "ok_offline_entitlement_fresh" | "offline_entitlement_expired" | "clock_skew_detected";
  remediation: "none" | "refresh_online_session";
};

export const CLOCK_DRIFT_REASON_CODES = [
  "ok_offline_entitlement_fresh",
  "offline_entitlement_expired",
  "clock_skew_detected"
] as const;

export const CLOCK_DRIFT_POLICY_REASON_CODES = [
  ...CLOCK_DRIFT_REASON_CODES,
  "ok_mixed_entitlement_timestamps",
  "mixed_entitlement_timestamps_skewed"
] as const;

const DEFAULT_MAX_SKEW_SECONDS = 300;

export function evaluateClockDrift(input: ClockDriftInput): ClockDriftDecision {
  const maxSkewSeconds = input.maxClockSkewSeconds ?? DEFAULT_MAX_SKEW_SECONDS;
  if (input.lastValidatedAt === null) {
    return {
      outcome: "OfflineExpired",
      reasonCode: "offline_entitlement_expired",
      remediation: "refresh_online_session"
    };
  }

  const nowSeconds = Math.floor(new Date(input.nowIso).getTime() / 1000);
  const lastValidatedSeconds = Math.floor(new Date(input.lastValidatedAt).getTime() / 1000);
  const skewSeconds = nowSeconds - lastValidatedSeconds;
  if (!Number.isFinite(skewSeconds) || Math.abs(skewSeconds) > maxSkewSeconds) {
    return {
      outcome: "ClockSkewDetected",
      reasonCode: "clock_skew_detected",
      remediation: "refresh_online_session"
    };
  }

  if (input.offlineDaysRemaining <= 0) {
    return {
      outcome: "OfflineExpired",
      reasonCode: "offline_entitlement_expired",
      remediation: "refresh_online_session"
    };
  }

  return {
    outcome: "OfflineFresh",
    reasonCode: "ok_offline_entitlement_fresh",
    remediation: "none"
  };
}

export type MixedTimestampInput = {
  nowIso: string;
  evaluatedAt: string[];
  maxSpreadSeconds?: number;
};

export type MixedTimestampDecision = {
  reasonCode: "ok_mixed_entitlement_timestamps" | "mixed_entitlement_timestamps_skewed";
  remediation: "none" | "refresh_online_session";
  spreadSeconds: number;
};

export function evaluateMixedEntitlementTimestamps(input: MixedTimestampInput): MixedTimestampDecision {
  if (input.evaluatedAt.length === 0) {
    return {
      reasonCode: "ok_mixed_entitlement_timestamps",
      remediation: "none",
      spreadSeconds: 0
    };
  }

  const sorted = [...input.evaluatedAt]
    .map((value) => Math.floor(new Date(value).getTime() / 1000))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const min = sorted[0] ?? Math.floor(new Date(input.nowIso).getTime() / 1000);
  const max = sorted[sorted.length - 1] ?? min;
  const spreadSeconds = max - min;
  const maxSpreadSeconds = input.maxSpreadSeconds ?? 300;

  if (spreadSeconds > maxSpreadSeconds) {
    return {
      reasonCode: "mixed_entitlement_timestamps_skewed",
      remediation: "refresh_online_session",
      spreadSeconds
    };
  }

  return {
    reasonCode: "ok_mixed_entitlement_timestamps",
    remediation: "none",
    spreadSeconds
  };
}

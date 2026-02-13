export const CONTROL_PLANE_TRUST_ENVELOPE = {
  entitlementDecision: {
    latencyTier: "instant",
    latencyBudgetMs: 25,
    failureBudgetPct: 0.1
  },
  installUpdateAuthority: {
    latencyTier: "short",
    latencyBudgetMs: 300,
    failureBudgetPct: 1
  },
  launchTokenBoundary: {
    latencyTier: "instant",
    latencyBudgetMs: 25,
    failureBudgetPct: 0.1
  },
  offlineCache: {
    latencyTier: "instant",
    latencyBudgetMs: 15,
    failureBudgetPct: 0.1
  }
} as const;

export type TrustEnvelopeView = {
  operation: "entitlementDecision" | "installUpdateAuthority" | "launchTokenBoundary" | "offlineCache";
  latencyTier: "instant" | "short";
  latencyBudgetMs: number;
  failureBudgetPct: number;
};

export function toTrustEnvelopeView(): TrustEnvelopeView[] {
  return Object.entries(CONTROL_PLANE_TRUST_ENVELOPE)
    .map(([operation, value]) => ({
      operation: operation as TrustEnvelopeView["operation"],
      latencyTier: value.latencyTier,
      latencyBudgetMs: value.latencyBudgetMs,
      failureBudgetPct: value.failureBudgetPct
    }))
    .sort((a, b) => a.operation.localeCompare(b.operation));
}

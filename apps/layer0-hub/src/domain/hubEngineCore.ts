import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
import { type EntitledApp, type HubSnapshot, type HubState } from "./types";

export type HubEvent =
  | { type: "BOOTSTRAP_SYNCED"; entitlements: EntitledApp[]; offlineCache: HubSnapshot["offlineCache"]; transactions: HubSnapshot["transactions"] }
  | {
      type: "SIGNED_IN";
      session: NonNullable<HubSnapshot["session"]>;
      entitlements: EntitledApp[];
      offlineCache: HubSnapshot["offlineCache"];
      transactions: HubSnapshot["transactions"];
    }
  | { type: "SIGNED_OUT" }
  | { type: "ENTITLEMENTS_REFRESHED"; entitlements: EntitledApp[]; offlineCache: HubSnapshot["offlineCache"]; transactions: HubSnapshot["transactions"] }
  | { type: "APP_INSTALLED"; app: EntitledApp; transactions: HubSnapshot["transactions"] }
  | { type: "APP_UPDATED"; app: EntitledApp; transactions: HubSnapshot["transactions"] }
  | { type: "TRANSACTIONS_SYNCED"; transactions: HubSnapshot["transactions"] }
  | { type: "RESET" };

function upsertApp(entitlements: EntitledApp[], app: EntitledApp): EntitledApp[] {
  const index = entitlements.findIndex((candidate) => candidate.id === app.id);
  if (index === -1) {
    return sortEntitlements([...entitlements, app]);
  }
  const copy = [...entitlements];
  copy[index] = app;
  return sortEntitlements(copy);
}

function sortEntitlements(entitlements: EntitledApp[]): EntitledApp[] {
  return [...entitlements].sort((a, b) => a.id.localeCompare(b.id));
}

function sortTransactions(transactions: HubSnapshot["transactions"]): HubSnapshot["transactions"] {
  return [...transactions].sort((a, b) => {
    if (a.occurredAt === b.occurredAt) {
      return a.id.localeCompare(b.id);
    }
    return a.occurredAt.localeCompare(b.occurredAt);
  });
}

export function applyHubEvent(snapshot: HubSnapshot, event: HubEvent): HubState {
  switch (event.type) {
    case "BOOTSTRAP_SYNCED":
      return {
        snapshot: {
          ...snapshot,
          entitlements: sortEntitlements(event.entitlements),
          offlineCache: event.offlineCache,
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: "Hub connected to entitlement authority.", code: "ok_bootstrap_synced" }
      };
    case "SIGNED_IN":
      return {
        snapshot: {
          ...snapshot,
          session: event.session,
          entitlements: sortEntitlements(event.entitlements),
          offlineCache: event.offlineCache,
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: "Identity authenticated and ownership refreshed.", code: "ok_signed_in" }
      };
    case "SIGNED_OUT":
      return {
        snapshot: {
          ...snapshot,
          session: null
        },
        status: { mode: "ready", message: "Signed out. Existing offline cache remains available.", code: "ok_signed_out" }
      };
    case "ENTITLEMENTS_REFRESHED":
      return {
        snapshot: {
          ...snapshot,
          entitlements: sortEntitlements(event.entitlements),
          offlineCache: event.offlineCache,
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: "Entitlements refreshed.", code: "ok_entitlements_refreshed" }
      };
    case "APP_INSTALLED":
      return {
        snapshot: {
          ...snapshot,
          entitlements: upsertApp(snapshot.entitlements, event.app),
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: `Install transaction completed for ${event.app.name}.`, code: "ok_install_completed" }
      };
    case "APP_UPDATED":
      return {
        snapshot: {
          ...snapshot,
          entitlements: upsertApp(snapshot.entitlements, event.app),
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: `Update transaction completed for ${event.app.name}.`, code: "ok_update_completed" }
      };
    case "TRANSACTIONS_SYNCED":
      return {
        snapshot: {
          ...snapshot,
          transactions: sortTransactions(event.transactions)
        },
        status: { mode: "ready", message: "Transaction log synchronized.", code: "ok_transactions_synced" }
      };
    case "RESET":
      return {
        snapshot: DEFAULT_HUB_SNAPSHOT,
        status: {
          mode: "configuration-error",
          message: "Hub reset. Configure VITE_ANTIPHON_API_URL to continue.",
          code: "config_reset"
        }
      };
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

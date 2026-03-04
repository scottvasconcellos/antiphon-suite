import { DEFAULT_HUB_SNAPSHOT } from "./defaults";
function upsertApp(entitlements, app) {
    const index = entitlements.findIndex((candidate) => candidate.id === app.id);
    if (index === -1) {
        return [...entitlements, app];
    }
    const copy = [...entitlements];
    copy[index] = app;
    return copy;
}
export function applyHubEvent(snapshot, event) {
    switch (event.type) {
        case "BOOTSTRAP_SYNCED":
            return {
                snapshot: {
                    ...snapshot,
                    entitlements: event.entitlements,
                    offlineCache: event.offlineCache,
                    transactions: event.transactions
                },
                status: { mode: "ready", message: "Hub connected to entitlement authority." }
            };
        case "SIGNED_IN":
            return {
                snapshot: {
                    ...snapshot,
                    session: event.session,
                    entitlements: event.entitlements,
                    offlineCache: event.offlineCache,
                    transactions: event.transactions
                },
                status: { mode: "ready", message: "Identity authenticated and ownership refreshed." }
            };
        case "SIGNED_OUT":
            return {
                snapshot: {
                    ...snapshot,
                    session: null
                },
                status: { mode: "ready", message: "Signed out. Existing offline cache remains available." }
            };
        case "ENTITLEMENTS_REFRESHED":
            return {
                snapshot: {
                    ...snapshot,
                    entitlements: event.entitlements,
                    offlineCache: event.offlineCache,
                    transactions: event.transactions
                },
                status: { mode: "ready", message: "Entitlements refreshed." }
            };
        case "APP_INSTALLED":
            return {
                snapshot: {
                    ...snapshot,
                    entitlements: upsertApp(snapshot.entitlements, event.app),
                    transactions: event.transactions
                },
                status: { mode: "ready", message: `Install transaction completed for ${event.app.name}.` }
            };
        case "APP_UPDATED":
            return {
                snapshot: {
                    ...snapshot,
                    entitlements: upsertApp(snapshot.entitlements, event.app),
                    transactions: event.transactions
                },
                status: { mode: "ready", message: `Update transaction completed for ${event.app.name}.` }
            };
        case "TRANSACTIONS_SYNCED":
            return {
                snapshot: {
                    ...snapshot,
                    transactions: event.transactions
                },
                status: { mode: "ready", message: "Transaction log synchronized." }
            };
        case "RESET":
            return {
                snapshot: DEFAULT_HUB_SNAPSHOT,
                status: {
                    mode: "configuration-error",
                    message: "Hub reset. Configure VITE_ANTIPHON_API_URL to continue."
                }
            };
        default: {
            const exhaustive = event;
            return exhaustive;
        }
    }
}

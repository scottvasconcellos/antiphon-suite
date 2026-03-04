export function toMusicIntelligenceInput(snapshot) {
    return {
        hasSession: Boolean(snapshot.session),
        ownedCount: snapshot.entitlements.filter((app) => app.owned).length,
        installedCount: snapshot.entitlements.filter((app) => app.installedVersion).length,
        offlineDaysRemaining: snapshot.offlineCache.offlineDaysRemaining
    };
}

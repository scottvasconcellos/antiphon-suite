export function toControlPlaneOperations(snapshot, limit = 5) {
    return [...snapshot.transactions]
        .sort((a, b) => {
        if (a.occurredAt === b.occurredAt) {
            return a.id.localeCompare(b.id);
        }
        return b.occurredAt.localeCompare(a.occurredAt);
    })
        .slice(0, limit)
        .map((tx) => ({
        id: tx.id,
        appId: tx.appId,
        action: tx.action,
        status: tx.status,
        occurredAt: tx.occurredAt
    }));
}

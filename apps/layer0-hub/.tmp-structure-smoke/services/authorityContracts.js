function asRecord(value, context) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${context} contract mismatch.`);
    }
    return value;
}
function asString(record, key, context) {
    if (typeof record[key] !== "string") {
        throw new Error(`${context}.${key} contract mismatch.`);
    }
    return record[key];
}
function asBoolean(record, key, context) {
    if (typeof record[key] !== "boolean") {
        throw new Error(`${context}.${key} contract mismatch.`);
    }
    return record[key];
}
function asNullableString(record, key, context) {
    const value = record[key];
    if (typeof value === "string" || value === null) {
        return value;
    }
    throw new Error(`${context}.${key} contract mismatch.`);
}
function asNumber(record, key, context) {
    if (typeof record[key] !== "number" || Number.isNaN(record[key])) {
        throw new Error(`${context}.${key} contract mismatch.`);
    }
    return record[key];
}
export function parseSession(payload) {
    const record = asRecord(payload, "session");
    return {
        userId: asString(record, "userId", "session"),
        email: asString(record, "email", "session"),
        displayName: asString(record, "displayName", "session"),
        signedInAt: asString(record, "signedInAt", "session")
    };
}
export function parseEntitledApp(payload) {
    const record = asRecord(payload, "entitledApp");
    return {
        id: asString(record, "id", "entitledApp"),
        name: asString(record, "name", "entitledApp"),
        version: asString(record, "version", "entitledApp"),
        installedVersion: asNullableString(record, "installedVersion", "entitledApp"),
        owned: asBoolean(record, "owned", "entitledApp"),
        installState: asString(record, "installState", "entitledApp"),
        updateAvailable: asBoolean(record, "updateAvailable", "entitledApp")
    };
}
export function parseEntitlements(payload) {
    if (!Array.isArray(payload)) {
        throw new Error("entitlements contract mismatch.");
    }
    return payload.map((entry) => parseEntitledApp(entry));
}
export function parseOfflineCache(payload) {
    const record = asRecord(payload, "offlineCache");
    return {
        lastValidatedAt: asNullableString(record, "lastValidatedAt", "offlineCache"),
        maxOfflineDays: asNumber(record, "maxOfflineDays", "offlineCache"),
        offlineDaysRemaining: asNumber(record, "offlineDaysRemaining", "offlineCache"),
        cacheState: asString(record, "cacheState", "offlineCache")
    };
}
export function parseTransactions(payload) {
    if (!Array.isArray(payload)) {
        throw new Error("transactions contract mismatch.");
    }
    return payload.map((entry) => {
        const record = asRecord(entry, "transaction");
        return {
            id: asString(record, "id", "transaction"),
            appId: asString(record, "appId", "transaction"),
            appName: asString(record, "appName", "transaction"),
            action: asString(record, "action", "transaction"),
            status: asString(record, "status", "transaction"),
            message: asString(record, "message", "transaction"),
            occurredAt: asString(record, "occurredAt", "transaction")
        };
    });
}

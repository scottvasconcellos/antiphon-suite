import { parseEntitledApp, parseEntitlements, parseOfflineCache, parseSession, parseTransactions } from "./authorityContracts.js";
function normalizeApiError(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "Unknown API error";
}
async function requestJson(url, init) {
    const response = await fetch(url, {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {})
        }
    });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const payload = (await response.json());
            if (payload.message) {
                message = payload.message;
            }
        }
        catch {
            // keep default message
        }
        throw new Error(message);
    }
    return (await response.json());
}
export class HttpHubGateway {
    apiBaseUrl;
    constructor(config) {
        this.apiBaseUrl = config.apiBaseUrl;
    }
    async signIn(email) {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/auth/session`, {
                method: "POST",
                body: JSON.stringify({ email })
            });
            return parseSession(payload);
        }
        catch (error) {
            throw new Error(`Sign-in failed: ${normalizeApiError(error)}`);
        }
    }
    async signInWithFirebase(idToken) {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/auth/firebase`, {
                method: "POST",
                body: JSON.stringify({ idToken })
            });
            return parseSession(payload);
        }
        catch (error) {
            throw new Error(`Firebase sign-in failed: ${normalizeApiError(error)}`);
        }
    }
    async signOut() {
        try {
            await requestJson(`${this.apiBaseUrl}/auth/session`, { method: "DELETE" });
        }
        catch (error) {
            throw new Error(`Sign-out failed: ${normalizeApiError(error)}`);
        }
    }
    async fetchEntitlements() {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/entitlements`);
            return parseEntitlements(payload);
        }
        catch (error) {
            throw new Error(`Entitlement fetch failed: ${normalizeApiError(error)}`);
        }
    }
    async refreshEntitlements() {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/entitlements/refresh`, { method: "POST" });
            return parseOfflineCache(payload);
        }
        catch (error) {
            throw new Error(`Entitlement refresh failed: ${normalizeApiError(error)}`);
        }
    }
    async installApp(appId) {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/installs/${appId}`, { method: "POST" });
            return parseEntitledApp(payload);
        }
        catch (error) {
            throw new Error(`Install failed: ${normalizeApiError(error)}`);
        }
    }
    async applyUpdate(appId) {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/updates/${appId}`, { method: "POST" });
            return parseEntitledApp(payload);
        }
        catch (error) {
            throw new Error(`Update failed: ${normalizeApiError(error)}`);
        }
    }
    async getOfflineCacheState() {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/offline-cache/status`);
            return parseOfflineCache(payload);
        }
        catch (error) {
            throw new Error(`Offline cache lookup failed: ${normalizeApiError(error)}`);
        }
    }
    async fetchTransactions() {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/transactions`);
            return parseTransactions(payload);
        }
        catch (error) {
            throw new Error(`Transaction fetch failed: ${normalizeApiError(error)}`);
        }
    }
    async redeemSerial(serial) {
        try {
            const payload = await requestJson(`${this.apiBaseUrl}/redeem`, {
                method: "POST",
                body: JSON.stringify({ serial })
            });
            if (typeof payload === "object" && payload !== null) {
                const result = payload;
                if (result.success === true && result.productId && result.productName) {
                    return {
                        success: true,
                        productId: result.productId,
                        productName: result.productName,
                        entitlements: result.entitlements ? parseEntitlements(result.entitlements) : []
                    };
                }
                if (result.success === false && result.reason) {
                    return { success: false, reason: result.reason };
                }
            }
            throw new Error("Invalid response format");
        }
        catch (error) {
            const message = normalizeApiError(error);
            return { success: false, reason: message };
        }
    }
}

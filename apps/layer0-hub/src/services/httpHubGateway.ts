import { type HubGateway } from "../domain/ports";
import { type EntitledApp, type HubConfig, type HubSession, type OfflineCacheState, type InstallTransaction } from "../domain/types";

type ApiError = {
  message?: string;
};

function normalizeApiError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown API error";
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
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
      const payload = (await response.json()) as ApiError;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export class HttpHubGateway implements HubGateway {
  private readonly apiBaseUrl: string;

  constructor(config: HubConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  async signIn(email: string): Promise<HubSession> {
    try {
      return await requestJson<HubSession>(`${this.apiBaseUrl}/auth/session`, {
        method: "POST",
        body: JSON.stringify({ email })
      });
    } catch (error) {
      throw new Error(`Sign-in failed: ${normalizeApiError(error)}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      await requestJson<{ ok: boolean }>(`${this.apiBaseUrl}/auth/session`, { method: "DELETE" });
    } catch (error) {
      throw new Error(`Sign-out failed: ${normalizeApiError(error)}`);
    }
  }

  async fetchEntitlements(): Promise<EntitledApp[]> {
    try {
      return await requestJson<EntitledApp[]>(`${this.apiBaseUrl}/entitlements`);
    } catch (error) {
      throw new Error(`Entitlement fetch failed: ${normalizeApiError(error)}`);
    }
  }

  async refreshEntitlements(): Promise<OfflineCacheState> {
    try {
      return await requestJson<OfflineCacheState>(`${this.apiBaseUrl}/entitlements/refresh`, { method: "POST" });
    } catch (error) {
      throw new Error(`Entitlement refresh failed: ${normalizeApiError(error)}`);
    }
  }

  async installApp(appId: string): Promise<EntitledApp> {
    try {
      return await requestJson<EntitledApp>(`${this.apiBaseUrl}/installs/${appId}`, { method: "POST" });
    } catch (error) {
      throw new Error(`Install failed: ${normalizeApiError(error)}`);
    }
  }

  async applyUpdate(appId: string): Promise<EntitledApp> {
    try {
      return await requestJson<EntitledApp>(`${this.apiBaseUrl}/updates/${appId}`, { method: "POST" });
    } catch (error) {
      throw new Error(`Update failed: ${normalizeApiError(error)}`);
    }
  }

  async getOfflineCacheState(): Promise<OfflineCacheState> {
    try {
      return await requestJson<OfflineCacheState>(`${this.apiBaseUrl}/offline-cache/status`);
    } catch (error) {
      throw new Error(`Offline cache lookup failed: ${normalizeApiError(error)}`);
    }
  }

  async fetchTransactions(): Promise<InstallTransaction[]> {
    try {
      return await requestJson<InstallTransaction[]>(`${this.apiBaseUrl}/transactions`);
    } catch (error) {
      throw new Error(`Transaction fetch failed: ${normalizeApiError(error)}`);
    }
  }
}

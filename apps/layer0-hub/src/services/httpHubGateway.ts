import { type HubGateway } from "../domain/ports";
import { type EntitledApp, type HubConfig, type HubSession, type OfflineCacheState, type InstallTransaction } from "../domain/types";
import {
  parseEntitledApp,
  parseEntitlements,
  parseOfflineCache,
  parseSession,
  parseTransactions
} from "./authorityContracts";

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
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/auth/session`, {
        method: "POST",
        body: JSON.stringify({ email })
      });
      return parseSession(payload);
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
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/entitlements`);
      return parseEntitlements(payload);
    } catch (error) {
      throw new Error(`Entitlement fetch failed: ${normalizeApiError(error)}`);
    }
  }

  async refreshEntitlements(): Promise<OfflineCacheState> {
    try {
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/entitlements/refresh`, { method: "POST" });
      return parseOfflineCache(payload);
    } catch (error) {
      throw new Error(`Entitlement refresh failed: ${normalizeApiError(error)}`);
    }
  }

  async installApp(appId: string): Promise<EntitledApp> {
    try {
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/installs/${appId}`, { method: "POST" });
      return parseEntitledApp(payload);
    } catch (error) {
      throw new Error(`Install failed: ${normalizeApiError(error)}`);
    }
  }

  async applyUpdate(appId: string): Promise<EntitledApp> {
    try {
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/updates/${appId}`, { method: "POST" });
      return parseEntitledApp(payload);
    } catch (error) {
      throw new Error(`Update failed: ${normalizeApiError(error)}`);
    }
  }

  async getOfflineCacheState(): Promise<OfflineCacheState> {
    try {
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/offline-cache/status`);
      return parseOfflineCache(payload);
    } catch (error) {
      throw new Error(`Offline cache lookup failed: ${normalizeApiError(error)}`);
    }
  }

  async fetchTransactions(): Promise<InstallTransaction[]> {
    try {
      const payload = await requestJson<unknown>(`${this.apiBaseUrl}/transactions`);
      return parseTransactions(payload);
    } catch (error) {
      throw new Error(`Transaction fetch failed: ${normalizeApiError(error)}`);
    }
  }
}

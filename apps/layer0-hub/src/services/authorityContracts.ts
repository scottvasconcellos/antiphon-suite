import { type EntitledApp, type HubSession, type InstallTransaction, type OfflineCacheState } from "../domain/types";

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} contract mismatch.`);
  }
  return value as Record<string, unknown>;
}

function asString(record: Record<string, unknown>, key: string, context: string): string {
  if (typeof record[key] !== "string") {
    throw new Error(`${context}.${key} contract mismatch.`);
  }
  return record[key] as string;
}

function asBoolean(record: Record<string, unknown>, key: string, context: string): boolean {
  if (typeof record[key] !== "boolean") {
    throw new Error(`${context}.${key} contract mismatch.`);
  }
  return record[key] as boolean;
}

function asNullableString(record: Record<string, unknown>, key: string, context: string): string | null {
  const value = record[key];
  if (typeof value === "string" || value === null) {
    return value;
  }
  throw new Error(`${context}.${key} contract mismatch.`);
}

function asNumber(record: Record<string, unknown>, key: string, context: string): number {
  if (typeof record[key] !== "number" || Number.isNaN(record[key])) {
    throw new Error(`${context}.${key} contract mismatch.`);
  }
  return record[key] as number;
}

export function parseSession(payload: unknown): HubSession {
  const record = asRecord(payload, "session");
  return {
    userId: asString(record, "userId", "session"),
    email: asString(record, "email", "session"),
    displayName: asString(record, "displayName", "session"),
    signedInAt: asString(record, "signedInAt", "session")
  };
}

export function parseEntitledApp(payload: unknown): EntitledApp {
  const record = asRecord(payload, "entitledApp");
  return {
    id: asString(record, "id", "entitledApp"),
    name: asString(record, "name", "entitledApp"),
    version: asString(record, "version", "entitledApp"),
    installedVersion: asNullableString(record, "installedVersion", "entitledApp"),
    owned: asBoolean(record, "owned", "entitledApp"),
    installState: asString(record, "installState", "entitledApp") as EntitledApp["installState"],
    updateAvailable: asBoolean(record, "updateAvailable", "entitledApp")
  };
}

export function parseEntitlements(payload: unknown): EntitledApp[] {
  if (!Array.isArray(payload)) {
    throw new Error("entitlements contract mismatch.");
  }
  return payload.map((entry) => parseEntitledApp(entry));
}

export function parseOfflineCache(payload: unknown): OfflineCacheState {
  const record = asRecord(payload, "offlineCache");
  return {
    lastValidatedAt: asNullableString(record, "lastValidatedAt", "offlineCache"),
    maxOfflineDays: asNumber(record, "maxOfflineDays", "offlineCache"),
    offlineDaysRemaining: asNumber(record, "offlineDaysRemaining", "offlineCache"),
    cacheState: asString(record, "cacheState", "offlineCache") as OfflineCacheState["cacheState"]
  };
}

export function parseTransactions(payload: unknown): InstallTransaction[] {
  if (!Array.isArray(payload)) {
    throw new Error("transactions contract mismatch.");
  }
  return payload.map((entry) => {
    const record = asRecord(entry, "transaction");
    return {
      id: asString(record, "id", "transaction"),
      appId: asString(record, "appId", "transaction"),
      appName: asString(record, "appName", "transaction"),
      action: asString(record, "action", "transaction") as InstallTransaction["action"],
      status: asString(record, "status", "transaction") as InstallTransaction["status"],
      message: asString(record, "message", "transaction"),
      occurredAt: asString(record, "occurredAt", "transaction")
    };
  });
}

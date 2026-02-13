export type AppCatalogEntry = {
  appId: string;
  version: string;
  channel: "stable" | "beta";
  installedVersion: string | null;
  availableVersion: string;
  requiredEntitlements: string[];
};

export function normalizeAppCatalog(entries: AppCatalogEntry[]): AppCatalogEntry[] {
  return [...entries]
    .map((entry) => ({
      ...entry,
      requiredEntitlements: [...entry.requiredEntitlements].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => a.appId.localeCompare(b.appId));
}

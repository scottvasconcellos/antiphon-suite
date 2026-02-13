export type AppCatalogEntry = {
  appId: string;
  version: string;
  channel: "stable" | "beta";
  installedVersion: string | null;
  availableVersion: string;
  requiredEntitlements: string[];
};

export type LayerAppManifest = {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
  requiredEntitlements: string[];
  updateChannel: "stable" | "beta";
};

export function normalizeLayerAppManifests(manifests: LayerAppManifest[]): LayerAppManifest[] {
  return [...manifests]
    .map((manifest) => ({
      ...manifest,
      requiredEntitlements: [...manifest.requiredEntitlements].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function layerManifestsToCatalogEntries(
  manifests: LayerAppManifest[],
  installedVersions: Record<string, string | null> = {}
): AppCatalogEntry[] {
  return normalizeLayerAppManifests(manifests).map((manifest) => ({
    appId: manifest.id,
    version: manifest.version,
    channel: manifest.updateChannel,
    installedVersion: installedVersions[manifest.id] ?? null,
    availableVersion: manifest.version,
    requiredEntitlements: [...manifest.requiredEntitlements]
  }));
}

export function normalizeAppCatalog(entries: AppCatalogEntry[]): AppCatalogEntry[] {
  return [...entries]
    .map((entry) => ({
      ...entry,
      requiredEntitlements: [...entry.requiredEntitlements].sort((a, b) => a.localeCompare(b))
    }))
    .sort((a, b) => a.appId.localeCompare(b.appId));
}

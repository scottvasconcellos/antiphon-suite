export function normalizeLayerAppManifests(manifests) {
    return [...manifests]
        .map((manifest) => ({
        ...manifest,
        requiredEntitlements: [...manifest.requiredEntitlements].sort((a, b) => a.localeCompare(b))
    }))
        .sort((a, b) => a.id.localeCompare(b.id));
}
export function layerManifestsToCatalogEntries(manifests, installedVersions = {}) {
    return normalizeLayerAppManifests(manifests).map((manifest) => ({
        appId: manifest.id,
        version: manifest.version,
        channel: manifest.updateChannel,
        installedVersion: installedVersions[manifest.id] ?? null,
        availableVersion: manifest.version,
        requiredEntitlements: [...manifest.requiredEntitlements]
    }));
}
export function normalizeAppCatalog(entries) {
    return [...entries]
        .map((entry) => ({
        ...entry,
        requiredEntitlements: [...entry.requiredEntitlements].sort((a, b) => a.localeCompare(b))
    }))
        .sort((a, b) => a.appId.localeCompare(b.appId));
}

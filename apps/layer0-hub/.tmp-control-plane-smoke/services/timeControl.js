export const SYSTEM_TIME_CONTROL = {
    nowIso: () => new Date().toISOString()
};
export const ARTIFACT_SIGNATURE_MAX_SKEW_SECONDS = 300;
export const CLOCK_DRIFT_MAX_SKEW_SECONDS = 300;
export const TIMESTAMP_SPREAD_MAX_SECONDS = 300;
export const TRUST_ARTIFACT_MAX_SKEW_SECONDS = 60 * 60 * 24 * 365;
export const PERSISTED_CACHE_MAX_SKEW_SECONDS = 60 * 60 * 24 * 365;
export function toEpochSeconds(iso) {
    return Math.floor(new Date(iso).getTime() / 1000);
}
export function stableNowIso(timeControl) {
    return (timeControl ?? SYSTEM_TIME_CONTROL).nowIso();
}

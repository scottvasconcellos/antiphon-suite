export const LAUNCH_TOKEN_REASON_CODES = [
    "malformed",
    "signature_invalid",
    "expired",
    "claims_invalid"
];
function encode(value) {
    return encodeURIComponent(value).replaceAll(".", "%2E");
}
function decode(value) {
    return decodeURIComponent(value);
}
function sign(payload, secret) {
    const input = `${payload}|${secret}`;
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `sig_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
export function issueLaunchToken(claims, secret) {
    const header = { alg: "HS256", typ: "L0T" };
    const encodedHeader = encode(JSON.stringify(header));
    const encodedClaims = encode(JSON.stringify(claims));
    const payload = `${encodedHeader}.${encodedClaims}`;
    const signature = sign(payload, secret);
    return `${payload}.${signature}`;
}
function parseClaims(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    const r = raw;
    if (typeof r.appId !== "string" ||
        typeof r.userId !== "string" ||
        (r.entitlementOutcome !== "Authorized" && r.entitlementOutcome !== "OfflineAuthorized") ||
        typeof r.issuedAt !== "number" ||
        typeof r.expiresAt !== "number") {
        return null;
    }
    return r;
}
export function verifyLaunchToken(token, secret, nowEpochSeconds) {
    const parts = token.split(".");
    if (parts.length !== 3) {
        return { valid: false, reason: "malformed" };
    }
    const [header, claims, signature] = parts;
    const payload = `${header}.${claims}`;
    const expectedSignature = sign(payload, secret);
    if (signature !== expectedSignature) {
        return { valid: false, reason: "signature_invalid" };
    }
    let parsedClaims = null;
    try {
        parsedClaims = parseClaims(JSON.parse(decode(claims)));
    }
    catch {
        return { valid: false, reason: "malformed" };
    }
    if (!parsedClaims) {
        return { valid: false, reason: "claims_invalid" };
    }
    if (nowEpochSeconds > parsedClaims.expiresAt) {
        return { valid: false, reason: "expired" };
    }
    return { valid: true, reason: "verified", claims: parsedClaims };
}

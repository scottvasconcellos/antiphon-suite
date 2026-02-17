/**
 * Verify a Firebase ID token using Google's public keys (no service account).
 * Uses https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
 */
import { createPublicKey } from "node:crypto";
import { jwtVerify, type JWTPayload } from "jose";

const FIREBASE_X509_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedKeys: Record<string, string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour; respect Cache-Control in production if needed

async function getPublicKeys(): Promise<Record<string, string>> {
  if (cachedKeys && Date.now() < cacheExpiry) {
    return cachedKeys;
  }
  const res = await fetch(FIREBASE_X509_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch Firebase public keys");
  }
  const keys = (await res.json()) as Record<string, string>;
  const maxAge = res.headers.get("cache-control")?.match(/max-age=(\d+)/);
  cacheExpiry = Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : CACHE_TTL_MS);
  cachedKeys = keys;
  return keys;
}

export type FirebaseDecodedToken = JWTPayload & {
  sub: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Verify a Firebase ID token and return decoded claims.
 * @param projectId - Firebase project ID (e.g. antiphon-sso)
 * @param idToken - The Firebase ID token JWT from the client
 */
export async function verifyFirebaseIdToken(
  projectId: string,
  idToken: string
): Promise<FirebaseDecodedToken> {
  const keys = await getPublicKeys();
  const [headerB64] = idToken.split(".");
  const header = JSON.parse(
    Buffer.from(headerB64, "base64url").toString("utf-8")
  ) as { kid?: string };
  const kid = header.kid;
  if (!kid || !keys[kid]) {
    throw new Error("Invalid token: unknown key id");
  }
  const pem = keys[kid];
  const publicKey = createPublicKey(pem);
  const { payload } = await jwtVerify(idToken, publicKey, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload as FirebaseDecodedToken;
}

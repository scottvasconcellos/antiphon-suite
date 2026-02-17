/**
 * Firebase web app config from env. Used to initialize Firebase Auth in the Hub.
 * All values from env (e.g. VITE_FIREBASE_*); do not commit secrets.
 */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function fromEnv(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (typeof apiKey !== "string" || !apiKey || typeof authDomain !== "string" || !authDomain || typeof projectId !== "string" || !projectId) {
    return null;
  }
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? "";
  const measurementId = typeof import.meta.env.VITE_FIREBASE_MEASUREMENT_ID === "string" ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined;
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId
  };
}

function fromJson(): FirebaseWebConfig | null {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  if (typeof raw !== "string" || !raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as FirebaseWebConfig).apiKey === "string" &&
      typeof (parsed as FirebaseWebConfig).authDomain === "string" &&
      typeof (parsed as FirebaseWebConfig).projectId === "string"
    ) {
      return parsed as FirebaseWebConfig;
    }
  } catch {
    // ignore
  }
  return null;
}

let cached: FirebaseWebConfig | null | undefined = undefined;

export function getFirebaseConfig(): FirebaseWebConfig | null {
  if (cached !== undefined) return cached;
  cached = fromJson() ?? fromEnv();
  return cached;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

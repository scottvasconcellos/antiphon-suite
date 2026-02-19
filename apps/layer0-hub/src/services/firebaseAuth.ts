import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePhoneNumber,
  verifyBeforeUpdateEmail,
  PhoneAuthProvider,
  RecaptchaVerifier,
  GoogleAuthProvider,
  OAuthProvider,
  type User,
  type UserCredential
} from "firebase/auth";
import { getFirebaseConfig } from "../config/firebaseConfig";

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  const config = getFirebaseConfig();
  if (!config) return null;
  const existing = getApps();
  if (existing.length > 0) {
    app = getApp();
    return app;
  }
  app = initializeApp(config);
  return app;
}

export function getFirebaseAuth() {
  const a = getFirebaseApp();
  if (!a) return null;
  return getAuth(a);
}

export async function signInWithGoogle(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithApple(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const provider = new OAuthProvider("apple.com");
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmail(email: string, password: string): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function getIdToken(user: User): Promise<string> {
  return user.getIdToken();
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
}

/**
 * Subscribe to Firebase auth state. Use this so profile UI appears once Firebase
 * has restored the user (e.g. after refresh when session is from persisted snapshot).
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
}

export async function updateProfileDisplayName(user: User, displayName: string): Promise<void> {
  await updateProfile(user, { displayName });
}

export async function updateProfilePhotoURL(user: User, photoURL: string): Promise<void> {
  await updateProfile(user, { photoURL });
}

/**
 * Sends a verification email to the new address; user must click the link to complete.
 * May throw if re-authentication is required (e.g. auth/requires-recent-login).
 */
export async function sendEmailChangeVerification(user: User, newEmail: string): Promise<void> {
  await verifyBeforeUpdateEmail(user, newEmail);
}

/**
 * Start phone number verification. Returns verificationId to pass to confirmPhoneAndUpdate.
 * Creates an invisible RecaptchaVerifier on the given container (element id or HTMLElement).
 * Enable Phone sign-in in Firebase Console and add your domain to authorized domains.
 */
export async function sendPhoneVerificationCode(
  phoneNumberE164: string,
  recaptchaContainer: string | HTMLElement
): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured.");
  const verifier = new RecaptchaVerifier(auth, recaptchaContainer, { size: "invisible" });
  const provider = new PhoneAuthProvider(auth);
  try {
    return await provider.verifyPhoneNumber(phoneNumberE164, verifier);
  } finally {
    verifier.clear();
  }
}

/**
 * Complete phone number change with the code sent to the user's phone.
 */
export async function confirmPhoneAndUpdate(user: User, verificationId: string, code: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured.");
  const credential = PhoneAuthProvider.credential(verificationId, code);
  await updatePhoneNumber(user, credential);
}

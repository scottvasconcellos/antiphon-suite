import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

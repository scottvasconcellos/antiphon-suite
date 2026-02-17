import { type HubState } from "./types";

export type HubEngineContract = {
  bootstrap(): Promise<HubState>;
  signIn(email: string): Promise<HubState>;
  signInWithFirebase(idToken: string): Promise<HubState>;
  signOut(): Promise<HubState>;
  refreshEntitlements(): Promise<HubState>;
  installApp(appId: string): Promise<HubState>;
  applyUpdate(appId: string): Promise<HubState>;
  syncTransactions(): Promise<HubState>;
  reset(): HubState;
};

import { type HubSnapshot, type HubSession, type OfflineCacheState, type EntitledApp, type InstallTransaction } from "./types";

export type RedeemSerialResult = {
  success: true;
  productId: string;
  productName: string;
  entitlements: EntitledApp[];
} | {
  success: false;
  reason: string;
};

export type HubGateway = {
  signIn(email: string): Promise<HubSession>;
  signInWithFirebase(idToken: string): Promise<HubSession>;
  signOut(): Promise<void>;
  fetchEntitlements(): Promise<EntitledApp[]>;
  refreshEntitlements(): Promise<OfflineCacheState>;
  installApp(appId: string): Promise<EntitledApp>;
  applyUpdate(appId: string): Promise<EntitledApp>;
  getOfflineCacheState(): Promise<OfflineCacheState>;
  fetchTransactions(): Promise<InstallTransaction[]>;
  redeemSerial(serial: string): Promise<RedeemSerialResult>;
};

export type HubStore = {
  load(): HubSnapshot;
  save(snapshot: HubSnapshot): HubSnapshot;
};

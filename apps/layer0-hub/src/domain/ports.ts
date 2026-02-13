import { type HubSnapshot, type HubSession, type OfflineCacheState, type EntitledApp, type InstallTransaction } from "./types";

export type HubGateway = {
  signIn(email: string): Promise<HubSession>;
  signOut(): Promise<void>;
  fetchEntitlements(): Promise<EntitledApp[]>;
  refreshEntitlements(): Promise<OfflineCacheState>;
  installApp(appId: string): Promise<EntitledApp>;
  applyUpdate(appId: string): Promise<EntitledApp>;
  getOfflineCacheState(): Promise<OfflineCacheState>;
  fetchTransactions(): Promise<InstallTransaction[]>;
};

export type HubStore = {
  load(): HubSnapshot;
  save(snapshot: HubSnapshot): HubSnapshot;
};

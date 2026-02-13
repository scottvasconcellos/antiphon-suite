import { type HubSnapshot, type HubSession, type OfflineCacheState, type EntitledApp } from "./types";

export type HubGateway = {
  signIn(email: string): Promise<HubSession>;
  signOut(): Promise<void>;
  fetchEntitlements(): Promise<EntitledApp[]>;
  refreshEntitlements(): Promise<OfflineCacheState>;
  installApp(appId: string): Promise<EntitledApp>;
  applyUpdate(appId: string): Promise<EntitledApp>;
  getOfflineCacheState(): Promise<OfflineCacheState>;
};

export type HubStore = {
  load(): HubSnapshot;
  save(snapshot: HubSnapshot): HubSnapshot;
};

import { type HubState } from "./types";
import { type MusicPipelineResult } from "./musicEngineContracts";

export type HubEngineContract = {
  bootstrap(): Promise<HubState>;
  signIn(email: string): Promise<HubState>;
  signOut(): Promise<HubState>;
  refreshEntitlements(): Promise<HubState>;
  installApp(appId: string): Promise<HubState>;
  applyUpdate(appId: string): Promise<HubState>;
  syncTransactions(): Promise<HubState>;
  runMusicIntelligence(): MusicPipelineResult;
  reset(): HubState;
};

import { evaluateMusicIntelligence, toMusicIntelligenceInput, type MusicIntelligenceDecision } from "../domain/musicIntelligenceEngine";
import { type HubSnapshot } from "../domain/types";

export function runMusicIntelligence(snapshot: HubSnapshot): MusicIntelligenceDecision {
  const input = toMusicIntelligenceInput(snapshot);
  return evaluateMusicIntelligence(input);
}

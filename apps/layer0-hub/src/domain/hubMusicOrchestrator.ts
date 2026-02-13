import { type HubSnapshot } from "./types";
import {
  type MusicEnginePlugin,
  type MusicIntelligenceOutput,
  type MusicPipelineResult,
  type MusicProjectionAdapter,
  toMusicIntelligenceInput
} from "./musicEngineContracts";

function isValidOutput(output: unknown): output is MusicIntelligenceOutput {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return false;
  }
  const record = output as Record<string, unknown>;
  return (
    (record.lane === "authenticate" || record.lane === "install" || record.lane === "create") &&
    typeof record.reason === "string" &&
    typeof record.confidence === "number"
  );
}

export function runMusicPipeline(
  snapshot: HubSnapshot,
  engine: MusicEnginePlugin,
  adapter: MusicProjectionAdapter
): MusicPipelineResult {
  try {
    const input = toMusicIntelligenceInput(snapshot);
    const output = engine.evaluate(input);
    if (!isValidOutput(output)) {
      return {
        status: "runtime-error",
        message: `Engine contract violation from ${engine.id}.`,
        projection: null
      };
    }
    return {
      status: "ready",
      message: `Engine ${engine.id} evaluated.`,
      projection: adapter.toProjection(output)
    };
  } catch (error) {
    return {
      status: "runtime-error",
      message: error instanceof Error ? error.message : "Unknown engine runtime failure.",
      projection: null
    };
  }
}

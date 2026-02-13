import { type HubSnapshot } from "./types";
import {
  type MusicIntelligenceOutput,
  type MusicPipelineResult,
  type MusicProjectionAdapter,
  toMusicIntelligenceInput
} from "./musicEngineContracts";
import { type MusicEngineSelection } from "./musicEngineRegistry";

function isValidOutput(output: unknown): output is MusicIntelligenceOutput {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return false;
  }
  const record = output as Record<string, unknown>;
  return (
    (record.lane === "authenticate" || record.lane === "install" || record.lane === "create") &&
    typeof record.reason === "string" &&
    typeof record.confidence === "number" &&
    Number.isFinite(record.confidence)
  );
}

export function runMusicPipeline(
  snapshot: HubSnapshot,
  selection: MusicEngineSelection,
  adapter: MusicProjectionAdapter
): MusicPipelineResult {
  const engine = selection.engine;
  try {
    const input = toMusicIntelligenceInput(snapshot);
    const output = engine.evaluate(input);
    if (!isValidOutput(output)) {
      return {
        status: "runtime-error",
        message: `Engine contract violation from ${engine.id}.`,
        engineId: engine.id,
        selectionSource: selection.source,
        selectionReason: selection.reason,
        projection: null
      };
    }
    return {
      status: "ready",
      message: `Engine ${engine.id} evaluated.`,
      engineId: engine.id,
      selectionSource: selection.source,
      selectionReason: selection.reason,
      projection: adapter.toProjection(output)
    };
  } catch (error) {
    return {
      status: "runtime-error",
      message: error instanceof Error ? error.message : "Unknown engine runtime failure.",
      engineId: engine.id,
      selectionSource: selection.source,
      selectionReason: selection.reason,
      projection: null
    };
  }
}

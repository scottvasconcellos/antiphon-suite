import { type MusicIntelligenceOutput, type MusicProjectionAdapter, type UiMusicProjection } from "./musicEngineContracts";

export const UiMusicProjectionAdapter: MusicProjectionAdapter = {
  id: "ui-music-projection-v1",
  toProjection(output: MusicIntelligenceOutput): UiMusicProjection {
    const headline =
      output.lane === "authenticate"
        ? "Authenticate to continue"
        : output.lane === "install"
          ? "Install recommended tools"
          : "Ready to create";

    return {
      lane: output.lane,
      headline,
      detail: output.reason,
      confidencePct: Math.round(Math.max(0, Math.min(1, output.confidence)) * 100)
    };
  }
};

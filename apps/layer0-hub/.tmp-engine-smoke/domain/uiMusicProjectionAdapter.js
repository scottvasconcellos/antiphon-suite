export const UiMusicProjectionAdapter = {
    id: "ui-music-projection-v1",
    toProjection(output) {
        const headline = output.lane === "authenticate"
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
